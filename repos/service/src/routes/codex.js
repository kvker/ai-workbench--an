const express = require('express');
const codexService = require('../services/codex/service');

const router = express.Router();

router.get('/config', (_req, res) => {
  res.json(codexService.getPublicConfig());
});

router.get('/sessions', (req, res) => {
  res.json(codexService.listCodexSessions({
    demandId: req.query.demandId,
    workspaceId: req.query.workspaceId,
  }));
});

router.post('/sessions', (req, res, next) => {
  try {
    res.status(201).json(codexService.createCodexSession(req.body));
  } catch (error) {
    next(error);
  }
});

router.get('/sessions/:sessionId/events', (req, res, next) => {
  try {
    res.json(codexService.listEvents(req.params.sessionId));
  } catch (error) {
    next(error);
  }
});

router.get('/sessions/:sessionId/stream', (req, res, next) => {
  try {
    const snapshot = codexService.listEvents(req.params.sessionId);

    res.writeHead(200, {
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'Content-Type': 'text/event-stream',
      'X-Accel-Buffering': 'no',
    });
    res.write(`event: snapshot\n`);
    res.write(`data: ${JSON.stringify(snapshot)}\n\n`);

    const unsubscribe = codexService.streamEvents(req.params.sessionId, (event) => {
      res.write(`event: codex-event\n`);
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    });
    const heartbeat = setInterval(() => {
      res.write(`: heartbeat\n\n`);
    }, 15000);

    req.on('close', () => {
      clearInterval(heartbeat);
      unsubscribe();
      res.end();
    });
  } catch (error) {
    next(error);
  }
});

router.post('/sessions/:sessionId/turns', async (req, res, next) => {
  try {
    res.status(201).json(await codexService.startTurn(req.params.sessionId, req.body));
  } catch (error) {
    next(error);
  }
});

router.patch('/sessions/:sessionId', (req, res, next) => {
  try {
    res.json(codexService.renameSession(req.params.sessionId, req.body));
  } catch (error) {
    next(error);
  }
});

router.post('/sessions/:sessionId/approvals/:requestId', async (req, res, next) => {
  try {
    res.json(await codexService.resolveApproval(req.params.sessionId, req.params.requestId, req.body));
  } catch (error) {
    next(error);
  }
});

router.post('/sessions/:sessionId/interrupt', async (req, res, next) => {
  try {
    res.json(await codexService.interrupt(req.params.sessionId));
  } catch (error) {
    next(error);
  }
});

module.exports = router;
