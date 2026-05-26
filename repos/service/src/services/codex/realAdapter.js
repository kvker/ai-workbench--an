const { getCodexConfig } = require('./config');
const { JsonRpcClient } = require('./jsonRpcClient');
const { appendEvent, updateSession } = require('./sessionStore');

const clients = new Map();

async function startTurn(session, input) {
  const text = String(input.text || '').trim();

  if (!text) {
    const error = new Error('Turn text is required.');
    error.statusCode = 400;
    throw error;
  }

  const client = await getOrCreateClient(session);
  updateSession(session.id, { status: 'running' });

  appendEvent(session.id, {
    type: 'message.completed',
    itemId: `user_${Date.now().toString(36)}`,
    role: 'user',
    text,
  });

  try {
    const response = await client.request('turn/start', {
      threadId: session.appServerThreadId,
      input: [{ type: 'text', text, text_elements: [] }],
      cwd: session.cwd,
      approvalPolicy: session.approvalPolicy,
      sandboxPolicy: toSandboxPolicy(session),
      model: session.model,
      effort: session.effort,
    });

    if (response?.turn?.id) {
      setActiveTurnId(session, response.turn.id);
    }
  } catch (error) {
    appendEvent(session.id, {
      type: 'error',
      message: error.message,
    });
    updateSession(session.id, { status: 'idle' });
    throw error;
  }

  return session;
}

async function resolveApproval() {
  const error = new Error('Approval handling is not implemented for real codex app-server adapter yet.');
  error.statusCode = 501;
  throw error;
}

async function interrupt(session) {
  const client = clients.get(session.id);
  let activeTurnId = session.activeTurnId;

  try {
    if (client && activeTurnId && session.appServerThreadId) {
      await interruptTurn(client, session.appServerThreadId, activeTurnId);
    }
  } catch (error) {
    const currentTurnId = parseCurrentTurnId(error);

    if (!currentTurnId || !client || !session.appServerThreadId) {
      throw error;
    }

    activeTurnId = currentTurnId;
    await interruptTurn(client, session.appServerThreadId, activeTurnId);
  }

  appendEvent(session.id, {
    type: 'turn.interrupted',
    turnId: activeTurnId,
  });

  return updateSession(session.id, { activeTurnId: null, status: 'idle' });
}

async function getOrCreateClient(session) {
  const existingClient = clients.get(session.id);

  if (existingClient) {
    return existingClient;
  }

  const config = getCodexConfig();
  const client = new JsonRpcClient(config.appServerBin, ['app-server'], {
    cwd: session.cwd,
    env: process.env,
    requestTimeoutMs: config.appServerRequestTimeoutMs,
  }).start();

  client.onNotification((notification) => handleNotification(session, notification));

  await client.request('initialize', {
    clientInfo: {
      name: 'ai-workbench-service',
      version: '0.1.0',
    },
    capabilities: null,
  });
  client.notify('initialized');

  if (session.appServerThreadId) {
    const threadResponse = await client.request('thread/resume', {
      threadId: session.appServerThreadId,
      cwd: session.cwd,
      approvalPolicy: session.approvalPolicy,
      sandbox: session.sandboxMode,
    });

    updateSession(session.id, { appServerThreadId: threadResponse.thread.id });
  } else if (session.threadId?.startsWith('thread_')) {
    const threadResponse = await client.request('thread/start', {
      model: session.model,
      cwd: session.cwd,
      approvalPolicy: session.approvalPolicy,
      sandbox: session.sandboxMode,
      ephemeral: false,
      serviceName: 'ai-workbench',
    });

    updateSession(session.id, { appServerThreadId: threadResponse.thread.id });
  } else {
    const threadResponse = await client.request('thread/resume', {
      threadId: session.threadId,
      cwd: session.cwd,
      approvalPolicy: session.approvalPolicy,
      sandbox: session.sandboxMode,
    });

    updateSession(session.id, { appServerThreadId: threadResponse.thread.id });
  }

  clients.set(session.id, client);

  appendEvent(session.id, {
    type: 'session.connected',
    sessionId: session.id,
    threadId: session.appServerThreadId,
  });

  return client;
}

function handleNotification(session, notification) {
  const { method, params } = notification;

  if (method === 'turn/started') {
    setActiveTurnId(session, params.turn.id);
    appendEvent(session.id, {
      type: 'turn.started',
      turnId: params.turn.id,
    });
    return;
  }

  if (method === 'item/agentMessage/delta') {
    appendEvent(session.id, {
      type: 'message.delta',
      itemId: params.itemId,
      text: params.delta,
    });
    return;
  }

  if (method === 'turn/plan/updated') {
    appendEvent(session.id, {
      type: 'plan.updated',
      steps: params.plan.map((step) => ({
        text: step.step,
        status: step.status,
      })),
    });
    return;
  }

  if (method === 'item/commandExecution/outputDelta' || method === 'command/exec/outputDelta') {
    appendEvent(session.id, {
      type: 'command.output',
      itemId: params.itemId,
      chunk: params.delta,
    });
    return;
  }

  if (method === 'turn/diff/updated') {
    appendEvent(session.id, {
      type: 'diff.updated',
      diff: params.diff,
    });
    return;
  }

  if (method === 'item/completed') {
    appendCompletedItem(session, params.item);
    return;
  }

  if (method === 'turn/completed') {
    appendEvent(session.id, {
      type: 'turn.completed',
      turnId: params.turn.id,
    });
    updateSession(session.id, { activeTurnId: null, status: 'idle' });
    return;
  }

  if (method === 'error') {
    appendEvent(session.id, {
      type: 'error',
      message: params.error?.message || 'Codex app-server error.',
    });
    updateSession(session.id, { activeTurnId: null, status: 'idle' });
  }
}

function setActiveTurnId(session, activeTurnId) {
  updateSession(session.id, { activeTurnId });
}

async function interruptTurn(client, threadId, turnId) {
  await client.request('turn/interrupt', {
    threadId,
    turnId,
  });
}

function parseCurrentTurnId(error) {
  const match = /expected active turn id [\w-]+ but found ([\w-]+)/i.exec(error.message || '');

  return match?.[1] || null;
}

function appendCompletedItem(session, item) {
  if (!item) {
    return;
  }

  if (item.type === 'agentMessage' && item.text) {
    appendEvent(session.id, {
      type: 'message.completed',
      itemId: item.id,
      role: 'assistant',
      text: item.text,
    });
    return;
  }

  if (item.type === 'commandExecution' && item.aggregatedOutput) {
    appendEvent(session.id, {
      type: 'command.output',
      itemId: item.id,
      chunk: item.aggregatedOutput,
    });
  }
}

function toSandboxPolicy(session) {
  if (session.sandboxMode === 'danger-full-access') {
    return { type: 'dangerFullAccess' };
  }

  if (session.sandboxMode === 'read-only') {
    return { type: 'readOnly', networkAccess: session.networkAccess };
  }

  return {
    type: 'workspaceWrite',
    writableRoots: [session.cwd],
    networkAccess: session.networkAccess,
    excludeTmpdirEnvVar: false,
    excludeSlashTmp: false,
  };
}

module.exports = {
  interrupt,
  resolveApproval,
  startTurn,
};
