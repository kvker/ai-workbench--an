# SSO 登录集成测试报告

## 测试用例

| 序号 | 用例 | 结果 | 备注 |
|------|------|------|------|
| 1 | 前端构建与类型检查：`npm run build` | ✅ | 在 `repos/app` 执行通过 |
| 2 | service mock 路由语法检查：`node -c src/routes/mock.js && node -c app.js` | ✅ | 在 `repos/service` 执行通过 |
| 3 | 未登录跳转路径代码检查 | ✅ | `RequireAuth` 改为 `SsoRedirect`，`/login` 路由也重定向 SSO |
| 4 | SSO 回调存储代码检查 | ✅ | `/auth/sign-in` 调用 `loginWithSsoKey`，写入 qingtian 与 devops 两个 localStorage key |
| 5 | 补充 SSO appKey/appSecret 后重新构建与语法检查 | ✅ | `repos/app` 执行 `npm run build` 通过；`repos/service` 执行 `node -c src/routes/mock.js && node -c app.js` 通过 |
| 6 | 拆分 qingtian 真实 userInfo 与 DevOps mock 映射后验证 | ✅ | `repos/app` 执行 `npm run build` 通过；`repos/service` 执行 `node -c src/routes/sso.js && node -c src/routes/mock.js && node -c app.js` 通过 |

## 缺陷记录

| 序号 | 描述 | 严重程度 | 状态 |
|------|------|----------|------|
| 1 | 初版前端调用路径为 `/mock/sso`，与 service `/api/mock/sso` 不一致 | 中 | 已修复 |

## 未运行项

| 项 | 原因 |
|----|------|
| 浏览器真实 SSO 跳转 | 按项目约定不主动启动本地常驻服务；真实 qingtian 回调需要外部 SSO 环境与 appKey/appSecret |
