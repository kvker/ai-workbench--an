# Service 钉钉消息通知技术规范

## 目标

在 `repos/service` 中先实现可复用的钉钉企业机器人单聊发送能力，并提供按手机号列表发送消息的接口。当前只构建抽象，不迁移参考项目里的审批业务封装，不假设当前工作台拥有同样的审批实例、审批任务或用户表模型。

## 数据模型

### `sendRobotMessage`

```js
sendRobotMessage(
  userIds: string[],
  markdown: { title: string, text: string },
  userNames?: string[]
) => Promise<{ skipped: boolean, sent: boolean, targetUserIds: string[], processQueryKey?: string, reason?: string }>
```

### 手机号发送接口

```http
POST /api/dingtalk/send-by-mobiles
Content-Type: application/json

{
  "mobiles": ["手机号"],
  "title": "可选标题",
  "text": "可选 Markdown 正文"
}
```

## 变更清单

| 序号 | 变更项 | 文件路径 | 类型 | 说明 |
|------|--------|----------|------|------|
| 1 | 钉钉机器人服务 | `repos/service/src/services/dingtalkService.js` | 新增 | 封装 access token 缓存、机器人单聊发送、开发拦截 |
| 2 | 钉钉路由 | `repos/service/src/routes/dingtalk.js` | 新增 | 提供按手机号列表发送接口 |
| 3 | 路由挂载 | `repos/service/app.js` | 修改 | 挂载 `/api/dingtalk` |
| 4 | 临时/待接入记录 | `background/tech/mock-and-todos.md` | 修改 | 登记钉钉发送配置和用户钉钉 userId 来源待接入 |

## 配置

需要环境变量：

- `DINGTALK_CLIENT_ID`
- `DINGTALK_CLIENT_SECRET`
- `DINGTALK_ROBOT_CODE`
- `DEV_DINGTALK_INTERCEPT`
- `DEV_DINGTALK_INTERCEPT_USER_ID`

## 缺失物料

- 当前业务里手机号换钉钉 `userId` 的真实实现方案

## 测试计划

- 执行 `npm run check` 验证 CommonJS 语法。
- 使用占位手机号映射调用 `sendRobotMessageByMobiles` 验证发送链路。
