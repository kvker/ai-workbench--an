# 测试报告

## 静态验证

| 工程 | 命令 | 结果 |
|------|------|------|
| app | `npm run lint` | 通过 |
| app | `npm run build` | 通过；存在 Vite 大 chunk warning |
| service | `node --check src/routes/codex.js && node --check src/services/codex/service.js` | 通过 |

## API 级验证

使用当前本地 service `http://localhost:3100`：

1. 创建测试 session。
2. `PATCH /api/codex/sessions/:sessionId`，请求体 `{ "archived": true }`。
3. 再次 PATCH，请求体 `{ "archived": false }`。

结果：

```json
{
  "archivedAt": "2026-06-09T03:06:00.774Z",
  "restoredArchivedAt": null
}
```

结论：归档会写入 `metadata.archivedAt`，恢复会清除该字段。
