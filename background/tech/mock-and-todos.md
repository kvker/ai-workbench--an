# Mock 与待接入事项

本文件记录当前为了原型推进而保留的 mock、临时方案和未来必须替换的真实接入点。新增、修改或删除 mock 行为时，必须同步更新本文档。

## 同步规则

- 新增 mock、stub、临时默认值、假数据、临时 header、临时环境变量时，必须在本文档登记。
- 修改 mock 的字段名、默认值、作用范围或替换计划时，必须同步更新对应条目。
- 删除 mock 或完成真实接入后，必须将条目标记为“已替换”，并记录替换位置。
- 不确定是否是 mock 时，标记为“待确认”，不要默默当作真实业务逻辑。

## 当前 Mock 清单

| 项 | 当前实现 | 影响范围 | 真实接入方案 | 状态 |
|----|----------|----------|--------------|------|
| 前端登录态 | `projects/app/src/services/auth.ts` 已接入 devops 登录并保存 token；`projects/app/src/services/session.ts` 中 `mockSession.userId = user-zweizhao` 仍用于工作区 service 的 `x-workspace-user-id` | devops 请求使用真实 token；工作区 service 请求仍带 mock user id | service 校验登录 token 或 session，从可信身份中解析 user id；前端不再直接声明工作区用户 | 部分替换 |
| 工作区用户身份 header | 前端通过 `x-workspace-user-id` 传 user id；service 在 `resolveWorkspaceUserId(req)` 中解析 | 需求工程目录命名为 `task-[hash]--[userId]` | service 校验登录 token 或 session，从可信身份中解析 user id；前端不再直接声明工作区用户 | 待替换 |
| service CORS 全放行 | `projects/service/app.js` 设置 `Access-Control-Allow-Origin: *`，预检请求头按浏览器请求动态放行 | 一期内网原型所有前端来源均可调用 service | 正式环境按部署域名、认证方式和凭证策略收紧 CORS | 待收紧 |
| 本地 JSON 过程数据 | `projects/service/data/workbench.json` 保存工作台、任务详情、流程和消息原型数据 | 需求列表与详情页数据 | 替换为真实持久化方案或任务工程内元数据；接口契约需另行确认 | 待替换 |
| 前端内置 fallback 数据 | `projects/app/src/services/mock.json` 与 `mockData` 在服务不可用时作为 fallback | service 不可用时页面仍显示原型数据 | 真实环境下应移除或仅作为开发故事数据，不参与生产运行 | 待替换 |
| 代码页入口 | 详情页移动端 FloatButton 暂时打开 `https://www.baidu.com` | 代码页入口不可用 | 接入当前需求工作区绑定的 vscode-server 或代码页服务地址 | 待替换 |
| Codex 对话 mock adapter | `projects/service/src/services/codex/mockAdapter.js` 在 `/api/codex/*` 下返回模拟 session、计划、命令输出和 assistant 消息 | 对话区可完成模块联调，但未真正调用 `codex app-server` | 在 `projects/service/src/services/codex/service.js` 中按 adapter 接口接入真实 Codex app-server JSON-RPC/SSE/WebSocket 事件流 | 待替换 |
| Codex 事件快照接口 | `GET /api/codex/sessions/:sessionId/events` 返回当前内存事件列表，前端未使用真实流式 SSE/WebSocket | 对话事件不是实时增量推送，刷新后内存 session 丢失 | 后续替换为持久化 session + SSE/WebSocket 事件流，同时保持前端 `CodexConversationModule` 入参不变 | 待替换 |

## 已知注意事项

- 用户目录应使用稳定 user id，不使用 display name 或可变用户名。
- 工作区目录是服务端文件系统边界，真实接入后不得信任前端传入的用户身份。
- 一期内网原型阶段 service CORS 全放行；正式环境需要收紧来源、方法和请求头。
- 从代码反推的 mock 信息来源于当前代码实现；业务真实性待登录与工作区权限方案确认。
