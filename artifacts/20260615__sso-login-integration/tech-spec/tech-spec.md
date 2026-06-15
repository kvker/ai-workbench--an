# SSO 登录集成技术规范

## 数据模型

```ts
type QingtianSsoUser = {
  userId: number
  mobile: string
  dingdingUserId?: string
  realName?: string
  nick?: string
}
```

## 核心逻辑

- 未登录且非 iframe 场景：跳转到 `${VITE_SSO_AUTH_URL}/login?ssoLogin=1&appKey=${VITE_SSO_APP_KEY}`，不额外携带 `redirect` 参数。
- `/auth/sign-in`：读取 URL 中的 `ssoKey`，调用前端 auth service 完成 SSO 登录。
- auth service：
  1. 使用后端 `/api/sso/user-info?ssoKey=...` 真实换取 qingtian 用户信息。
  2. 将 qingtian 用户信息保存到 `ai-workbench:login-user-qingtian`。
  3. 调用 `/api/mock/sso` 将 qingtian 用户临时映射为 DevOps 登录用户。
  4. 将 devops 登录用户保存到现有 `ai-workbench:login-user`。
- service SSO 路由：
  - 提供 `/api/sso/user-info`，服务端使用 appSecret 计算签名并调用 qingtian SSO userInfo。
- service mock 路由：
  - 提供 `/api/mock/sso` 临时接口。
  - 入参为 qingtian 用户，返回形状等同当前 `ai-workbench:login-user` 的 DevOps 登录对象。

## 变更清单

| 序号 | 变更项 | 文件路径 | 变更类型 | 说明 |
|------|--------|----------|----------|------|
| 1 | SSO 环境变量 | `repos/app/.env`、`repos/app/.env.example` | 修改 | 新增 `SSO_AUTH_URL` 与 `VITE_SSO_AUTH_URL` |
| 2 | SSO 存储与服务 | `repos/app/src/services/authStorage.ts`、`repos/app/src/services/auth.ts`、`repos/app/src/services/types.ts` | 修改 | 增加 qingtian 用户存储和 SSO 登录方法 |
| 3 | SSO 回调页 | `repos/app/src/pages/SsoSignInPage.tsx` | 新增 | 处理 `/auth/sign-in` 回调 |
| 4 | 路由与登录跳转 | `repos/app/src/App.tsx` | 修改 | 弃用登录页路由，未登录跳转 SSO |
| 5 | service SSO 与 mock 接口 | `repos/service/src/routes/sso.js`、`repos/service/src/routes/mock.js`、`repos/service/app.js` | 新增/修改 | 真实 qingtian userInfo 与临时 DevOps 映射分离 |
| 6 | mock 登记 | `background/tech/mock-and-todos.md` | 修改 | 登记临时 SSO mock |

## 测试计划

- 运行 `npm run build` 验证前端类型检查与构建。
- 使用 service 路由的同步逻辑做静态检查；不启动常驻服务。
