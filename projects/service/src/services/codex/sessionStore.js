const crypto = require('node:crypto');

const sessions = new Map();

function createSession(input) {
  const now = new Date().toISOString();
  const session = {
    id: makeId('session'),
    threadId: input.threadId || makeId('thread'),
    demandId: input.demandId,
    workspaceId: input.workspaceId,
    cwd: input.cwd,
    branch: input.branch || '',
    model: input.model,
    effort: input.effort,
    approvalPolicy: input.approvalPolicy,
    sandboxMode: input.sandboxMode,
    networkAccess: input.networkAccess,
    status: 'idle',
    events: [],
    createdAt: now,
    updatedAt: now,
    metadata: input.metadata || {},
  };

  sessions.set(session.id, session);
  appendEvent(session.id, {
    type: 'session.started',
    sessionId: session.id,
    threadId: session.threadId,
  });

  return session;
}

function getSession(sessionId) {
  return sessions.get(sessionId) || null;
}

function updateSession(sessionId, patch) {
  const session = requireSession(sessionId);
  Object.assign(session, patch, { updatedAt: new Date().toISOString() });
  return session;
}

function appendEvent(sessionId, event) {
  const session = requireSession(sessionId);
  const eventWithMeta = {
    id: makeId('event'),
    createdAt: new Date().toISOString(),
    ...event,
  };

  session.events.push(eventWithMeta);
  session.updatedAt = eventWithMeta.createdAt;

  return eventWithMeta;
}

function getEvents(sessionId) {
  return requireSession(sessionId).events;
}

function requireSession(sessionId) {
  const session = getSession(sessionId);

  if (!session) {
    const error = new Error('Codex session not found.');
    error.statusCode = 404;
    throw error;
  }

  return session;
}

function makeId(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

module.exports = {
  appendEvent,
  createSession,
  getEvents,
  getSession,
  updateSession,
};
