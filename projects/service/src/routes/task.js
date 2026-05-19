const express = require('express');
const { readStore, updateStore } = require('../storage/jsonStore');
const { ensureDemandWorkspace, resolveWorkspaceUserId } = require('../services/workspaceService');

const router = express.Router();

router.get('/', async (_req, res, next) => {
  try {
    const data = await readStore();
    res.json(data.task);
  } catch (error) {
    next(error);
  }
});

router.get('/:demandId', async (req, res, next) => {
  try {
    const currentData = await readStore();
    const currentTask = currentData.tasksById?.[req.params.demandId];

    if (!currentTask) {
      res.status(404).json({ message: 'Task not found.' });
      return;
    }

    const workspace = await ensureDemandWorkspace(currentTask.demand, resolveWorkspaceUserId(req));
    const shouldPersistWorkspace =
      currentTask.demand.branch !== workspace.branchName;

    if (!shouldPersistWorkspace) {
      res.json(withWorkspace(currentTask, workspace));
      return;
    }

    const data = await updateStore((draft) => {
      const task = draft.tasksById?.[req.params.demandId];

      if (task) {
        task.demand.branch = workspace.branchName;
      }

      return draft;
    });
    const task = data.tasksById?.[req.params.demandId];

    if (!task) {
      res.status(404).json({ message: 'Task not found.' });
      return;
    }

    res.json(withWorkspace(task, workspace));
  } catch (error) {
    next(error);
  }
});

function withWorkspace(task, workspace) {
  return {
    ...task,
    demand: {
      ...task.demand,
      workspaceFolder: workspace.workspaceFolder,
      workspacePath: workspace.workspacePath,
      branch: workspace.branchName,
    },
  };
}

router.post('/messages', async (req, res, next) => {
  try {
    const message = req.body;

    if (!message || !['user', 'ai'].includes(message.role) || !message.author || !message.body) {
      res.status(400).json({ message: 'Invalid message payload.' });
      return;
    }

    const data = await updateStore((draft) => {
      draft.task.messages.push(message);
      draft.task.demand.updatedAt = new Date().toISOString();
      return draft;
    });

    res.status(201).json(data.task.messages);
  } catch (error) {
    next(error);
  }
});

router.put('/flow-steps', async (req, res, next) => {
  try {
    const flowSteps = req.body;

    if (!Array.isArray(flowSteps)) {
      res.status(400).json({ message: 'Flow steps payload must be an array.' });
      return;
    }

    const data = await updateStore((draft) => {
      draft.task.flowSteps = flowSteps;
      draft.task.demand.updatedAt = new Date().toISOString();
      return draft;
    });

    res.json(data.task.flowSteps);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
