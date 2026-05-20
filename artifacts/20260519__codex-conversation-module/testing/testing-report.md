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
| 7 | 真实 app-server 最小闭环 | 通过 | 临时端口 `43101`，`codex-cli 0.128.0`，发送“只回复 pong”，后续 events 返回 `message.delta:pong`、`message.completed:pong`、`turn.completed` |
| 8 | SSE 真实事件流 | 通过 | 临时端口 `43103`，订阅 `/stream` 后发送“只回复 pong”，SSE 实时收到 `session.connected`、`turn.started`、`message.delta:pong`、`message.completed:pong`、`turn.completed` |
| 9 | session/events 持久化恢复 | 通过 | 临时端口 `43104` 创建 `persist-demo` session 并产生 7 条事件；重启到 `43105` 后 `GET /api/codex/sessions?demandId=persist-demo&workspaceId=persist-workspace` 仍返回同一 session 与 7 条事件 |

## 缺陷记录

| 序号 | 描述 | 严重程度 | 状态 |
|------|------|----------|------|
| 1 | 真实 approval 处理尚未完成 | 中 | 待下一阶段实现 |
| 2 | EventSource 暂不携带自定义 token header | 中 | 本地可用；正式鉴权需 cookie 或服务端 session |
| 3 | app-server 子进程不跨 service 重启恢复 | 中 | session 事件已恢复；真实 thread resume 策略待后续完善 |

## 构建提示

前端构建存在 Vite chunk size warning，属于当前依赖体积提示，不阻塞本次功能验证。
