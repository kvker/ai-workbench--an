const express = require('express');
const { execFile } = require('node:child_process');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { promisify } = require('node:util');
const { updateWorkspaceCode } = require('../services/codeUpdateService');
const { syncKnowledgeForIdentity } = require('../services/knowledgeSyncService');
const { startPmRawAnalysis } = require('../services/pmRawAnalysisService');
const { ensureDemandWorkspace, resolveWorkspaceUserId } = require('../services/workspaceService');

const router = express.Router();
const ZIP_BODY_LIMIT = '100mb';
const RAW_INPUT_OVERWRITE_FILES = [];
const FLOW_STATUS_NODE_MAP = {
  0: 'pm-raw',
  1: 'pm-demo',
  2: 'pm-handoff',
  3: 'dev-confirm',
  4: 'coding',
  5: 'dev-handoff',
  6: 'qa-confirm',
  7: 'qa-testing',
  8: 'qa-handoff',
  9: 'archive',
};
const execFileAsync = promisify(execFile);

router.post('/:issueId/workspace/ensure', async (req, res, next) => {
  try {
    const workspace = await prepareIssueWorkspace(req);

    res.json(toWorkspaceResponse(workspace));
  } catch (error) {
    next(error);
  }
});

router.get('/:issueId/artifacts', async (req, res, next) => {
  try {
    const workspace = await prepareIssueWorkspace(req, { syncKnowledge: false });
    const artifactsRoot = path.join(workspace.workspacePath, 'artifacts', workspace.branchName);
    const files = await listArtifactFiles(artifactsRoot);

    res.json({
      artifactsRoot,
      files,
      workspace: toWorkspaceResponse(workspace),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:issueId/artifacts/preview', async (req, res, next) => {
  try {
    const workspace = await prepareIssueWorkspace(req, { syncKnowledge: false });
    const artifactsRoot = path.join(workspace.workspacePath, 'artifacts', workspace.branchName);
    const artifactPath = await resolveArtifactPath(artifactsRoot, req.query.path);
    const stats = await fs.stat(artifactPath);

    if (!stats.isFile()) {
      res.status(400).json({ message: 'Artifact path must be a file.' });
      return;
    }

    const content = await fs.readFile(artifactPath, 'utf8');

    res.json({
      title: path.basename(artifactPath),
      path: artifactPath,
      content,
      size: stats.size,
      updatedAt: stats.mtime.toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:issueId/flow/complete-check', async (req, res, next) => {
  try {
    const workspace = await prepareIssueWorkspace(req, { syncKnowledge: false });
    const artifactsRoot = path.join(workspace.workspacePath, 'artifacts', workspace.branchName);
    const result = await checkFlowCompletionStatus({
      artifactsRoot,
      harnessStatus: req.body?.harnessStatus,
      node: req.body?.node,
    });

    res.json({
      ...result,
      workspace: toWorkspaceResponse(workspace),
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:issueId/raw-input', express.raw({ type: ['application/zip', 'application/x-zip-compressed', 'application/octet-stream'], limit: ZIP_BODY_LIMIT }), async (req, res, next) => {
  try {
    const fileName = sanitizeZipFileName(req.query.fileName);
    const overwriteFiles = parseOverwriteFiles(req.query.overwriteFiles);
    const zipFile = Buffer.isBuffer(req.body) ? req.body : null;

    if (!fileName) {
      res.status(400).json({ message: 'A zip fileName query parameter is required.' });
      return;
    }

    if (!zipFile || zipFile.length === 0) {
      res.status(400).json({ message: 'Zip file body is required.' });
      return;
    }

    if (!isZipBuffer(zipFile)) {
      res.status(400).json({ message: 'Only zip files are supported.' });
      return;
    }

    const workspace = await prepareIssueWorkspace(req);
    const rawInputDir = path.join(workspace.workspacePath, 'artifacts', workspace.branchName, 'pm-raw', 'input');
    const tmpDir = path.join(workspace.workspacePath, 'tmp');
    const tmpZipPath = path.join(tmpDir, fileName);

    await fs.mkdir(rawInputDir, { recursive: true });
    await fs.mkdir(tmpDir, { recursive: true });
    await fs.writeFile(tmpZipPath, zipFile);

    const extraction = await extractZipToRawInput({
      rawInputDir,
      tmpZipPath,
      overwriteFiles,
    });

    res.status(extraction.uploaded.length > 0 || extraction.overwritten.length > 0 ? 201 : 200).json({
      status: extraction.uploaded.length > 0 || extraction.overwritten.length > 0 ? 'uploaded' : 'skipped',
      fileName,
      size: zipFile.length,
      tmpZipPath,
      targetDir: rawInputDir,
      ...extraction,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:issueId/document-region/open', async (req, res, next) => {
  try {
    const workspace = await prepareIssueWorkspace(req);
    const documentRegionPath = workspace.workspacePath;

    await fs.mkdir(documentRegionPath, { recursive: true });

    res.json({
      status: 'ready',
      path: documentRegionPath,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:issueId/identity/sync', async (req, res, next) => {
  try {
    const workspace = await prepareIssueWorkspace(req, { syncKnowledge: false });
    const result = await syncKnowledgeForIdentity({
      identity: req.body?.identity,
      workspacePath: workspace.workspacePath,
    });

    res.json({
      ...result,
      workspace: toWorkspaceResponse(workspace),
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:issueId/code/update', async (req, res, next) => {
  try {
    const workspace = await prepareIssueWorkspace(req);
    const result = await updateWorkspaceCode(workspace.workspacePath);

    res.json({
      ...result,
      workspace: toWorkspaceResponse(workspace),
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:issueId/pm-raw/analyze', async (req, res, next) => {
  try {
    const workspace = await prepareIssueWorkspace(req);
    const result = await startPmRawAnalysis({
      issueId: req.params.issueId,
      issueName: req.query.issueName,
      workspace,
    });

    res.status(201).json({
      ...result,
      workspace: toWorkspaceResponse(workspace),
    });
  } catch (error) {
    next(error);
  }
});

async function prepareIssueWorkspace(req, options = {}) {
  const { syncKnowledge = true } = options;
  const issueId = String(req.params.issueId || '').trim();

  if (!issueId) {
    const error = new Error('issueId is required.');
    error.statusCode = 400;
    throw error;
  }

  const workspace = await ensureDemandWorkspace({
    id: issueId,
    title: req.query.issueName,
    branch: req.query.branchName,
  }, resolveWorkspaceUserId(req));

  if (syncKnowledge) {
    await syncKnowledgeForIdentity({
      identity: req.query.identity || 'pm',
      workspacePath: workspace.workspacePath,
    });
  }

  return workspace;
}

function toWorkspaceResponse(workspace) {
  return {
    id: workspace.workspaceFolder,
    branchName: workspace.branchName,
    workspaceFolder: workspace.workspaceFolder,
    workspacePath: workspace.workspacePath,
  };
}

function sanitizeZipFileName(fileName) {
  const rawName = Array.isArray(fileName) ? fileName[0] : fileName;

  if (!rawName) {
    return '';
  }

  const baseName = path.basename(String(rawName).trim());

  if (!baseName.toLowerCase().endsWith('.zip')) {
    return '';
  }

  return baseName;
}

function parseOverwriteFiles(overwriteFiles = RAW_INPUT_OVERWRITE_FILES) {
  const rawFiles = Array.isArray(overwriteFiles) ? overwriteFiles : String(overwriteFiles || '').split(',');

  return rawFiles
    .map((fileName) => sanitizeRelativeFilePath(fileName))
    .filter(Boolean);
}

async function listArtifactFiles(artifactsRoot) {
  const nodes = await readDirectoryEntries(artifactsRoot);
  const files = [];

  for (const node of nodes) {
    if (!node.isDirectory() || node.name.startsWith('.')) {
      continue;
    }

    const nodePath = path.join(artifactsRoot, node.name);
    const entries = await readDirectoryEntries(nodePath);

    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.md')) {
        continue;
      }

      const filePath = path.join(nodePath, entry.name);
      const stats = await fs.stat(filePath);

      files.push({
        title: entry.name,
        path: filePath,
        node: node.name,
        size: stats.size,
        updatedAt: stats.mtime.toISOString(),
      });
    }
  }

  return files.sort((a, b) => {
    const byUpdatedAt = String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''));
    return byUpdatedAt || a.path.localeCompare(b.path);
  });
}

async function checkFlowCompletionStatus({ artifactsRoot, harnessStatus, node }) {
  const flowNode = resolveFlowNode({ harnessStatus, node });
  const nodePath = path.join(artifactsRoot, flowNode);
  const statusFile = {
    title: 'raw-status.md',
    path: path.join(nodePath, 'raw-status.md'),
    node: flowNode,
  };

  if (!await isFile(statusFile.path)) {
    return {
      allowed: false,
      node: flowNode,
      reason: `未找到 ${flowNode}/raw-status.md。`,
    };
  }

  const stats = await fs.stat(statusFile.path);
  const content = await fs.readFile(statusFile.path, 'utf8');
  const status = extractStatusValue(content);
  const allowed = status === '已完成';

  return {
    allowed,
    node: flowNode,
    reason: allowed ? undefined : `当前状态为「${status || '未识别'}」，需要状态行为「已完成」后才能完成该节点。`,
    status,
    statusFile: {
      ...statusFile,
      size: stats.size,
      updatedAt: stats.mtime.toISOString(),
      content,
    },
  };
}

function resolveFlowNode({ harnessStatus, node }) {
  const sanitizedNode = sanitizeArtifactNodeName(node);

  if (sanitizedNode) {
    return sanitizedNode;
  }

  const numericStatus = Number(harnessStatus);

  if (Number.isInteger(numericStatus) && FLOW_STATUS_NODE_MAP[numericStatus]) {
    return FLOW_STATUS_NODE_MAP[numericStatus];
  }

  const error = new Error('A valid flow node or harnessStatus is required.');
  error.statusCode = 400;
  throw error;
}

function extractStatusValue(content) {
  if (String(content || '').includes('已完成')) {
    return '已完成';
  }

  const lines = String(content || '').split(/\r?\n/);

  for (const line of lines) {
    const cells = parseMarkdownTableRow(line);

    if (cells.length >= 2 && normalizeStatusCell(cells[0]) === '状态') {
      return normalizeStatusCell(cells[1]);
    }
  }

  for (const line of lines) {
    const match = line.match(/^\s*(?:[-*]\s*)?(?:状态|status)\s*[:：]\s*(.+?)\s*$/i);

    if (match) {
      return normalizeStatusCell(match[1]);
    }
  }

  return '';
}

async function isFile(targetPath) {
  try {
    const stats = await fs.stat(targetPath);
    return stats.isFile();
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }

    return false;
  }
}

function parseMarkdownTableRow(line) {
  const trimmedLine = String(line || '').trim();

  if (!trimmedLine.startsWith('|') || !trimmedLine.endsWith('|')) {
    return [];
  }

  return trimmedLine
    .slice(1, -1)
    .split('|')
    .map((cell) => cell.trim());
}

function normalizeStatusCell(value) {
  return String(value || '')
    .trim()
    .replace(/^`+|`+$/g, '')
    .replace(/[*_~]/g, '')
    .trim();
}

function sanitizeArtifactNodeName(value) {
  const node = String(value || '').trim();

  if (!node || node.includes('/') || node.includes('\\') || node.includes('..')) {
    return '';
  }

  return node;
}

async function resolveArtifactPath(artifactsRoot, targetPath) {
  const rawPath = Array.isArray(targetPath) ? targetPath[0] : targetPath;
  const artifactPath = String(rawPath || '').trim();

  if (!artifactPath) {
    const error = new Error('Artifact path is required.');
    error.statusCode = 400;
    throw error;
  }

  const resolvedRoot = path.resolve(artifactsRoot);
  const resolvedPath = path.resolve(artifactPath);
  const relativePath = path.relative(resolvedRoot, resolvedPath);

  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    const error = new Error('Artifact path is outside current artifacts root.');
    error.statusCode = 400;
    throw error;
  }

  const realRoot = await fs.realpath(resolvedRoot);
  const realPath = await fs.realpath(resolvedPath);
  const realRelativePath = path.relative(realRoot, realPath);

  if (realRelativePath.startsWith('..') || path.isAbsolute(realRelativePath)) {
    const error = new Error('Artifact path resolves outside current artifacts root.');
    error.statusCode = 400;
    throw error;
  }

  return realPath;
}

async function readDirectoryEntries(targetPath) {
  try {
    return await fs.readdir(targetPath, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }

    throw error;
  }
}

function sanitizeRelativeFilePath(fileName) {
  const normalizedPath = String(fileName || '').trim().replace(/\\/g, '/');

  if (!normalizedPath || normalizedPath.startsWith('/') || normalizedPath.split('/').includes('..')) {
    return '';
  }

  return normalizedPath;
}

function isZipBuffer(file) {
  return (
    file.length >= 4 &&
    file[0] === 0x50 &&
    file[1] === 0x4b &&
    [0x03, 0x05, 0x07].includes(file[2]) &&
    [0x04, 0x06, 0x08].includes(file[3])
  );
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false;
    }

    throw error;
  }
}

async function extractZipToRawInput({ rawInputDir, tmpZipPath, overwriteFiles }) {
  const tempExtractDir = await fs.mkdtemp(path.join(os.tmpdir(), 'raw-input-zip-'));

  try {
    await execFileAsync('unzip', ['-qq', tmpZipPath, '-d', tempExtractDir], {
      timeout: 30_000,
      maxBuffer: 1024 * 1024 * 10,
    });

    const extractedFiles = await listFiles(tempExtractDir);
    const uploaded = [];
    const skipped = [];
    const overwritten = [];

    for (const extractedPath of extractedFiles) {
      const relativePath = path.relative(tempExtractDir, extractedPath);
      const targetPath = resolveRawInputPath(rawInputDir, relativePath);
      const shouldOverwrite = overwriteFiles.includes(relativePath) || overwriteFiles.includes(path.basename(relativePath));
      const exists = await pathExists(targetPath);

      if (exists && !shouldOverwrite) {
        skipped.push(relativePath);
        continue;
      }

      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.copyFile(extractedPath, targetPath);

      if (exists) {
        overwritten.push(relativePath);
      } else {
        uploaded.push(relativePath);
      }
    }

    return {
      uploaded,
      skipped,
      overwritten,
    };
  } finally {
    await fs.rm(tempExtractDir, { recursive: true, force: true });
  }
}

async function listFiles(rootDir) {
  const entries = await fs.readdir(rootDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(rootDir, entry.name);

    if (entry.isDirectory()) {
      files.push(...await listFiles(entryPath));
    } else if (entry.isFile()) {
      files.push(entryPath);
    }
  }

  return files;
}

function resolveRawInputPath(rawInputDir, relativePath) {
  const targetPath = path.resolve(rawInputDir, relativePath);
  const rootPath = path.resolve(rawInputDir);

  if (targetPath !== rootPath && targetPath.startsWith(`${rootPath}${path.sep}`)) {
    return targetPath;
  }

  const error = new Error('Zip file contains an unsafe path.');
  error.statusCode = 400;
  throw error;
}

module.exports = router;
