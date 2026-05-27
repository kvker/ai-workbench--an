# 实现记录

## 流程等级

采用 L1 快速修复。

原因：用户明确选择“快速修复”，目标集中在 Codex 对话输入兼容、事件/气泡渲染和根 AGENTS.md 文档路由补充；不新增依赖、不改数据库、不涉及鉴权或部署配置。

## 官方文档依据

- `https://developers.openai.com/codex/app-server`
- `turn/start` 的 `input` 使用内容数组，文本项为 `{ type: "text", text, text_elements: [...] }`。
- `$<skill-name>` 可通过 `text_elements` 同时发送 `{ type: "skill", name, path }`，降低模型自行解析 `$` 的延迟。
- `$<app-slug>` 可通过 `text_elements` 同时发送 `{ type: "mention", name, path: "app://<id>" }`。
- 对话流包含 `userMessage`、`agentMessage`、`reasoning`、`commandExecution`、`fileChange`、`mcpToolCall` 等 item，需要前端气泡兼容非纯文本事件。

