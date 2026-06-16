# SSO 接入 DevOps 手机号登录测试报告

## 测试用例

| 序号 | 用例 | 结果 | 备注 |
|------|------|------|------|
| 1 | 前端构建与类型检查：`npm run build` | ✅ | 在 `repos/app` 执行通过 |
| 2 | service 语法检查：`node -c src/routes/sso.js && node -c app.js` | ✅ | 在 `repos/service` 执行通过 |
| 3 | 旧 mock 引用检查：`rg "routes/mock\\|/api/mock\\|mock/sso"` | ✅ | 产品代码无旧 mock 路由引用，文档中仅保留替换记录 |

## 未运行项

| 项 | 原因 |
|----|------|
| 真实 SSO 到 DevOps 全链路浏览器验证 | 按项目约定不主动启动本地常驻服务；需要人工使用有效一次性 `ssoKey` 验证 |
