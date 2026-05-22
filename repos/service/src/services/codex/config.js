const path = require('node:path');

const SERVICE_ROOT_DIR = path.resolve(__dirname, '../../..');
const PROJECT_ROOT_DIR = path.resolve(SERVICE_ROOT_DIR, '../..');

function getCodexConfig() {
  return {
    appServerBin: process.env.CODEX_APP_SERVER_BIN || 'codex',
    workspaceRoot: process.env.CODEX_WORKBENCH_ROOT || PROJECT_ROOT_DIR,
    defaultModel: process.env.CODEX_DEFAULT_MODEL || 'gpt-5.5',
    defaultEffort: process.env.CODEX_DEFAULT_EFFORT || 'medium',
    approvalPolicy: process.env.CODEX_APPROVAL_POLICY || 'never',
    sandboxMode: process.env.CODEX_SANDBOX_MODE || 'danger-full-access',
    networkAccess: readBoolean(process.env.CODEX_NETWORK_ACCESS, true),
    enableRealAdapter: readBoolean(process.env.CODEX_ENABLE_REAL_ADAPTER, false),
    appServerRequestTimeoutMs: Number(process.env.CODEX_APP_SERVER_REQUEST_TIMEOUT_MS || 30000),
    appServerTurnTimeoutMs: Number(process.env.CODEX_APP_SERVER_TURN_TIMEOUT_MS || 0),
  };
}

function resolveSessionCwd(input) {
  const config = getCodexConfig();
  const rawCwd = input.cwd || input.workspacePath || config.workspaceRoot;
  const resolvedCwd = path.resolve(rawCwd);
  const resolvedRoot = path.resolve(config.workspaceRoot);

  if (resolvedCwd !== resolvedRoot && !resolvedCwd.startsWith(`${resolvedRoot}${path.sep}`)) {
    const error = new Error('Session cwd must be inside CODEX_WORKBENCH_ROOT.');
    error.statusCode = 400;
    throw error;
  }

  return resolvedCwd;
}

function readBoolean(value, fallback) {
  if (value === undefined) {
    return fallback;
  }

  return value === 'true' || value === '1' || value === 'yes';
}

module.exports = {
  getCodexConfig,
  resolveSessionCwd,
};
