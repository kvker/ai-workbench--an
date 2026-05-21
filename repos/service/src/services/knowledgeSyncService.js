const { execFile } = require('node:child_process');
const fs = require('node:fs/promises');
const path = require('node:path');
const { promisify } = require('node:util');

const execFileAsync = promisify(execFile);
const GIT_PULL_TIMEOUT_MS = 120_000;
const knowledgeSyncLocks = new Map();

const ROLE_SOURCE_DIRS = {
  pm: { aliases: ['pm', 'product', 'pa'], skills: ['pm', 'product', 'pa'], conventions: ['pm', 'product', 'pa'] },
  fe: { aliases: ['fe', 'frontend'], skills: ['frontend', 'fe'], conventions: ['frontend', 'fe'] },
  be: { aliases: ['be', 'backend'], skills: ['backend', 'be'], conventions: ['backend', 'be'] },
  qa: { aliases: ['qa', 'test', 'quality'], skills: ['qa', 'test', 'quality'], conventions: ['qa', 'test', 'quality'] },
};

async function syncKnowledgeForIdentity({ identity, workspacePath }) {
  return withKnowledgeSyncLock(workspacePath, () => syncKnowledgeForIdentityUnlocked({ identity, workspacePath }));
}

async function syncKnowledgeForIdentityUnlocked({ identity, workspacePath }) {
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
  await refreshKnowledgeRoot(knowledgeRootDir);

  const copied = [];
  const missing = [];

  await replaceDirectory({
    sourcePath: path.join(knowledgeRootDir, 'background'),
    targetPath: path.join(workspacePath, 'background'),
    label: 'background',
    copied,
    missing,
  });

  await replaceMergedDirectories({
    sourceGroups: [
      createOptionalSourceGroup(knowledgeRootDir, 'conventions', ROLE_SOURCE_DIRS[role].conventions),
      createOptionalSourceGroup(knowledgeRootDir, 'conventions', ['shared']),
    ],
    targetPath: path.join(workspacePath, 'conventions'),
    label: 'conventions',
    copied,
    missing,
  });

  await replaceMergedDirectories({
    sourceGroups: [
      createOptionalSourceGroup(knowledgeRootDir, 'skills', ['shared']),
      createRoleSourceGroup(knowledgeRootDir, 'skills', ROLE_SOURCE_DIRS[role].skills),
    ],
    targetPath: path.join(workspacePath, '.codex', 'skills'),
    label: 'skills',
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

async function withKnowledgeSyncLock(workspacePath, task) {
  const lockKey = path.resolve(String(workspacePath || ''));
  const previous = knowledgeSyncLocks.get(lockKey) || Promise.resolve();
  const pending = previous
    .catch(() => undefined)
    .then(task)
    .finally(() => {
      if (knowledgeSyncLocks.get(lockKey) === pending) {
        knowledgeSyncLocks.delete(lockKey);
      }
    });

  knowledgeSyncLocks.set(lockKey, pending);
  return pending;
}

function normalizeIdentity(identity) {
  const role = String(identity || '').trim().toLowerCase();

  if (Object.hasOwn(ROLE_SOURCE_DIRS, role)) {
    return role;
  }

  for (const [normalizedRole, config] of Object.entries(ROLE_SOURCE_DIRS)) {
    if (config.aliases.includes(role)) {
      return normalizedRole;
    }
  }

  const error = new Error('Unsupported identity.');
  error.statusCode = 400;
  throw error;
}

function createRoleSourceGroup(knowledgeRootDir, category, dirNames) {
  return {
    optional: false,
    sourcePaths: resolveSourcePaths(knowledgeRootDir, category, dirNames),
  };
}

function createOptionalSourceGroup(knowledgeRootDir, category, dirNames) {
  return {
    optional: true,
    sourcePaths: resolveSourcePaths(knowledgeRootDir, category, dirNames),
  };
}

function resolveSourcePaths(knowledgeRootDir, category, dirNames) {
  return [...new Set(dirNames.map((dirName) => path.join(knowledgeRootDir, category, dirName)))];
}

async function replaceDirectory({ sourcePath, targetPath, label, copied, missing }) {
  if (!(await isDirectory(sourcePath))) {
    missing.push({ label, sourcePath });
    await fs.rm(targetPath, { recursive: true, force: true });
    await fs.mkdir(targetPath, { recursive: true });
    return;
  }

  await fs.rm(targetPath, { recursive: true, force: true });
  await fs.mkdir(targetPath, { recursive: true });
  await copyDirectoryContents(sourcePath, targetPath);
  copied.push({ label, sourcePath, targetPath });
}

async function replaceMergedDirectories({ sourceGroups, targetPath, label, copied, missing }) {
  await fs.rm(targetPath, { recursive: true, force: true });
  await fs.mkdir(targetPath, { recursive: true });

  for (const group of sourceGroups) {
    const existingSourcePaths = [];

    for (const sourcePath of group.sourcePaths) {
      if (await isDirectory(sourcePath)) {
        existingSourcePaths.push(sourcePath);
      }
    }

    if (existingSourcePaths.length === 0) {
      if (!group.optional) {
        missing.push({ label, sourcePath: group.sourcePaths.join(', ') });
      }

      continue;
    }

    for (const sourcePath of existingSourcePaths) {
      await copyDirectoryContents(sourcePath, targetPath);
      copied.push({ label, sourcePath, targetPath });
    }
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

async function refreshKnowledgeRoot(knowledgeRootDir) {
  try {
    await execFileAsync('git', ['fetch', 'origin', 'main'], {
      cwd: knowledgeRootDir,
      timeout: GIT_PULL_TIMEOUT_MS,
      maxBuffer: 1024 * 1024 * 10,
    });
  } catch (error) {
    if (error.killed && error.signal === 'SIGTERM') {
      const timeoutError = new Error('Git fetch timed out while syncing knowledge root.');
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
