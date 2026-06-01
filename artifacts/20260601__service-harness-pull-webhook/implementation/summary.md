# 实现记录

## 变更

- 新增 `repos/service/src/services/harnessRepositoryService.js`。
  - 读取 `KNOWLEDGE_ROOT_DIR`。
  - 校验目录存在且为 git 仓库。
  - 串行化同一 harness 仓库的 pull 操作。
  - 执行 `git fetch origin main`、`git checkout main`、`git pull --ff-only origin main`。
- 新增 `repos/service/src/routes/webhook.js`。
  - 暴露 `POST /api/webhook/harness/pull-main`。
- 更新 `repos/service/app.js`。
  - 挂载 `/api/webhook` 路由。

## 说明

- 不硬编码 harness 路径，以 `.env` 中 `KNOWLEDGE_ROOT_DIR` 为准。
- 不执行 reset、clean 或 merge；本地无法快进时保留 git 原始失败。
