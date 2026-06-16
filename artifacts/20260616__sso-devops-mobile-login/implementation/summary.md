# SSO 接入 DevOps 手机号登录实现摘要

## 已完成

| 项 | 说明 |
|----|------|
| 远程 DevOps 登录 | `repos/service/src/routes/sso.js` 新增 `POST /api/sso/devops-login`，用 qingtian 手机号调用 `${DEVOPS_API_BASE_URL}/user/loginByMobile` |
| 前端调用切换 | `repos/app/src/services/auth.ts` 将 SSO 第二步从 `/api/mock/sso` 改为 `/api/sso/devops-login` |
| mock 移除 | 删除 `repos/service/src/routes/mock.js`，并从 `repos/service/app.js` 移除 `/api/mock` 路由 |
| 文档同步 | `background/tech/mock-and-todos.md` 将 SSO DevOps 映射 mock 标记为已替换 |

## 关键决策

- 远程 DevOps 地址沿用 service 现有 `DEVOPS_API_BASE_URL` 配置，默认值为 `http://devops-api.dahuangf.com:8090/devops`。
- URL 拼接使用 `${DEVOPS_API_BASE_URL}/user/loginByMobile`，避免 `new URL('/path', base)` 吞掉 base 中的 `/devops` 前缀。
- 前端仍只调用本地 service，由 service 编排 qingtian SSO 与远程 devops 登录，避免前端承担跨系统登录细节。
