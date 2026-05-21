# Codex 对话模块需求文档

## 背景与目标

当前详情页对话区仍是原型 mock 消息，用户希望基于 Codex app-server 思路，把对话能力封装为可替换、可配置、可独立演进的前端模块和 service 模块。

## 验收标准 (AC)

- [x] AC1: 前端提供独立 `CodexConversationModule`，详情页只通过标准入参装配，不直接实现 Codex 协议细节。
- [x] AC2: service 提供独立 `/api/codex/*` 模块，包含创建 session、读取事件、发送 turn、审批和中断接口。
- [x] AC3: 默认模型、权限、workspace root 和 adapter 开关可通过环境变量配置，默认模型为 `gpt-5.5`，权限为 `danger-full-access`、`approvalPolicy=never`、`networkAccess=true`。
- [x] AC4: 前端默认调用当前 service `http://localhost:3100`，不直接连接 Codex app-server。
- [x] AC5: 第一版即使未接入真实 Codex app-server，也要通过 mock adapter 完成前后端模块联调闭环，并在 mock/todo 文档中登记真实接入点。
- [x] AC6: 前端构建、lint、service 语法检查和最小 API 行为验证通过。

## 范围

### 包含

- 前端对话区模块化。
- Service Codex API 模块化。
- 环境变量默认配置。
- Mock adapter 与后续真实 adapter 边界。
- AI Native artifact、测试与质量评价记录。

### 不包含

- 真实 `codex app-server` JSON-RPC/SSE/WebSocket 连接。
- 持久化 Codex session。
- 多用户鉴权和审计。
- 真实文件变更审批 UI 完整交互。

## 依赖

- 当前 `repos/app` React/Vite/Ant Design 实现。
- 当前 `repos/service` Express 5 实现。
- 后续真实接入依赖 OpenAI Codex app-server 协议和本地 `codex` 可执行文件。

## 涉及模块

- 详情页对话区。
- 前端 services。
- Service routes。
- Service Codex session/adapter 层。

## 开放问题

- 真实 Codex app-server 连接方式最终使用 stdio、WebSocket 还是 Unix socket：待真实部署环境确认。
- Session 是否需要持久化到 JSON、数据库或需求工作区元数据：待后续架构确认。
