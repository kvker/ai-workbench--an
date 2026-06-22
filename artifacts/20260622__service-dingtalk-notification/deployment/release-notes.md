# 发布说明

## 变更摘要

service 新增钉钉企业机器人单聊发送抽象，并提供 `/api/dingtalk/send-by-mobiles` 按手机号列表发送接口。当前不绑定具体审批或业务流程。

## 上线配置

上线前需要配置：

- `DINGTALK_CLIENT_ID`
- `DINGTALK_CLIENT_SECRET`
- `DINGTALK_ROBOT_CODE`

开发环境建议配置：

- `DEV_DINGTALK_INTERCEPT=true`
- `DEV_DINGTALK_INTERCEPT_USER_ID`

## 验证

- 已执行 `repos/service` 的 `npm run check`，结果通过。
- 手机号换钉钉 userId 当前仍是占位实现，等待真实转换方案。

## 回滚方案

移除 `/api/dingtalk` 路由挂载及新增的 `dingtalkService`、`dingtalk` 路由文件即可回滚。
