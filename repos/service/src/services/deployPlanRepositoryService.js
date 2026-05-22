const fs = require('node:fs/promises');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');

const execFileAsync = promisify(execFile);
const GIT_TIMEOUT_MS = 60_000;
const SERVICE_ROOT_DIR = path.resolve(__dirname, '../..');
const DEFAULT_DEVOPS_API_BASE_URL = 'http://devops-api.dahuangf.com:8090/devops';

async function prepareDeployPlanRepositories({ baseDir, deployPlans, token }) {
  const normalizedPlans = Array.isArray(deployPlans) ? deployPlans : [];
  const reposDir = baseDir ? path.resolve(baseDir) : getFallbackDeployPlanReposDir();
  const repositories = [];

  await fs.mkdir(reposDir, { recursive: true });

  for (const deployPlan of normalizedPlans) {
    repositories.push(await prepareDeployPlanRepository({ baseDir: reposDir, deployPlan, token }));
  }

  const failedCount = repositories.filter((repository) => repository.status === 'failed').length;
  const completedCount = repositories.filter((repository) => ['cloned', 'updated'].includes(repository.status)).length;

  return {
    status: failedCount > 0 ? 'partial' : completedCount > 0 ? 'completed' : 'skipped',
    baseDir: reposDir,
    repositories,
  };
}

async function prepareDeployPlanRepository({ baseDir, deployPlan, token }) {
  let result = {
    deployPlanId: deployPlan?.id,
    projectConfigId: deployPlan?.projectConfigId,
    projectName: deployPlan?.projectName,
    projectCode: deployPlan?.projectCode,
    branchName: deployPlan?.branchName,
  };

  try {
    if (!deployPlan?.projectConfigId) {
      return { ...result, status: 'skipped', reason: 'projectConfigId is missing.' };
    }

    if (!deployPlan?.branchName) {
      return { ...result, status: 'skipped', reason: 'branchName is missing.' };
    }

    const projectConfig = await fetchProjectConfig(deployPlan.projectConfigId, token);
    const repositoryUrl = normalizeRepositoryUrl(projectConfig.codeRepository);
    const projectKey = sanitizePathSegment(projectConfig.projectCode || deployPlan.projectCode || projectConfig.projectName || deployPlan.projectName || deployPlan.projectConfigId);
    const localPath = path.join(baseDir, projectKey);
    result = {
      ...result,
      projectName: projectConfig.projectName || result.projectName,
      projectCode: projectConfig.projectCode || result.projectCode,
      repositoryUrl,
      localPath,
    };

    if (!repositoryUrl) {
      return { ...result, status: 'skipped', reason: 'codeRepository is missing.' };
    }

    if (!(await pathExists(localPath))) {
      await cloneRepository({ branchName: deployPlan.branchName, localPath, repositoryUrl });
      return { ...result, status: 'cloned' };
    }

    await assertGitRepository(localPath);
    await assertCleanWorktree(localPath);
    await updateRepository({ branchName: deployPlan.branchName, localPath });

    return { ...result, status: 'updated' };
  } catch (error) {
    return {
      ...result,
      status: 'failed',
      reason: error instanceof Error ? error.message : 'Unknown repository preparation error.',
    };
  }
}

async function fetchProjectConfig(projectConfigId, token) {
  const url = new URL(`${getDevopsApiBaseUrl()}/projectConfig/detail`);
  url.searchParams.set('configId', String(projectConfigId));

  const response = await fetch(url, {
    headers: {
      ...(token ? { token } : {}),
    },
  });

  if (!response.ok) {
    const error = new Error(`Project config request failed: ${response.status} ${response.statusText}`);
    error.statusCode = response.status;
    throw error;
  }

  return unwrapApiResult(await response.json());
}

function unwrapApiResult(payload) {
  if (!payload || typeof payload !== 'object' || !('code' in payload)) {
    return payload;
  }

  if (payload.code === '0' || payload.code === 0) {
    return payload.data;
  }

  throw new Error(payload.msg || payload.message || `Project config request failed: ${payload.code}`);
}

async function cloneRepository({ branchName, localPath, repositoryUrl }) {
  try {
    await execGit(['clone', '--single-branch', '--branch', branchName, repositoryUrl, localPath]);
  } catch (error) {
    await fs.rm(localPath, { recursive: true, force: true });
    throw error;
  }
}

async function updateRepository({ branchName, localPath }) {
  await fetchRemoteBranch({ branchName, localPath });
  await checkoutBranch({ branchName, localPath });
  await execGit(['pull', '--rebase', 'origin', branchName], { cwd: localPath });
}

async function fetchRemoteBranch({ branchName, localPath }) {
  await execGit(['fetch', 'origin', `+refs/heads/${branchName}:refs/remotes/origin/${branchName}`], { cwd: localPath });
}

async function checkoutBranch({ branchName, localPath }) {
  if (await localBranchExists({ branchName, localPath })) {
    await execGit(['checkout', branchName], { cwd: localPath });
    return;
  }

  await execGit(['checkout', '-b', branchName, `origin/${branchName}`], { cwd: localPath });
}

async function assertGitRepository(localPath) {
  if (await pathExists(path.join(localPath, '.git'))) {
    return;
  }

  const error = new Error('Local path exists but is not a git repository.');
  error.statusCode = 409;
  throw error;
}

async function assertCleanWorktree(localPath) {
  const { stdout } = await execGit(['status', '--porcelain'], { cwd: localPath });

  if (!stdout.trim()) {
    return;
  }

  const error = new Error('Local repository has uncommitted changes.');
  error.statusCode = 409;
  throw error;
}

async function localBranchExists({ branchName, localPath }) {
  try {
    await execGit(['rev-parse', '--verify', `refs/heads/${branchName}`], { cwd: localPath });
    return true;
  } catch {
    return false;
  }
}

function getFallbackDeployPlanReposDir() {
  const configuredDir = process.env.DEPLOY_PLAN_REPOS_DIR;

  if (configuredDir) {
    return path.resolve(SERVICE_ROOT_DIR, configuredDir);
  }

  const error = new Error('Deploy plan repositories baseDir is required.');
  error.statusCode = 500;
  throw error;
}

function getDevopsApiBaseUrl() {
  return process.env.DEVOPS_API_BASE_URL || DEFAULT_DEVOPS_API_BASE_URL;
}

function normalizeRepositoryUrl(repositoryUrl) {
  const rawUrl = String(repositoryUrl || '').trim();

  if (!rawUrl) {
    return '';
  }

  const gitHost = process.env.DEPLOY_PLAN_GIT_SSH_HOST || 'git.dahuangf.com';
  const gitPort = process.env.DEPLOY_PLAN_GIT_SSH_PORT || '10022';
  const httpsPrefix = `https://${gitHost}/`;

  if (!rawUrl.startsWith(httpsPrefix)) {
    return rawUrl;
  }

  return `ssh://git@${gitHost}:${gitPort}/${rawUrl.slice(httpsPrefix.length)}`;
}

function sanitizePathSegment(value) {
  const segment = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return segment || 'project';
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
      throw new Error('Git command timed out while preparing deploy plan repository.');
    }

    throw error;
  }
}

module.exports = {
  prepareDeployPlanRepositories,
};
