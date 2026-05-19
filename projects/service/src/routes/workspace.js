const express = require('express');
const { readStore, updateStore } = require('../storage/jsonStore');
const { createDemandWorkspace, resolveWorkspaceUserId } = require('../services/workspaceService');

const router = express.Router();

router.get('/', async (_req, res, next) => {
  try {
    const data = await readStore();
    res.json(data.workspace);
  } catch (error) {
    next(error);
  }
});

router.post('/demands', async (req, res, next) => {
  try {
    const { title, description, source, laneTitle = '需求分析' } = req.body ?? {};

    if (!title || !description || !['业务方', '产品方'].includes(source)) {
      res.status(400).json({ message: 'Demand title, description and source are required.' });
      return;
    }

    const workspace = await createDemandWorkspace({
      title,
      description,
      source,
      userId: resolveWorkspaceUserId(req),
    });
    const id = workspace.hash;
    const now = new Date().toISOString();
    const demand = {
      id,
      title,
      description,
      tags: [],
      status: '需求分析',
    };
    const task = {
      demand: {
        id,
        title,
        status: '需求分析',
        priority: '未设置',
        owner: '创建者',
        source,
        workspaceFolder: workspace.workspaceFolder,
        workspacePath: workspace.workspacePath,
        branch: workspace.branchName,
        createdAt: now,
        updatedAt: now,
      },
      flowSteps: [
        { title: '需求分析', state: '进行中 · 当前', status: 'current' },
        { title: '原型编写', state: '未开始 · 锁定', status: 'locked' },
        { title: '文档移交', state: '未开始 · 锁定', status: 'locked' },
        { title: '交付', state: '未开始 · 锁定', status: 'locked' },
      ],
      messages: [],
      documents: [],
      conversations: [],
      codePreview: {
        lines: [],
      },
    };

    await updateStore((draft) => {
      draft.tasksById ??= {};
      let lane = draft.workspace.lanes.find((item) => item.title === laneTitle);

      if (!lane) {
        lane = { title: laneTitle, demands: [] };
        draft.workspace.lanes.push(lane);
      }

      lane.demands.unshift(demand);
      draft.workspace.activeDemandId = demand.id;
      draft.tasksById[id] = task;
      return draft;
    });

    res.status(201).json(demand);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
