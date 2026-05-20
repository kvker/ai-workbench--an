const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');

const execFileAsync = promisify(execFile);
const GIT_TIMEOUT_MS = 30_000;
const workspaceLocks = new Map();

class WorkspaceConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = 'WorkspaceConfigError';
    this.statusCode = 500;
  }
}

class WorkspaceExistsError extends Error {
  constructor(workspacePath) {
    super('Workspace already exists.');
    this.name = 'WorkspaceExistsError';
    this.statusCode = 409;
    this.workspacePath = workspacePath;
  }
}

async function ensureDemandWorkspace(demand, userId) {
  const branchName = demand.branch || `task-${demand.id}`;
  const workspaceFolder = createWorkspaceFolder({ branchName, userId });

  return withWorkspaceLock(workspaceFolder, () => ensureDemandWorkspaceUnlocked({ branchName, workspaceFolder }));
}

async function ensureDemandWorkspaceUnlocked({ branchName, workspaceFolder }) {
  const workspacePath = path.join(getWorkspacesDir(), workspaceFolder);

  await ensureWorkspacesDir(getWorkspacesDir());

  if (await pathExists(workspacePath)) {
    console.log(`Ensuring workspace ${branchName}: folder exists.`);
    await ensureWorkspaceBranch({ branchName, workspacePath });
  } else {
    console.log(`Ensuring workspace ${branchName}: folder missing.`);
    await cloneDemandBranch({ branchName, workspacePath });
  }

  return {
    branchName,
    workspaceFolder,
    workspacePath,
  };
}

async function withWorkspaceLock(branchName, task) {
  const current = workspaceLocks.get(branchName);

  if (current) {
    return current;
  }

  const pending = Promise.resolve()
    .then(task)
    .finally(() => {
      workspaceLocks.delete(branchName);
    });

  workspaceLocks.set(branchName, pending);
  return pending;
}

function resolveWorkspaceUserId(req) {
  const requestedUserId = req.headers['x-workspace-user-id'] || req.query.userId || req.headers['x-workspace-user'] || req.query.user;
  return sanitizeWorkspaceUserId(Array.isArray(requestedUserId) ? requestedUserId[0] : requestedUserId);
}

function createWorkspaceFolder({ branchName, userId }) {
  return `${branchName}--${sanitizeWorkspaceUserId(userId)}`;
}

function sanitizeWorkspaceUserId(userId) {
  const value = String(userId || `user-${os.userInfo().username}` || 'user')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return value || 'user';
}

function getWorkspacesDir() {
  const rootDir = process.env.TEMPLATE_ROOT_DIR;

  if (!rootDir) {
    throw new WorkspaceConfigError('TEMPLATE_ROOT_DIR is not configured.');
  }

  const templateRootDir = path.resolve(__dirname, '../..', rootDir);
  return path.dirname(templateRootDir);
}

async function ensureWorkspacesDir(workspacesDir) {
  await fs.mkdir(workspacesDir, { recursive: true });
}

async function assertWorkspaceAvailable(workspacePath) {
  try {
    await fs.access(workspacePath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return;
    }

    throw error;
  }

  throw new WorkspaceExistsError(workspacePath);
}

async function cloneDemandBranch({
  branchName,
  workspaceFolder = branchName,
  workspacePath = path.join(getWorkspacesDir(), workspaceFolder),
}) {
  await ensureWorkspacesDir(getWorkspacesDir());
  await assertWorkspaceAvailable(workspacePath);

  console.log(`Preparing workspace ${branchName}: checking remote branch.`);
  if (await remoteBranchExists(branchName)) {
    console.log(`Preparing workspace ${branchName}: cloning existing branch.`);
    await cloneExistingBranch({ branchName, workspacePath });
  } else {
    console.log(`Preparing workspace ${branchName}: cloning main and creating branch.`);
    await cloneTemplateMain({ branchName, workspacePath });
  }

  return workspacePath;
}

async function cloneExistingBranch({ branchName, workspacePath }) {
  const templateRepoUrl = getTemplateRepoUrl();

  try {
    await execGit([
      'clone',
      '--depth',
      '1',
      '--single-branch',
      '--branch',
      branchName,
      templateRepoUrl,
      workspacePath,
    ]);
  } catch (error) {
    await fs.rm(workspacePath, { recursive: true, force: true });
    throw error;
  }
}

async function cloneTemplateMain({ branchName, workspacePath }) {
  const templateRepoUrl = getTemplateRepoUrl();

  try {
    await execGit([
      'clone',
      '--depth',
      '1',
      '--single-branch',
      '--branch',
      'main',
      templateRepoUrl,
      workspacePath,
    ]);
    await execGit(['checkout', '-b', branchName], { cwd: workspacePath });
    await execGit(['branch', '-D', 'main'], { cwd: workspacePath });
  } catch (error) {
    await fs.rm(workspacePath, { recursive: true, force: true });
    throw error;
  }
}

async function ensureWorkspaceBranch({ branchName, workspacePath }) {
  await assertGitWorkspace(workspacePath);

  if (await localBranchExists({ branchName, workspacePath })) {
    console.log(`Ensuring workspace ${branchName}: checking out local branch.`);
    await execGit(['checkout', branchName], { cwd: workspacePath });
    return;
  }

  if (await remoteBranchExists(branchName)) {
    console.log(`Ensuring workspace ${branchName}: fetching remote branch.`);
    await execGit(['fetch', '--depth', '1', 'origin', `${branchName}:${branchName}`], { cwd: workspacePath });
    await execGit(['checkout', branchName], { cwd: workspacePath });
    return;
  }

  console.log(`Ensuring workspace ${branchName}: creating branch from main.`);
  if (!(await localBranchExists({ branchName: 'main', workspacePath }))) {
    await execGit(['fetch', '--depth', '1', 'origin', 'main:main'], { cwd: workspacePath });
  }

  await execGit(['checkout', 'main'], { cwd: workspacePath });
  await execGit(['checkout', '-b', branchName], { cwd: workspacePath });
  await execGit(['branch', '-D', 'main'], { cwd: workspacePath });
}

async function assertGitWorkspace(workspacePath) {
  if (await pathExists(path.join(workspacePath, '.git'))) {
    return;
  }

  const error = new Error('Workspace folder exists but is not a git repository.');
  error.statusCode = 409;
  throw error;
}

async function localBranchExists({ branchName, workspacePath }) {
  try {
    await execGit(['rev-parse', '--verify', branchName], { cwd: workspacePath });
    return true;
  } catch {
    return false;
  }
}

async function remoteBranchExists(branchName) {
  const { stdout } = await execGit(['ls-remote', '--heads', getTemplateRepoUrl(), branchName]);
  return stdout.trim().length > 0;
}

function getTemplateRepoUrl() {
  const templateRepoUrl = process.env.TEMPLATE_REPO_URL;

  if (!templateRepoUrl) {
    throw new WorkspaceConfigError('TEMPLATE_REPO_URL is not configured.');
  }

  return templateRepoUrl;
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

async function execGit(args, options = {}) {
  try {
    return await execFileAsync('git', args, {
      ...options,
      timeout: GIT_TIMEOUT_MS,
      maxBuffer: 1024 * 1024 * 10,
    });
  } catch (error) {
    if (error.killed && error.signal === 'SIGTERM') {
      const timeoutError = new Error('Git command timed out while preparing workspace.');
      timeoutError.statusCode = 504;
      throw timeoutError;
    }

    throw error;
  }
}

module.exports = {
  WorkspaceConfigError,
  WorkspaceExistsError,
  ensureDemandWorkspace,
  resolveWorkspaceUserId,
};
