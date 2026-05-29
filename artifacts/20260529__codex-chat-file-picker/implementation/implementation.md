# 实现记录

## 目标

- 在 AI 会话输入区左下角增加批量选择文件按钮。
- 增加批量上传整个文件夹按钮。
- 复用现有上传到工作区 `tmp/` 目录与文件 chip 展示能力。

## 实现说明

- `repos/app/src/components/codex-conversation/CodexConversationModule.tsx` 在输入区左下角新增两个图标按钮：批量选择文件、选择文件夹。
- 新增隐藏的 `input[type=file][multiple]` 和目录选择 input；目录选择通过浏览器支持的 `webkitdirectory/directory` 属性启用。
- 将粘贴上传逻辑抽为通用 `uploadFiles`，粘贴、选择文件、选择文件夹都复用同一套上传、失败提示、chip 展示和移除逻辑。
- `repos/app/src/services/codex.ts` 的上传 API 增加 `relativePath` 与 `batchId` 参数，用于文件夹上传保留目录结构。
- `repos/service/src/routes/codex.js` 透传 `relativePath` 与 `batchId` query。
- `repos/service/src/services/codex/service.js` 支持将文件夹上传写入 `tmp/{batchId}/{relativePath}`，同时清洗目录段，避免路径穿越。

## 行为说明

- 批量选择文件：多个文件按现有规则写入工作区 `tmp/` 根下，文件名带时间戳和随机后缀。
- 批量选择文件夹：同一次选择会写入工作区 `tmp/{batchId}/` 下，并保留文件夹内部相对路径。
- 文件上传成功后仍显示为可移除 chip；发送时将对应 tmp 路径拼进实际消息 payload。
- 文件 chip 列表最高 200px，超过后在列表内部纵向滚动，避免文件夹上传时撑高输入区。
