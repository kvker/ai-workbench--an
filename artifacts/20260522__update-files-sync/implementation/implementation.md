# 实现记录

## 流程等级

L1 快速修复。用户已确认选择“快速修复”，跳过完整工作流。

## 计划

- 前端将“更新代码”交互改为“更新文件”。
- 后端删除原有工作区代码 `git pull --rebase` 更新能力。
- 将 Harness 文件同步拆分为“确保存在”和“强制刷新”两种模式。
- 详情初始化仅在目标文件不存在时同步；点击“更新文件”强制删除后重新同步。

## 变更

- `repos/app`：详情页按钮与调用从 `updateCode` 改为 `updateFiles`，请求 `/api/task/:issueId/files/update`。
- `repos/service`：删除 `/api/task/:issueId/code/update` 路由和 `codeUpdateService.js`。
- `repos/service`：`syncKnowledgeForIdentity` 支持 `force` 参数；详情初始化默认 `force: false`，已有 background/conventions/skills 文件时跳过同步；更新文件接口使用 `force: true`，保留先删除后同步行为。
- `repos/service`：初始化/更新文件同步时额外读取 Harness `agents/*/AGENTS.md`，归一化写入 workspace 根目录 `agents/`：
  - `frontend/AGENTS.md` 或 `fe/AGENTS.md` -> `agents/fe.md`
  - `backend/AGENTS.md` 或 `be/AGENTS.md` -> `agents/be.md`
  - `product/AGENTS.md` 或 `pm/AGENTS.md` -> `agents/pm.md`
  - `test/AGENTS.md` 或 `qa/AGENTS.md` -> `agents/qa.md`
  - `shared/AGENTS.md` -> `agents/shared/common.md`
- 源目录或 `AGENTS.md` 不存在时跳过，不计入 missing；同步前会重建 workspace `agents/` 目录以清理旧归一化结果。
