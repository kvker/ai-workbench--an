# 实现记录

## 变更

- 新增 `repos/service/src/services/harnessRepositoryService.js`。
  - 读取 `KNOWLEDGE_ROOT_DIR`。
  - 校验目录存在且为 git 仓库。
  - 串行化同一 harness 仓库的 pull 操作。
  - webhook 成功拉取后，将当前 commit 写入服务内存状态 `latestCommit`。
  - 执行 `git fetch origin main`、`git checkout main`、`git pull --ff-only origin main`。
- 新增 `repos/service/src/routes/webhook.js`。
  - 暴露 `POST /api/webhook/harness/pull-main`。
  - 暴露 `GET /api/webhook/harness/status`，只返回 `{ "latestCommit": string | null }`。
- 更新 `repos/service/app.js`。
  - 挂载 `/api/webhook` 路由。

## 说明

- 不硬编码 harness 路径，以 `.env` 中 `KNOWLEDGE_ROOT_DIR` 为准。
- 不执行 reset、clean 或 merge；本地无法快进时保留 git 原始失败。
- 后端 status 接口只暴露当前 commit 事实，不接收前端已知 commit，也不返回是否需要更新。
