# 实现摘要

## 已实现

- service 新增 `POST /api/codex/sessions/:sessionId/turns/:turnId/fork`。
- service 通过 adapter 抽象支持：
  - 真实 Codex app-server：`thread/fork` + `thread/rollback` + `turn/start`。
  - mock adapter：用于本地 API 级验证。
- 新分支 session metadata 记录来源 session/thread、目标 turn 和 rollback 数。
- 新分支会复制目标用户消息之前的本地事件，保留前端可见历史。
- 用户消息事件增加 `isModelVisibleTurn` 标记，rollback 计数只统计已进入 app-server/model context 的 turn，避免乐观 user echo 导致多删。
- `forkTurn` service 层统一禁止 running/active turn session 分叉。
- service 为同一 session 的 start/fork/interrupt/approval 操作增加轻量串行队列，避免并发 start 与 fork 交叉。
- 前端只对 `isModelVisibleTurn !== false` 的用户消息生成可编辑 turn id，异常乐观 echo 不显示分叉入口。
- fork 后如果编辑 turn 启动异常，新 session metadata 会标记 `forkStartFailed` 和异常信息。
- 前端用户气泡新增“编辑并分叉”入口。
- 编辑态使用内联 `Input.TextArea`，提交后切换到新 session。

## 关键文件

- `repos/service/src/routes/codex.js`
- `repos/service/src/services/codex/service.js`
- `repos/service/src/services/codex/realAdapter.js`
- `repos/service/src/services/codex/mockAdapter.js`
- `repos/service/src/services/codex/sessionStore.js`
- `repos/app/src/services/codex.ts`
- `repos/app/src/components/codex-conversation/CodexConversationModule.tsx`
- `repos/app/src/components/codex-conversation/CodexConversationMessages.tsx`
- `repos/app/src/components/codex-conversation/codexConversationUtils.ts`

## 已知边界

- Codex app-server `thread/rollback` 只回滚 thread history，不回滚 agent 已经修改过的本地文件。当前实现保留该行为，不做文件系统 revert。
- 编辑附件暂未作为独立能力处理；当前提交编辑文本和已有 `textElements`。
- 真实 app-server 路径需要目标 session 空闲；如果 turn 正在运行，后端返回 409。
