# Codex 编辑旧轮次并分叉 技术规范

## 目标

在前端对话区提供“编辑并分叉”能力：

- 对用户气泡提供编辑入口。
- 用户提交编辑后的内容时，service 基于当前会话 fork 一个新 Codex thread/session。
- 新 session 回滚到被编辑用户轮次之前。
- 新 session 使用编辑后的文本发起新的 turn。
- 前端切换到新 session，原 session 作为历史分支保留。

## 官方接口依据

基于 Codex app-server 文档中的能力组合：

- `thread/fork`：从已有 thread 创建新 thread。
- `thread/rollback`：从 thread 的 model-visible context 移除最近 N 个 turns。
- `turn/start`：在指定 thread 上发起新 turn。

注意：本环境直接 `curl https://developers.openai.com/codex/app-server` 返回 403；以上依据来自本轮前一问题已核对的官方文档结论。实现时保持接口封装集中在 service adapter，便于后续按官方文档细节微调。

## 后端变更

### API

新增：

```http
POST /api/codex/sessions/:sessionId/turns/:turnId/fork
```

请求体：

```json
{
  "text": "编辑后的用户输入",
  "textElements": [],
  "attachments": []
}
```

响应：

```ts
{
  session: CodexSession
  events: CodexConversationEvent[]
}
```

### 逻辑

1. 查找原 session。
2. 基于原 session 的 threadId 调用 adapter fork。
3. 根据原 session events 计算目标 turn 及其之后的 turn 数 `numTurns`。
4. 对 fork thread 调用 rollback。
5. 创建新 session，metadata 记录 fork 来源。
6. 对新 session 发送编辑后的 turn。

## 前端变更

### UI

- 用户气泡底部新增编辑图标。
- 点击后进入内联编辑态：Textarea + 取消/发送。
- 提交后调用后端 fork API。
- 成功后切换到新 session 并刷新历史会话。

### 限制

- 只对有 `turnId` 的用户消息显示编辑入口。
- 暂不支持编辑附件内容；提交时沿用当前文本和 mention 元素。
- 如果当前 turn 正在运行，禁用编辑入口。

## 验证

- app：`npm run lint`、`npm run build`
- service：`npm test` 或 `npm run` 中可用验证；若无测试脚本，至少运行 `node --check` 关键文件。
