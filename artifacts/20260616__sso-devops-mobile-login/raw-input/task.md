# 原始输入

用户提供 devops Java 工程路径：

`/Users/zweizhao/project/current/devops-service`

并说明 devops 已提供接口：

```text
POST /user/loginByMobile
请求体 {"mobile":"<手机号>"}
返回 UserLoginInfoVO（含 token，结构与现有登录一致）
@NoAuth 免鉴权
```

要求当前 SSO 登录流程接入该接口，注意接入方式应与其他 devops 调用一样调用远程 devops 接口，不是调用本地接口。
