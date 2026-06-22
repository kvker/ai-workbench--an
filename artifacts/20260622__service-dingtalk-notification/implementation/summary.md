# 实现摘要

## 已实现

- 新增 `repos/service/src/services/dingtalkService.js`：
  - 通过 `DINGTALK_CLIENT_ID` / `DINGTALK_CLIENT_SECRET` 获取并缓存 access token。
  - 使用 `DINGTALK_ROBOT_CODE` 调用钉钉企业机器人单聊批量发送接口。
  - 支持开发环境消息拦截：`NODE_ENV=development`、`DEV_DINGTALK_INTERCEPT=true`、`DEV_DINGTALK_INTERCEPT_USER_ID`。
  - 对外暴露 `sendRobotMessage(userIds, markdown, userNames)`。
- 增加手机号发送占位链路：
  - `resolveDingtalkUserIdsByMobiles(mobiles)`：当前对每个手机号返回 mock 钉钉 userId `0337424348694199`。
  - `sendRobotMessageByMobiles(mobiles, markdown)`：先解析手机号列表，再复用 `sendRobotMessage` 发送。
  - `POST /api/dingtalk/send-by-mobiles`：用于通过手机号列表发送钉钉消息。
- 修改 `repos/service/app.js`：
  - 挂载 `/api/dingtalk` 路由。
- 更新 `background/tech/mock-and-todos.md`：
  - 登记钉钉发送配置和钉钉 userId 来源待接入。

## 边界

本轮只构建发送抽象，不迁移参考项目的审批实例、审批任务、用户绑定和审批状态触发逻辑。

## 缺少物料

- `DINGTALK_CLIENT_ID`
- `DINGTALK_CLIENT_SECRET`
- `DINGTALK_ROBOT_CODE`
- 如果本地开发不想误发真实用户：`DEV_DINGTALK_INTERCEPT_USER_ID`
- 手机号换钉钉 userId 的真实实现方案。
