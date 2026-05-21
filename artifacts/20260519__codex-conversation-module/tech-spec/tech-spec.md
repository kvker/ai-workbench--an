# Codex 对话模块技术规范

## 流程等级

L2 标准开发。

依据：用户已明确方案方向，但改动跨 `repos/app` 与 `repos/service`，涉及公开 service API、前端模块封装和运行权限配置。

## 第一版目标

第一版实现独立模块边界和可运行的 mock/real 适配器框架：

- Service 提供 `/api/codex/*` 标准 API。
- Service 从环境变量读取默认模型、权限、workspace root、adapter 开关。
- Service 封装 Codex session/turn/event 数据模型，默认使用 mock adapter，预留 real adapter 边界。
- 前端新增 `CodexConversationModule` 独立组件。
- 详情页 `ConversationRegion` 装配新模块。
- 前端只依赖 service 标准 API，不直接接 Codex app-server JSON-RPC。

## 数据模型

```ts
type CodexConversationModuleProps = {
  demandId: string
  workspaceId: string
  workspacePath?: string
  branch?: string
  threadId?: string
  apiBaseUrl?: string
  disabled?: boolean
  onThreadChange?: (threadId: string) => void
  onError?: (error: Error) => void
}

type CreateCodexSessionInput = {
  demandId: string
  workspaceId: string
  cwd?: string
  branch?: string
  threadId?: string
  model?: string
  effort?: 'low' | 'medium' | 'high' | 'xhigh'
  metadata?: Record<string, unknown>
}

type SendCodexTurnInput = {
  text: string
  attachments?: Array<{
    type: 'image' | 'localImage' | 'file' | 'mention'
    path?: string
    url?: string
    name?: string
  }>
}

type CodexConversationEvent =
  | { type: 'session.started'; sessionId: string; threadId: string }
  | { type: 'turn.started'; turnId: string }
  | { type: 'message.delta'; itemId: string; text: string }
  | { type: 'message.completed'; itemId: string; text: string }
  | { type: 'plan.updated'; steps: Array<{ text: string; status: string }> }
  | { type: 'command.output'; itemId: string; chunk: string }
  | { type: 'approval.requested'; requestId: string; kind: 'command' | 'fileChange'; summary: string }
  | { type: 'diff.updated'; files: Array<{ path: string; status: string }> }
  | { type: 'turn.completed'; turnId: string }
  | { type: 'error'; message: string }
```

## Service API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/codex/config` | 返回 service 当前 Codex 默认配置 |
| POST | `/api/codex/sessions` | 创建或恢复 Codex session |
| GET | `/api/codex/sessions/:sessionId/events` | 获取 session 当前事件快照 |
| POST | `/api/codex/sessions/:sessionId/turns` | 发送一轮用户输入 |
| POST | `/api/codex/sessions/:sessionId/approvals/:requestId` | 处理审批请求 |
| POST | `/api/codex/sessions/:sessionId/interrupt` | 中断当前 turn |

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `CODEX_WORKSPACE_ROOT` | `/Users/zweizhao/project/current` | workspace root |
| `CODEX_DEFAULT_MODEL` | `gpt-5.5` | 默认模型 |
| `CODEX_DEFAULT_EFFORT` | `medium` | 默认 reasoning effort |
| `CODEX_APPROVAL_POLICY` | `never` | 默认审批策略 |
| `CODEX_SANDBOX_MODE` | `danger-full-access` | 默认沙盒权限 |
| `CODEX_NETWORK_ACCESS` | `true` | 默认允许联网 |
| `CODEX_ENABLE_REAL_ADAPTER` | `false` | 是否启用真实 Codex adapter |

前端：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `VITE_CODEX_API_BASE_URL` | `http://localhost:3100` | 当前 service base url |

## 变更清单

| 序号 | 文件路径 | 变更类型 | 说明 |
|------|----------|----------|------|
| 1 | `repos/service/src/services/codex/config.js` | 新增 | 读取 Codex 环境配置 |
| 2 | `repos/service/src/services/codex/sessionStore.js` | 新增 | 内存 session/event store |
| 3 | `repos/service/src/services/codex/mockAdapter.js` | 新增 | 第一版 mock Codex adapter |
| 4 | `repos/service/src/services/codex/service.js` | 新增 | Service 业务封装 |
| 5 | `repos/service/src/routes/codex.js` | 新增 | `/api/codex/*` 路由 |
| 6 | `repos/service/app.js` | 修改 | 挂载 Codex 路由 |
| 7 | `repos/app/src/services/codex.ts` | 新增 | 前端 Codex API client |
| 8 | `repos/app/src/components/codex-conversation/CodexConversationModule.tsx` | 新增 | 独立对话组件 |
| 9 | `repos/app/src/pages/DemandDetailPage.tsx` | 修改 | 对话区装配新模块 |

## 测试计划

- 运行 `npm run build` 验证前端类型和构建。
- 运行 service 的 Node 语法检查或启动入口 dry run 能力。
- 用 API 调用验证 `/api/codex/config`、创建 session、发送 turn 返回事件。

## 已知边界

- 第一版不直接连接真实 `codex app-server`，但 service adapter 层保留开关和模块边界。
- 第一版事件流使用事件快照接口；后续可替换为 SSE/WebSocket，而不影响前端组件标准入参。
