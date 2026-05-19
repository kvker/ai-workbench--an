# 原始输入

用户选择快速修复方式，为前端增加登录页面。

需求要点：

- 登录页包含账号、密码、是否使用 LDAP 登录。
- 登录接口从 devops-service 的 `UserController` 查找。
- 参考接口：`POST /devops/user/login`
- 请求体字段：`username`、`password`、`authType`
- `authType`：使用 LDAP 为 `1`，不使用为 `0`

注意：用户提供的 curl 中包含真实账号密码，过程文档不保存敏感值。
