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

### 已接入真实 app-server 最小闭环

新增 `realAdapter` 通过 `codex app-server` stdio JSONL 连接当前本机 Codex CLI。

已完成：

- `initialize` / `initialized`
- `thread/start`
- `turn/start`
- `item/agentMessage/delta`
- `item/completed` 中 `agentMessage`
- `turn/plan/updated`
- `item/commandExecution/outputDelta`
- `turn/diff/updated`
- `turn/completed`
- `turn/interrupt`

未完成：

- 真实 approval request/resolution 的完整协议处理。
- 真实 SSE/WebSocket 推送；前端当前使用 `GET /events` 短轮询获取后续 app-server 通知。
- app-server 子进程复用、回收和 session 持久化策略。

### 已接入 SSE 事件流

新增 `GET /api/codex/sessions/:sessionId/stream`，通过 `text/event-stream` 推送：

- `snapshot`：连接建立时返回当前 session 与事件快照。
- `codex-event`：后续每次 `appendEvent()` 的新增事件。
- heartbeat：每 15 秒发送注释心跳，避免连接长时间静默。

前端 `CodexConversationModule` 使用 `EventSource` 订阅 stream，收到事件后增量更新 UI；保留 `/events` 轮询作为 stream 失败后的 fallback。

注意：浏览器 `EventSource` 不支持自定义 header。当前本地 service 不强制 stream token 鉴权；正式鉴权可切换为 cookie 或服务端 session 方式。

### 已接入 session/events JSON 持久化

新增 `projects/service/data/codex-sessions.json` 作为当前原型阶段的 Codex session 持久化文件。

实现策略：

- service 启动时调用 `hydrateSessions()`，从 JSON 文件恢复 session。
- 所有恢复后的 session 状态统一置为 `idle`，避免重启后误认为仍有运行中的 turn。
- `createSession()`、`updateSession()`、`appendEvent()` 后异步写盘。
- 新增 `GET /api/codex/sessions?demandId=&workspaceId=`，用于前端按需求/工作区恢复最近 session。
- 前端创建会话前先查询已有 session，存在则复用最近更新的一条。

当前边界：

- 持久化仅覆盖 service 自己的 session 与事件快照。
- app-server 子进程不会跨 service 重启恢复；再次发送消息时会重新连接 app-server。
- 真实 thread resume 仍依赖后续把 app-server thread id 纳入标准恢复策略。

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
