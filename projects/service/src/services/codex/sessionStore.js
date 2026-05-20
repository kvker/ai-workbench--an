const crypto = require('node:crypto');
const { readPersistedSessions, writePersistedSessions } = require('./sessionPersistence');

const sessions = new Map();
const subscribers = new Map();
let persistQueue = Promise.resolve();

async function hydrateSessions() {
  const persistedSessions = await readPersistedSessions();

  sessions.clear();

  for (const session of persistedSessions) {
    sessions.set(session.id, {
      ...session,
      status: 'idle',
      events: Array.isArray(session.events) ? session.events : [],
    });
  }

  return sessions.size;
}

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
    adapter: input.adapter,
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
  schedulePersist();

  return session;
}

function getSession(sessionId) {
  return sessions.get(sessionId) || null;
}

function listSessions(filter = {}) {
  return Array.from(sessions.values()).filter((session) => {
    if (filter.demandId && session.demandId !== filter.demandId) {
      return false;
    }

    if (filter.workspaceId && session.workspaceId !== filter.workspaceId) {
      return false;
    }

    return true;
  });
}

function updateSession(sessionId, patch) {
  const session = requireSession(sessionId);
  Object.assign(session, patch, { updatedAt: new Date().toISOString() });
  schedulePersist();
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
  schedulePersist();
  publishEvent(sessionId, eventWithMeta);

  return eventWithMeta;
}

function getEvents(sessionId) {
  return requireSession(sessionId).events;
}

function subscribeEvents(sessionId, subscriber) {
  requireSession(sessionId);

  const sessionSubscribers = subscribers.get(sessionId) || new Set();
  sessionSubscribers.add(subscriber);
  subscribers.set(sessionId, sessionSubscribers);

  return () => {
    sessionSubscribers.delete(subscriber);

    if (!sessionSubscribers.size) {
      subscribers.delete(sessionId);
    }
  };
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

function publishEvent(sessionId, event) {
  const sessionSubscribers = subscribers.get(sessionId);

  if (!sessionSubscribers) {
    return;
  }

  for (const subscriber of sessionSubscribers) {
    subscriber(event);
  }
}

function schedulePersist() {
  const snapshot = Array.from(sessions.values());

  persistQueue = persistQueue
    .catch(() => undefined)
    .then(() => writePersistedSessions(snapshot))
    .catch((error) => {
      console.error('Failed to persist Codex sessions.', error);
    });
}

module.exports = {
  appendEvent,
  createSession,
  getEvents,
  getSession,
  hydrateSessions,
  listSessions,
  subscribeEvents,
  updateSession,
};
