# 原始输入

用户希望弃用当前前端登录页面，改为 SSO 单点登录：

- 账号状态丢失后跳转到 `https://auth.test.dahuangf.com/login?redirect=【protocol + hostname】/auth/sign-in`。
- `https://auth.test.dahuangf.com/login` 和 `https://auth.prod.dahuangf.com/login` 通过 `.env` 追加 `SSO_BASE_URL` 配置；当前环境写入 test。
- `/auth/sign-in` 调用 qingtian 的 `SSO_BASE_URL + /sso/userInfo?appKey={appKey}&ts={ts}&ssoKey={ssoKey}&sign={sign}`。
- 获取到 SSO 用户信息后保存到 `ai-workbench:login-user-qingtian`。
- 再调用 devops 临时接口 `/api/mock/sso`，返回对象格式与当前 `ai-workbench:login-user` 一致。
- 将 devops 返回信息保存到当前 key，后续逻辑暂时不要动。

补充文件：`/Users/zweizhao/Downloads/sso-integration-guide.md`。
