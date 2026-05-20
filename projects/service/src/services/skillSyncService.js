const fs = require('node:fs/promises');
const path = require('node:path');

const PM_SKILL_SEQUENCE_THRESHOLD = 3;

async function syncPmSkillsForFlow({ flowSteps, workspacePath }) {
  try {
    return await syncPmSkillsForFlowUnsafe({ flowSteps, workspacePath });
  } catch (error) {
    return createSkippedResult('sync-failed', {
      error: error.message,
    });
  }
}

async function syncPmSkillsForFlowUnsafe({ flowSteps, workspacePath }) {
  const targetRoot = workspacePath ? path.join(workspacePath, '.codex', 'skills') : null;

  if (!workspacePath) {
    return createSkippedResult('workspace-path-missing', { targetRoot });
  }

  if (getCurrentFlowSequence(flowSteps) >= PM_SKILL_SEQUENCE_THRESHOLD) {
    return createSkippedResult('flow-sequence-out-of-range', { targetRoot });
  }

  const skillNames = getConfiguredPmSkillNames();

  if (skillNames.length === 0) {
    return createSkippedResult('pm-skills-not-configured', { targetRoot });
  }

  const knowledgeRootDir = resolveKnowledgeRootDir();

  if (!knowledgeRootDir) {
    return createSkippedResult('knowledge-root-not-configured', { targetRoot });
  }

  const sourceRoot = await resolvePmSkillsRoot(knowledgeRootDir);
  const sourceRootCandidates = getPmSkillsRootCandidates(knowledgeRootDir);

  if (!sourceRoot) {
    return createSkippedResult('pm-skills-root-not-found', {
      sourceRootCandidates,
      targetRoot,
    });
  }

  const copied = [];
  const missing = [];
  const failed = [];

  await fs.mkdir(targetRoot, { recursive: true });

  for (const skillName of skillNames) {
    const sourcePath = resolveSkillPath(sourceRoot, skillName);
    const targetPath = path.join(targetRoot, skillName);

    if (!(await isDirectory(sourcePath))) {
      missing.push({
        name: skillName,
        sourcePath,
      });
      continue;
    }

    try {
      await fs.rm(targetPath, { recursive: true, force: true });
      await fs.cp(sourcePath, targetPath, { recursive: true });
      copied.push(skillName);
    } catch (error) {
      failed.push({
        name: skillName,
        message: error.message,
      });
    }
  }

  return {
    status: missing.length > 0 || failed.length > 0 ? 'partial' : 'synced',
    copied,
    missing,
    failed,
    sourceRoot,
    sourceRootCandidates,
    targetRoot,
  };
}

function getCurrentFlowSequence(flowSteps = []) {
  if (!Array.isArray(flowSteps) || flowSteps.length === 0) {
    return 0;
  }

  const currentIndex = Math.max(
    0,
    flowSteps.findIndex((step) => step?.status === 'current'),
  );
  const currentStep = flowSteps[currentIndex];
  const explicitSequence = [
    currentStep?.sequence,
    currentStep?.order,
    currentStep?.index,
    currentStep?.stepIndex,
  ].find((value) => Number.isInteger(value));

  return explicitSequence ?? currentIndex;
}

function getConfiguredPmSkillNames() {
  return String(process.env.PM_SKILLS || '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => path.basename(name));
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

async function resolvePmSkillsRoot(knowledgeRootDir) {
  for (const candidate of getPmSkillsRootCandidates(knowledgeRootDir)) {
    if (await isDirectory(candidate)) {
      return candidate;
    }
  }

  return null;
}

function getPmSkillsRootCandidates(knowledgeRootDir) {
  const configuredDir = sanitizeRelativeDir(process.env.PM_SKILLS_DIR || 'skills/pm');
  const candidates = [path.join(knowledgeRootDir, configuredDir)];

  if (configuredDir !== 'skills/pm') {
    candidates.push(path.join(knowledgeRootDir, 'skills', 'pm'));
  }

  return [...new Set(candidates)];
}

function sanitizeRelativeDir(rawDir) {
  const normalizedDir = String(rawDir || '')
    .trim()
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '');

  if (!normalizedDir || normalizedDir.split('/').includes('..')) {
    return 'skills/pm';
  }

  return normalizedDir;
}

function resolveSkillPath(sourceRoot, skillName) {
  const sourcePath = path.resolve(sourceRoot, skillName);
  const rootPath = path.resolve(sourceRoot);

  if (sourcePath === rootPath || !sourcePath.startsWith(`${rootPath}${path.sep}`)) {
    const error = new Error('PM skill path is unsafe.');
    error.statusCode = 400;
    throw error;
  }

  return sourcePath;
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

function createSkippedResult(reason, extra = {}) {
  return {
    status: 'skipped',
    reason,
    copied: [],
    ...extra,
  };
}

module.exports = {
  getCurrentFlowSequence,
  syncPmSkillsForFlow,
};
