# 实现记录

## 决策

- 新增 `LoginPage` 作为 `/login` 路由，登录成功后回到原访问路径或 `/demands`。
- 新增 `authService`，调用 devops `/user/login`，并将返回的用户信息与 token 保存到 `localStorage`。
- `authType` 由“是否使用 LDAP 登录”复选框映射：勾选为 `1`，未勾选为 `0`。
- `App` 增加轻量路由守卫：无 token 时跳转登录页。
- `http.request` 支持指定 `baseUrl`，并对 devops 的 `BaseResult` 结构进行解包；后续请求自动追加 `token` header。
- devops 登录接口默认 base URL 为 `http://devops-api.dahuangf.com:8090/devops`，可通过 `VITE_DEVOPS_API_BASE_URL` 覆盖。
- 已确认登录接口可直接返回用户对象；当前 `http.request` 同时兼容直接对象和 `BaseResult` 包装结构。
- `http.request` 统一处理 HTTP 401：清理本地登录态，弹出“登录状态已失效”提示，用户点击确认后跳转 `/login`。

## 来源

- 登录接口来源：`/Users/zweizhao/project/current/devops-service/devops-interfaces/src/main/java/com/dahuangf/devops/interfaces/controller/UserController.java`
- 请求体来源：`UserLoginReqVO`
- token 名来源：`devops-interfaces/src/main/resources/application.yml` 的 `sa-token.token-name`
