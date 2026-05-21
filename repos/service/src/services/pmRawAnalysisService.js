const fs = require('node:fs/promises');
const path = require('node:path');
const codexService = require('./codex/service');

async function startPmRawAnalysis({ issueId, workspace, issueName }) {
  const rawInputDir = path.join(workspace.workspacePath, 'artifacts', workspace.branchName, 'pm-raw', 'input');
  const skillPath = path.join(workspace.workspacePath, '.codex', 'skills', 'pm-raw');

  await assertDirectory(skillPath, 'pm-raw skill 不存在，请先切换产品身份同步 skills。');
  await assertDirectory(rawInputDir, '原始需求目录不存在，请先上传原始需求。');

  const inputFiles = await listFiles(rawInputDir);

  if (inputFiles.length === 0) {
    const error = new Error('原始需求目录为空，请先上传原始需求。');
    error.statusCode = 400;
    throw error;
  }

  const session = codexService.createCodexSession({
    demandId: String(issueId),
    workspaceId: workspace.workspaceFolder,
    cwd: workspace.workspacePath,
    branch: workspace.branchName,
    metadata: {
      alias: '需求分析',
      source: 'pm-raw-analysis',
    },
  });
  const prompt = [
    '请执行 pm-raw skill，对以下原始需求输入目录进行需求分析。',
    '',
    rawInputDir,
  ].join('\n');

  await codexService.startTurn(session.id, { text: prompt });

  return {
    status: 'started',
    issueId: String(issueId),
    issueName,
    rawInputDir,
    skillPath,
    inputFileCount: inputFiles.length,
    session,
  };
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

module.exports = {
  startPmRawAnalysis,
};
