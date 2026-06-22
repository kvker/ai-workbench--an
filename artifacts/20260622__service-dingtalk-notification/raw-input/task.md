---
source: user
created_at: 2026-06-22
---

# 原始输入

用户提供了一份“钉钉审批通知实现摘要”，希望参考摘要在当前 `repos/service` 中实现发送钉钉消息能力，并整理缺少的物料信息，例如 key。

附件路径：

`/Users/zweizhao/.codex/attachments/16878431-15aa-4a8c-aeaa-60b8c4783b63/pasted-text.txt`

核心参考：

- 钉钉企业机器人单聊接口：`POST https://api.dingtalk.com/v1.0/robot/oToMessages/batchSend`
- 认证：`DINGTALK_CLIENT_ID` / `DINGTALK_CLIENT_SECRET` 换取 access token，请求头使用 `x-acs-dingtalk-access-token`
- 机器人配置：`DINGTALK_ROBOT_CODE`
- 开发环境拦截：`NODE_ENV=development`、`DEV_DINGTALK_INTERCEPT=true`、`DEV_DINGTALK_INTERCEPT_USER_ID`
- 参考项目：`/Users/zweizhao/project/current/tianji/tianji-next/lib/dingtalk.ts`
- 参考审批通知封装：`/Users/zweizhao/project/current/tianji/tianji-next/lib/workflow/notification.ts`
