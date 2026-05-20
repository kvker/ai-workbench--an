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
| 前端登录态 | `projects/app/src/services/auth.ts` 已接入 devops 登录并保存 token；`projects/app/src/services/session.ts` 中 `mockSession.userName = zweizhao` 仍用于工作区 service 的 `x-workspace-user` 兜底 | devops 请求使用真实 token；工作区 service 请求仍带前端声明的用户名 | service 校验登录 token 或 session，从可信身份中解析用户标识；前端不再直接声明工作区用户 | 部分替换 |
| 工作区用户身份 header | 前端通过 `x-workspace-user` 优先传 `userName/realName/displayName`；service 在 `resolveWorkspaceUserId(req)` 中解析，并兼容旧 `x-workspace-user-id` | 需求工程目录命名为 `task-[hash]--[username]` | service 校验登录 token 或 session，从可信身份中解析用户标识；前端不再直接声明工作区用户 | 待替换 |
| service CORS 全放行 | `projects/service/app.js` 设置 `Access-Control-Allow-Origin: *`，预检请求头按浏览器请求动态放行 | 一期内网原型所有前端来源均可调用 service | 正式环境按部署域名、认证方式和凭证策略收紧 CORS | 待收紧 |
| 本地 JSON 过程数据 | 已删除 `projects/service/data/workbench.json`、`jsonStore`、`/api/workspace` 与旧 `/api/task` 工作台数据接口；需求列表、详情、创建改为 devops `IssueController` | 需求列表与详情页数据 | 以 devops 业务接口为准；本地 service 仅保留 Native 能力 | 已替换 |
| 前端内置 fallback 数据 | 已删除 `projects/app/src/services/mock.json` 与 `mockData`；首页和详情页直接请求 devops issue 接口 | service 不可用时页面不再显示原型数据 | 真实环境不使用前端内置业务假数据 | 已替换 |
| 创建需求详情链接默认值 | `projects/app/src/pages/DemandBoardPage.tsx` 创建 issue 时临时提交 `requireDetailUrl=https://www.baidu.com` | 绕过 devops 旧创建拦截；新业务暂不需要真实详情链接 | 后端取消旧拦截或前端提供真实详情链接后删除该默认值 | 临时绕过 |
| 代码页入口 | 顶部旧占位按钮已移除；详情页移动端 FloatButton 优先打开 devops 需求详情链接 `requireDetailUrl`，缺失时不提供真实代码页能力 | 代码页入口尚未完整可用 | 接入当前需求工作区绑定的 vscode-server 或代码页服务地址 | 待接入 |
| Codex 对话 mock adapter | `projects/service/src/services/codex/mockAdapter.js` 在 `CODEX_ENABLE_REAL_ADAPTER=false` 时返回模拟 session、计划、命令输出和 assistant 消息 | 仅用于本地降级/开发；真实 adapter 已支持最小 app-server 对话闭环 | 保留为开发 fallback；正式环境使用 `CODEX_ENABLE_REAL_ADAPTER=true` | 开发 fallback |
| Codex session JSON 持久化 | `projects/service/data/codex-sessions.json` 保存 service 自己的 session 与事件快照 | 原型阶段可恢复历史事件；但 app-server 子进程不会跨 service 重启恢复 | 后续补充真实 app-server thread resume、session 清理策略和更正式的存储方案 | 原型持久化 |
| Codex SSE 鉴权 | `EventSource` 订阅 `/stream` 暂未携带自定义 token header | 本地开发可用；正式环境不能仅依赖当前全放行 CORS | 正式鉴权需使用 cookie、服务端 session 或签名 stream URL | 待接入 |
| Codex approval 未接入 | `projects/service/src/services/codex/realAdapter.js` 中 `resolveApproval` 暂未实现真实 app-server approval 协议 | 遇到真实审批请求时无法在前端完成审批处理 | 接入 app-server 的 approval request/resolution 协议，并补充前端审批 UI | 待接入 |
| vscode-server 代码页入口 | 对话区 command/diff 事件目前只在工作台内轻量展示，尚未联动代码页 | 完整终端、diff、文件编辑能力不应在对话区重复实现 | 后续由 service 提供当前需求 workspace 的 vscode-server URL/deep link，对话区只展示摘要并跳转代码页 | 待接入 |

## 已知注意事项

- 用户目录当前优先使用可读用户名，便于本地识别；若用户名缺失才回退到 user id。
- 工作区目录是服务端文件系统边界，真实接入后不得信任前端传入的用户身份。
- 一期内网原型阶段 service CORS 全放行；正式环境需要收紧来源、方法和请求头。
- 从代码反推的 mock 信息来源于当前代码实现；业务真实性待登录与工作区权限方案确认。
