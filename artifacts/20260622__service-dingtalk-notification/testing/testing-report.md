# 测试报告

## 测试用例

| 序号 | 用例 | 结果 | 备注 |
|------|------|------|------|
| 1 | `repos/service` 执行 `npm run check` | 通过 | 所有 `app.js`、`src`、`scripts` 下的 `.js` 文件均通过 `node --check` |
| 2 | 通过 `sendRobotMessageByMobiles(['13800000000'], ...)` 发送测试消息 | 通过 | 占位函数解析为 `0337424348694199`，钉钉返回 `processQueryKey=Ea3z43TUw4zz+ICFHC9Td9fUecqxUsoWgPqAaN7DrXU=` |

## 未执行项

| 项 | 原因 |
|----|------|
| 手机号换钉钉 userId 真实逻辑 | 当前按用户要求先 mock 返回固定钉钉 userId，等待真实转换方案 |
