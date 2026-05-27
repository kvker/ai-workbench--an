# 测试记录

- 通过：`cd repos/app && npm run build`
  - 结果：构建成功。
  - 备注：Vite 输出既有 chunk size warning，非本次改动引入的构建失败。
- 通过：`cd repos/app && npm run lint`
  - 结果：ESLint 通过。

## 追加验证

- 通过：`cd repos/app && npm run build`
  - 覆盖：隐藏 `mcp.tool` 气泡，以及过滤原始 `fileChange` / `mcpToolCall` item 更新。
  - 结果：构建成功。
- 通过：`cd repos/app && npm run lint`
  - 结果：ESLint 通过。
