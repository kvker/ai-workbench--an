const express = require('express');
const { execFile } = require('node:child_process');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { promisify } = require('node:util');
const { syncPmSkillsForFlow } = require('../services/skillSyncService');
const { ensureDemandWorkspace, resolveWorkspaceUserId } = require('../services/workspaceService');

const router = express.Router();
const ZIP_BODY_LIMIT = '100mb';
const RAW_INPUT_OVERWRITE_FILES = [];
const execFileAsync = promisify(execFile);

router.post('/:issueId/workspace/ensure', async (req, res, next) => {
  try {
    const workspace = await prepareIssueWorkspace(req);

    res.json(toWorkspaceResponse(workspace));
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
    const documentRegionPath = path.join(workspace.workspacePath, 'artifacts', workspace.branchName);

    await fs.mkdir(documentRegionPath, { recursive: true });
    await openPath(documentRegionPath);

    res.json({
      status: 'opened',
      path: documentRegionPath,
    });
  } catch (error) {
    next(error);
  }
});

async function prepareIssueWorkspace(req) {
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

  await syncPmSkillsForFlow({
    flowSteps: [{ sequence: 0, title: '需求新建', status: 'current' }],
    workspacePath: workspace.workspacePath,
  });

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

async function openPath(targetPath) {
  const platform = os.platform();
  const command = platform === 'darwin' ? 'open' : platform === 'win32' ? 'cmd' : 'xdg-open';
  const args = platform === 'win32' ? ['/c', 'start', '', targetPath] : [targetPath];

  await new Promise((resolve, reject) => {
    execFile(command, args, (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
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
