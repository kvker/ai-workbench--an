# Service Harness Pull Webhook 技术规范

## 范围

- 在 `repos/service` 新增 webhook 路由。
- webhook 触发后读取 `KNOWLEDGE_ROOT_DIR` 指向的 harness 仓库路径。
- 在 harness 仓库切换到 `main` 并执行 `git pull --ff-only origin main`。
- webhook 成功后将当前 harness commit 保存到 service 内存状态。
- status 接口只返回后端当前保存的 `latestCommit`，前端自行决定如何比较和提示。

## 接口

- `POST /api/webhook/harness/pull-main`
- `GET /api/webhook/harness/status`

## 行为

- `KNOWLEDGE_ROOT_DIR` 未配置或目录不是 git 仓库时返回错误。
- 同一 harness 仓库同时只允许一个 pull 操作执行。
- `POST /api/webhook/harness/pull-main` 成功后更新内存中的 `latestCommit`。
- `GET /api/webhook/harness/status` 不执行 git 操作，只返回 `{ "latestCommit": string | null }`。
- 使用 `--ff-only`，不创建 merge commit，不重置本地改动。
- git 命令超时返回 504。

## 已确认事实

- service 当前分支为 `main`，并已执行 `git pull --ff-only`，结果为 `Already up to date.`
- `.env` 中 harness 路径变量为 `KNOWLEDGE_ROOT_DIR=/Users/zweizhao/project/current/qingtian-harness`。
