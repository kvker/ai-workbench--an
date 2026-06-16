# SSO 接入 DevOps 手机号登录技术规范

## 代码事实

从 `/Users/zweizhao/project/current/devops-service` 确认：

- `devops-interfaces/.../UserController.java` 存在 `@PostMapping("loginByMobile")`。
- 方法标注 `@NoAuth`。
- 请求体类型 `UserMobileLoginReqVO` 仅包含 `mobile`。
- 返回类型为 `BaseResult<UserLoginInfoVO>`，字段包含 `userId`、`userName`、`displayName`、`userSource`、`realName`、`mobile`、`nick`、`dingTalkUserId`、`yunxiaoAccessToken`、`token`。

## 核心逻辑

- `/auth/sign-in` 继续先通过 service `/api/sso/user-info` 真实换取 qingtian 用户信息。
- qingtian 用户信息继续保存到 `ai-workbench:login-user-qingtian`。
- DevOps 登录态不再由 `/api/mock/sso` 构造，改为 service 调远程 devops：

```text
POST ${DEVOPS_API_BASE_URL}/user/loginByMobile
Content-Type: application/json

{"mobile":"<qingtianUser.mobile>"}
```

- service 将远程 devops 返回的 `UserLoginInfoVO` 返回给前端。
- 前端保存为 `ai-workbench:login-user`，后续逻辑不变。

## 变更清单

| 序号 | 文件 | 变更 |
|------|------|------|
| 1 | `repos/service/src/routes/sso.js` | 新增 `POST /api/sso/devops-login`，以 qingtian 手机号调用远程 devops `loginByMobile` |
| 2 | `repos/service/app.js` | 移除 `/api/mock` 路由挂载 |
| 3 | `repos/service/src/routes/mock.js` | 删除旧 DevOps mock 映射路由 |
| 4 | `repos/app/src/services/auth.ts` | SSO 登录第二步改调 `/api/sso/devops-login` |
| 5 | `background/tech/mock-and-todos.md` | 将 SSO DevOps 映射 mock 标记为已替换 |

## 测试计划

- `repos/app`: `npm run build`
- `repos/service`: `node -c src/routes/sso.js && node -c app.js`
