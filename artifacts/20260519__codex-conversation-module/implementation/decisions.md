# Codex 对话模块实现记录

## 实现摘要

- 新增 service Codex 模块，挂载 `/api/codex/*`。
- 新增前端 `CodexConversationModule` 独立组件。
- 详情页对话区改为装配独立 Codex 模块。
- 默认模型、权限、workspace root 从 service 环境变量读取。
- 更新 `mock-and-todos` 记录 mock adapter 与事件快照接口。

## 决策记录

### 第一版使用 mock adapter 实现模块闭环

虽然 `.env` 中已配置 `CODEX_ENABLE_REAL_ADAPTER=true`，但第一版实际仍使用 `mockAdapter` 返回标准事件。

原因：

- 当前任务目标是先封装前端和 service 独立模块，以及标准入参。
- 真实 `codex app-server` 需要 JSON-RPC 连接、事件流生命周期、thread/turn 资源管理和错误恢复，适合在已有模块边界上继续实现。
- 前端不直接依赖官方 JSON-RPC，后续替换 adapter 不需要改 `CodexConversationModule` 入参。

后续接入点：

- `projects/service/src/services/codex/service.js` 中的 `getAdapter()`。
- `projects/service/src/services/codex/mockAdapter.js` 的同名方法接口：`startTurn`、`resolveApproval`、`interrupt`。

### 第一版使用事件快照，不做 SSE/WebSocket

原因：

- 可以先验证 UI、service API 和数据模型闭环。
- 后续升级为 SSE/WebSocket 时，前端 client 只需要替换获取事件方式，组件入参不变。

## 涉及文件

- `projects/service/src/routes/codex.js`
- `projects/service/src/services/codex/config.js`
- `projects/service/src/services/codex/sessionStore.js`
- `projects/service/src/services/codex/mockAdapter.js`
- `projects/service/src/services/codex/service.js`
- `projects/service/app.js`
- `projects/app/src/services/codex.ts`
- `projects/app/src/components/codex-conversation/CodexConversationModule.tsx`
- `projects/app/src/pages/DemandDetailPage.tsx`
- `background/tech/mock-and-todos.md`
