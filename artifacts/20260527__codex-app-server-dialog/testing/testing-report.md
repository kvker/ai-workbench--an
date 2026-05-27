# 测试报告

## 验证命令

| 命令 | 工作目录 | 结果 |
|------|----------|------|
| `npm run lint` | `repos/app` | 通过 |
| `npm run build` | `repos/app` | 通过；Vite 输出 chunk size warning，非本次改动阻塞项 |
| `node --check src/services/codex/realAdapter.js` | `repos/service` | 通过 |
| `node --check src/services/codex/mockAdapter.js` | `repos/service` | 通过 |
| `PORT=3199 CODEX_ENABLE_REAL_ADAPTER=false node app.js` + `POST /api/codex/sessions` + `POST /api/codex/sessions/:id/turns` | `repos/service` | 通过；返回 slashCommand、textElements、reasoning.completed、mcp.tool、file.change、message.completed |

## 结果

通过。

## 注意事项

- 本地接口烟测使用 mock adapter，未调用真实 Codex app-server。
- 官方文档页面通过浏览器工具引用；本地 `curl` 直接访问该 URL 返回 Forbidden，因此未将文档正文保存到仓库。
