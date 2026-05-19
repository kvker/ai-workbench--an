const { getCodexConfig, resolveSessionCwd } = require('./config');
const mockAdapter = require('./mockAdapter');
const { createSession, getEvents, getSession } = require('./sessionStore');

function getPublicConfig() {
  const config = getCodexConfig();

  return {
    defaultModel: config.defaultModel,
    defaultEffort: config.defaultEffort,
    approvalPolicy: config.approvalPolicy,
    sandboxMode: config.sandboxMode,
    networkAccess: config.networkAccess,
    enableRealAdapter: config.enableRealAdapter,
  };
}

function createCodexSession(input) {
  validateSessionInput(input);
  const config = getCodexConfig();
  const cwd = resolveSessionCwd(input);

  return createSession({
    demandId: input.demandId,
    workspaceId: input.workspaceId,
    cwd,
    branch: input.branch,
    threadId: input.threadId,
    model: input.model || config.defaultModel,
    effort: input.effort || config.defaultEffort,
    approvalPolicy: config.approvalPolicy,
    sandboxMode: config.sandboxMode,
    networkAccess: config.networkAccess,
    metadata: input.metadata,
  });
}

function listEvents(sessionId) {
  return {
    session: getSessionOrThrow(sessionId),
    events: getEvents(sessionId),
  };
}

async function startTurn(sessionId, input) {
  const session = getSessionOrThrow(sessionId);
  await getAdapter().startTurn(session, input);

  return listEvents(sessionId);
}

async function resolveApproval(sessionId, requestId, input) {
  const session = getSessionOrThrow(sessionId);
  await getAdapter().resolveApproval(session, requestId, input.decision);

  return listEvents(sessionId);
}

async function interrupt(sessionId) {
  const session = getSessionOrThrow(sessionId);
  await getAdapter().interrupt(session);

  return listEvents(sessionId);
}

function getSessionOrThrow(sessionId) {
  const session = getSession(sessionId);

  if (!session) {
    const error = new Error('Codex session not found.');
    error.statusCode = 404;
    throw error;
  }

  return session;
}

function validateSessionInput(input) {
  if (!input || !input.demandId || !input.workspaceId) {
    const error = new Error('demandId and workspaceId are required.');
    error.statusCode = 400;
    throw error;
  }
}

function getAdapter() {
  return mockAdapter;
}

module.exports = {
  createCodexSession,
  getPublicConfig,
  interrupt,
  listEvents,
  resolveApproval,
  startTurn,
};
