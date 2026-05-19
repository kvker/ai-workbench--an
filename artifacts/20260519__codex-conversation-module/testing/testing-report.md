# Codex 对话模块测试报告

## 测试用例

| 序号 | 用例 | 结果 | 备注 |
|------|------|------|------|
| 1 | 前端生产构建 | 通过 | `npm run build` |
| 2 | 前端 lint | 通过 | `npm run lint` |
| 3 | service JS 语法检查 | 通过 | `node --check app.js && find src -name '*.js' -print0 \| xargs -0 -n1 node --check` |
| 4 | Codex config API | 通过 | 临时端口 `43100` 调用 `GET /api/codex/config`，返回 `gpt-5.5`、`danger-full-access`、`networkAccess=true` |
| 5 | Codex session 创建 | 通过 | `POST /api/codex/sessions` 成功返回 session/thread |
| 6 | Codex turn 发送 | 通过 | `POST /api/codex/sessions/:id/turns` 成功返回用户消息、计划、命令输出和 assistant mock 响应 |

## 缺陷记录

| 序号 | 描述 | 严重程度 | 状态 |
|------|------|----------|------|
| 1 | 真实 `codex app-server` adapter 尚未接入 | 中 | 已登记到 mock-and-todos |
| 2 | 事件接口为快照，不是实时 SSE/WebSocket | 中 | 已登记到 mock-and-todos |

## 构建提示

前端构建存在 Vite chunk size warning，属于当前依赖体积提示，不阻塞本次功能验证。
