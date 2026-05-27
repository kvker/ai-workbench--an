# 实现记录

- 采用 L1 快速修复：目标明确，局部前端渲染问题，另补后端事件元数据。
- 前端对 `diff.updated` 按 turn 聚合为单个文件变更气泡，避免每次 diff 更新追加新消息。
- 前端不再把无正文的 `file.change` completed 事件渲染成独立气泡。
- 文件变更内容改用 `<pre>` 纯文本展示，避免 diff/伪代码块被 Markdown 解析导致格式错乱。
- 后端 `turn/diff/updated` 事件补充 `turnId`，用于前端按 turn 归并。
- 前端不再将 `mcp.tool` 渲染为聊天气泡。
- 前后端均将原始 `fileChange` / `mcpToolCall` item 更新视为噪音事件，避免兜底气泡打印 `fileChange` 或 `mcpToolCall`。
