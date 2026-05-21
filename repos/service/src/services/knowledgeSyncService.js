const { execFile } = require('node:child_process');
const fs = require('node:fs/promises');
const path = require('node:path');
const { promisify } = require('node:util');

const execFileAsync = promisify(execFile);
const GIT_PULL_TIMEOUT_MS = 120_000;

const ROLE_SOURCE_DIRS = {
  pm: { skills: 'pm', agents: 'pm' },
  fe: { skills: 'fe', agents: 'fe' },
  be: { skills: 'be', agents: 'be' },
  qa: { skills: 'qa', agents: 'qa' },
};

async function syncKnowledgeForIdentity({ identity, workspacePath }) {
  const role = normalizeIdentity(identity);

  if (!workspacePath) {
    const error = new Error('workspacePath is required.');
    error.statusCode = 400;
    throw error;
  }

  const knowledgeRootDir = resolveKnowledgeRootDir();

  if (!knowledgeRootDir) {
    const error = new Error('KNOWLEDGE_ROOT_DIR is not configured.');
    error.statusCode = 400;
    throw error;
  }

  await assertDirectory(knowledgeRootDir, 'KNOWLEDGE_ROOT_DIR does not exist.');
  await assertDirectory(workspacePath, 'Workspace does not exist.');
  await pullKnowledgeRoot(knowledgeRootDir);

  const copied = [];
  const missing = [];

  await replaceDirectory({
    sourcePath: path.join(knowledgeRootDir, 'background'),
    targetPath: path.join(workspacePath, 'background'),
    label: 'background',
    copied,
    missing,
  });

  await replaceDirectory({
    sourcePath: path.join(knowledgeRootDir, 'conventions'),
    targetPath: path.join(workspacePath, 'conventions'),
    label: 'conventions',
    copied,
    missing,
  });

  await replaceMergedDirectories({
    sourcePaths: [
      path.join(knowledgeRootDir, 'skills', ROLE_SOURCE_DIRS[role].skills),
      path.join(knowledgeRootDir, 'skills', 'shared'),
    ],
    targetPath: path.join(workspacePath, '.codex', 'skills'),
    label: 'skills',
    copied,
    missing,
  });

  await replaceMergedDirectories({
    sourcePaths: [
      path.join(knowledgeRootDir, 'agents', ROLE_SOURCE_DIRS[role].agents),
      path.join(knowledgeRootDir, 'agents', 'shared'),
    ],
    targetPath: path.join(workspacePath, '.codex', 'agents'),
    label: 'agents',
    copied,
    missing,
  });

  return {
    status: missing.length > 0 ? 'partial' : 'synced',
    identity: role,
    knowledgeRootDir,
    workspacePath,
    copied,
    missing,
  };
}

function normalizeIdentity(identity) {
  const role = String(identity || '').trim();

  if (Object.hasOwn(ROLE_SOURCE_DIRS, role)) {
    return role;
  }

  const error = new Error('Unsupported identity.');
  error.statusCode = 400;
  throw error;
}

async function replaceDirectory({ sourcePath, targetPath, label, copied, missing }) {
  if (!(await isDirectory(sourcePath))) {
    missing.push({ label, sourcePath });
    await fs.rm(targetPath, { recursive: true, force: true });
    await fs.mkdir(targetPath, { recursive: true });
    return;
  }

  await fs.rm(targetPath, { recursive: true, force: true });
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.cp(sourcePath, targetPath, { recursive: true });
  copied.push({ label, sourcePath, targetPath });
}

async function replaceMergedDirectories({ sourcePaths, targetPath, label, copied, missing }) {
  await fs.rm(targetPath, { recursive: true, force: true });
  await fs.mkdir(targetPath, { recursive: true });

  for (const sourcePath of sourcePaths) {
    if (!(await isDirectory(sourcePath))) {
      missing.push({ label, sourcePath });
      continue;
    }

    await copyDirectoryContents(sourcePath, targetPath);
    copied.push({ label, sourcePath, targetPath });
  }
}

async function copyDirectoryContents(sourcePath, targetPath) {
  const entries = await fs.readdir(sourcePath, { withFileTypes: true });

  for (const entry of entries) {
    const sourceEntryPath = path.join(sourcePath, entry.name);
    const targetEntryPath = path.join(targetPath, entry.name);

    await fs.rm(targetEntryPath, { recursive: true, force: true });
    await fs.cp(sourceEntryPath, targetEntryPath, { recursive: true });
  }
}

async function pullKnowledgeRoot(knowledgeRootDir) {
  try {
    await execFileAsync('git', ['pull', 'origin', 'main'], {
      cwd: knowledgeRootDir,
      timeout: GIT_PULL_TIMEOUT_MS,
      maxBuffer: 1024 * 1024 * 10,
    });
  } catch (error) {
    if (error.killed && error.signal === 'SIGTERM') {
      const timeoutError = new Error('Git pull timed out while syncing knowledge root.');
      timeoutError.statusCode = 504;
      throw timeoutError;
    }

    throw error;
  }
}

function resolveKnowledgeRootDir() {
  const rawRootDir = process.env.KNOWLEDGE_ROOT_DIR;

  if (!rawRootDir) {
    return null;
  }

  return path.isAbsolute(rawRootDir)
    ? path.resolve(rawRootDir)
    : path.resolve(getServiceRootDir(), rawRootDir);
}

function getServiceRootDir() {
  return path.resolve(__dirname, '../..');
}

async function assertDirectory(targetPath, message) {
  if (await isDirectory(targetPath)) {
    return;
  }

  const error = new Error(message);
  error.statusCode = 400;
  throw error;
}

async function isDirectory(targetPath) {
  try {
    const stats = await fs.stat(targetPath);
    return stats.isDirectory();
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }

    return false;
  }
}

module.exports = {
  ROLE_SOURCE_DIRS,
  normalizeIdentity,
  syncKnowledgeForIdentity,
};
