# SSO 登录集成实现摘要

## 已完成

| 项 | 说明 |
|----|------|
| 登录入口 | 非 iframe 场景下未登录不再进入账号密码页，而是跳转 SSO 登录地址 |
| 回调路由 | 新增 `/auth/sign-in`，读取 `ssoKey` 并完成登录态写入 |
| 存储 | 新增 `ai-workbench:login-user-qingtian` 保存 qingtian 用户；保留 `ai-workbench:login-user` 供后续逻辑继续使用 |
| service SSO | 新增 `/api/sso/user-info`，服务端使用 `SSO_APP_KEY/SSO_APP_SECRET` 调用 qingtian userInfo |
| service mock | 调整 `/api/mock/sso` 为仅接收 qingtian 用户并构造 DevOps 登录态形状，token 透传 qingtian 真实返回值 |
| 配置 | app 与 service 均追加 `SSO_AUTH_URL`；app 另加 `VITE_SSO_AUTH_URL` 和 `VITE_SSO_APP_KEY` 供 Vite 运行时代码读取；service 本地 `.env` 追加 `SSO_APP_KEY/SSO_APP_SECRET` 用于签名 |

## 关键决策

- SSO 签名不放前端实现，因为接入文档明确 `appSecret` 只能在服务端使用。
- 前端登录 URL 仅追加公开参数 `ssoLogin=1` 和 `appKey`，不携带 `redirect`；服务端仍独立使用私密 `SSO_APP_SECRET` 换取用户信息。
- qingtian SSO 用户信息是真实获取；当前 devops 映射接口按用户要求使用临时 `/api/mock/sso`，并在 `mock-and-todos.md` 登记待替换。
- 旧 `LoginPage` 文件暂未删除，但 `/login` 路由已改为 SSO redirect，避免破坏历史路径访问。
