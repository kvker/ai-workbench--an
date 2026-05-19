const express = require('express');
const codexService = require('../services/codex/service');

const router = express.Router();

router.get('/config', (_req, res) => {
  res.json(codexService.getPublicConfig());
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

router.post('/sessions/:sessionId/turns', async (req, res, next) => {
  try {
    res.status(201).json(await codexService.startTurn(req.params.sessionId, req.body));
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
