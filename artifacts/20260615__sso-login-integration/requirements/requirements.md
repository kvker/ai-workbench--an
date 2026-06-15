# SSO 登录集成需求文档

## 背景与目标

当前前端已有账号密码登录页。用户要求弃用该页面，改为平台 SSO 单点登录；登录完成后仍沿用现有 `ai-workbench:login-user` 登录态格式，避免影响后续业务逻辑。

## 验收标准 (AC)

- [x] AC1: 非 iframe 场景下，账号状态丢失或访问 `/login` 时前往 SSO 登录页。
- [x] AC2: SSO 登录地址通过环境变量配置，当前环境使用 `https://auth.test.dahuangf.com`。
- [x] AC3: `/auth/sign-in` 能读取 SSO 回调 `ssoKey` 并触发登录流程。
- [x] AC4: 登录流程保存 qingtian 用户信息到 `ai-workbench:login-user-qingtian`。
- [x] AC5: 登录流程调用临时 devops 映射接口 `/api/mock/sso`，并把返回的登录用户保存到 `ai-workbench:login-user`。
- [x] AC6: 后续业务仍通过现有 `authService.isLoggedIn()`、token 和用户信息读取逻辑工作。
- [x] AC7: SSO 签名密钥不暴露在前端代码中。

## 范围

### 包含

- 前端 SSO 跳转与回调路由。
- 登录态 localStorage 写入。
- service 临时 `/api/mock/sso` 接口。
- mock 登记与任务产物记录。

### 不包含

- 真实 devops 用户匹配和真实 token 发放。
- SSO 平台回调地址注册。
- 线上生产环境 `auth.prod.dahuangf.com` 切换。

## 依赖

- qingtian SSO 平台。
- 后续真实接入所需 `SSO_APP_KEY`、`SSO_APP_SECRET`。
- devops 真实 SSO 映射接口。

## 涉及模块

- 前端登录入口和认证服务。
- service 临时 mock 路由。
- AI Native mock 与待办登记。

## 开放问题

- 无代码实现阻塞项；真实 devops 映射接口与 SSO appKey/appSecret 待外部提供。
