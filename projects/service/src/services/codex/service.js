const { getCodexConfig, resolveSessionCwd } = require('./config');
const mockAdapter = require('./mockAdapter');
const realAdapter = require('./realAdapter');
const { createSession, getEvents, getSession, listSessions, subscribeEvents, updateSession } = require('./sessionStore');

function getPublicConfig() {
  const config = getCodexConfig();

  return {
    defaultModel: config.defaultModel,
    defaultEffort: config.defaultEffort,
    approvalPolicy: config.approvalPolicy,
    sandboxMode: config.sandboxMode,
    networkAccess: config.networkAccess,
    enableRealAdapter: config.enableRealAdapter,
    adapter: config.enableRealAdapter ? 'real' : 'mock',
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
    adapter: config.enableRealAdapter ? 'real' : 'mock',
    metadata: input.metadata,
  });
}

function listCodexSessions(filter) {
  return {
    sessions: listSessions(filter).map(toSessionSummary),
  };
}

function listEvents(sessionId) {
  return {
    session: getSessionOrThrow(sessionId),
    events: getEvents(sessionId),
  };
}

function streamEvents(sessionId, onEvent) {
  return subscribeEvents(sessionId, onEvent);
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

function renameSession(sessionId, input) {
  const session = getSessionOrThrow(sessionId);
  const alias = String(input?.alias || '').trim();

  if (!alias) {
    const error = new Error('alias is required.');
    error.statusCode = 400;
    throw error;
  }

  return updateSession(sessionId, {
    metadata: {
      ...session.metadata,
      alias,
    },
  });
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
  const config = getCodexConfig();

  return config.enableRealAdapter ? realAdapter : mockAdapter;
}

function toSessionSummary(session) {
  return {
    id: session.id,
    threadId: session.threadId,
    demandId: session.demandId,
    workspaceId: session.workspaceId,
    cwd: session.cwd,
    branch: session.branch,
    model: session.model,
    effort: session.effort,
    approvalPolicy: session.approvalPolicy,
    sandboxMode: session.sandboxMode,
    networkAccess: session.networkAccess,
    adapter: session.adapter,
    status: session.status,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    metadata: session.metadata,
  };
}

module.exports = {
  createCodexSession,
  getPublicConfig,
  interrupt,
  listCodexSessions,
  listEvents,
  renameSession,
  resolveApproval,
  startTurn,
  streamEvents,
};
