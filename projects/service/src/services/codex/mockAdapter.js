const { appendEvent, updateSession } = require('./sessionStore');

async function startTurn(session, input) {
  const text = String(input.text || '').trim();

  if (!text) {
    const error = new Error('Turn text is required.');
    error.statusCode = 400;
    throw error;
  }

  const turnId = makeTurnId();
  updateSession(session.id, { status: 'running' });

  appendEvent(session.id, {
    type: 'turn.started',
    turnId,
    text,
  });
  appendEvent(session.id, {
    type: 'message.completed',
    itemId: `${turnId}_user`,
    role: 'user',
    text,
  });
  appendEvent(session.id, {
    type: 'plan.updated',
    steps: [
      { text: '解析用户输入并绑定当前需求工作区', status: 'completed' },
      { text: '通过 service adapter 调用 Codex app-server', status: 'pending' },
      { text: '将事件流归一为前端对话事件', status: 'pending' },
    ],
  });
  appendEvent(session.id, {
    type: 'command.output',
    itemId: `${turnId}_command`,
    chunk: `mock adapter cwd=${session.cwd} model=${session.model}`,
  });
  appendEvent(session.id, {
    type: 'message.completed',
    itemId: `${turnId}_assistant`,
    role: 'assistant',
    text: '已收到。当前是 Codex mock adapter 响应，真实 app-server 接入会在 service adapter 层替换。',
  });
  appendEvent(session.id, {
    type: 'turn.completed',
    turnId,
  });

  return updateSession(session.id, { status: 'idle' });
}

async function resolveApproval(session, requestId, decision) {
  appendEvent(session.id, {
    type: 'approval.resolved',
    requestId,
    decision,
  });

  return session;
}

async function interrupt(session) {
  appendEvent(session.id, {
    type: 'turn.interrupted',
  });

  return updateSession(session.id, { status: 'idle' });
}

function makeTurnId() {
  return `turn_${Date.now().toString(36)}`;
}

module.exports = {
  interrupt,
  resolveApproval,
  startTurn,
};
