const { execFile } = require('node:child_process');
const fs = require('node:fs/promises');
const path = require('node:path');
const { promisify } = require('node:util');

const execFileAsync = promisify(execFile);
const GIT_UPDATE_TIMEOUT_MS = 120_000;

async function updateWorkspaceCode(workspacePath) {
  if (!workspacePath) {
    const error = new Error('workspacePath is required.');
    error.statusCode = 400;
    throw error;
  }

  await assertDirectory(workspacePath, 'Workspace does not exist.');

  const repositories = [workspacePath, ...await listRepoDirectories(path.join(workspacePath, 'repos'))];
  const updated = [];
  const failed = [];

  for (const repositoryPath of repositories) {
    try {
      const branchName = await getCurrentBranch(repositoryPath);
      const result = await pullRebaseCurrentBranch({ repositoryPath, branchName });

      updated.push({
        path: repositoryPath,
        branchName,
        stdout: result.stdout.trim(),
        stderr: result.stderr.trim(),
      });
    } catch (error) {
      failed.push({
        path: repositoryPath,
        message: error.message,
      });
    }
  }

  return {
    status: failed.length > 0 ? 'partial' : 'updated',
    updated,
    failed,
  };
}

async function listRepoDirectories(reposRootPath) {
  if (!(await isDirectory(reposRootPath))) {
    return [];
  }

  const entries = await fs.readdir(reposRootPath, { withFileTypes: true });
  const repositories = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const repositoryPath = path.join(reposRootPath, entry.name);

    if (await isDirectory(path.join(repositoryPath, '.git'))) {
      repositories.push(repositoryPath);
    }
  }

  return repositories;
}

async function getCurrentBranch(repositoryPath) {
  const { stdout } = await execGit(['branch', '--show-current'], { cwd: repositoryPath });
  const branchName = stdout.trim();

  if (branchName) {
    return branchName;
  }

  const error = new Error('Repository is not on a branch.');
  error.statusCode = 409;
  throw error;
}

async function pullRebaseCurrentBranch({ repositoryPath, branchName }) {
  return execGit(['pull', '--rebase', 'origin', branchName], { cwd: repositoryPath });
}

async function execGit(args, options = {}) {
  try {
    return await execFileAsync('git', args, {
      ...options,
      timeout: GIT_UPDATE_TIMEOUT_MS,
      maxBuffer: 1024 * 1024 * 10,
    });
  } catch (error) {
    if (error.killed && error.signal === 'SIGTERM') {
      const timeoutError = new Error('Git command timed out while updating code.');
      timeoutError.statusCode = 504;
      throw timeoutError;
    }

    throw error;
  }
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
  listRepoDirectories,
  updateWorkspaceCode,
};
