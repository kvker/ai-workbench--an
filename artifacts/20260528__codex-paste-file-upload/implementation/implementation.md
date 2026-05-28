# 实现记录

## 变更目标

- AI 会话输入框支持从剪贴板粘贴文件。
- 粘贴文件上传到会话工作区的 `tmp/` 目录。
- 后续发送对话时使用上传后的 `/tmp` 文件路径处理。

## 实现说明

- `repos/service/src/routes/codex.js` 新增 `POST /api/codex/sessions/:sessionId/files`，使用 raw body 接收粘贴文件。
- `repos/service/src/services/codex/service.js` 新增 `saveClipboardFile`，按当前 Codex session 的 `cwd` 写入 `tmp/` 目录，文件名做路径剥离、字符清洗、时间戳和随机后缀处理。
- `repos/app/src/services/codex.ts` 新增 `uploadCodexClipboardFile`，上传文件时统一使用 `application/octet-stream`，真实 MIME 通过 query 传递，避免 JSON 文件被全局 JSON parser 抢先处理。
- `repos/app/src/components/codex-conversation/CodexConversationModule.tsx` 在输入框监听 `paste`，发现剪贴板文件后上传；上传成功后只显示文件 chip，发送时把绝对路径拼进实际消息 payload，避免污染输入框。文件 chip 支持点击关闭按钮移除。
- 多文件粘贴上传改为 `Promise.allSettled`，部分文件失败时仍保留成功上传的文件 chip，并提示失败文件数量和名称。
- `repos/app/src/components/codex-conversation/codexConversationUtils.ts` 与 `CodexConversationMessages.tsx` 在用户气泡展示层折叠 `已粘贴文件: {path}` 行，只展示文件名标签，实际发送给 AI 的路径保持不变。
- 图片文件发送时额外作为 `localImage` attachment 传给 Codex app-server；普通文件通过消息文本中的 `tmp/` 路径供后续对话处理。

## 关键行为

- 粘贴文件后文件落点为 `{session.cwd}/tmp/{timestamp}-{random}-{safeName}`。
- 发送前若文件还在上传，发送按钮禁用。
- 发送后清空草稿和已粘贴文件列表。
