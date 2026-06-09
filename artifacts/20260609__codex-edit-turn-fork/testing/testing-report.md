# 测试报告

## 静态验证

| 工程 | 命令 | 结果 |
|------|------|------|
| app | `npm run lint` | 通过 |
| app | `npm run build` | 通过；存在 Vite 大 chunk warning |
| service | `node --check src/routes/codex.js && node --check src/services/codex/service.js && node --check src/services/codex/realAdapter.js && node --check src/services/codex/mockAdapter.js && node --check src/services/codex/sessionStore.js` | 通过 |

## API 级验证

使用临时 mock service：

```bash
PORT=3110 CODEX_ENABLE_REAL_ADAPTER=false npm start
```

验证步骤：

1. 创建 session。
2. 发送“第一轮原始文本”。
3. 发送“第二轮原始文本”。
4. 对第一轮用户消息调用 `POST /api/codex/sessions/:sessionId/turns/:turnId/fork`，提交“第一轮编辑后文本”。

结果：

```json
{
  "rollback": 2,
  "users": ["第一轮编辑后文本"]
}
```

结论：从第一轮编辑分叉时，新 session 正确回滚原第 1-2 轮，并以编辑后的第一轮重新发起 turn。

## Review 修复后复验

子代理 review 发现 rollback 计数可能被真实 adapter 的乐观 user echo 干扰。修复后重新执行 mock API 级验证，结果：

```json
{
  "rollback": 2,
  "users": [
    {
      "text": "第一轮编辑后文本",
      "turnId": "turn_mq61lc4d",
      "visible": true
    }
  ]
}
```

结论：新分支用户消息带 `isModelVisibleTurn: true`，rollback 计数仍为 2，符合预期。

## 并发保护修复后复验

子代理二次 review 发现 service 层 start/fork 仍有并发窗口，且异常乐观 echo 可能显示编辑入口。修复后重新执行静态验证和 mock API 级验证。

静态验证：

- `npm run lint`：通过
- `npm run build`：通过；存在 Vite 大 chunk warning
- service `node --check` 关键文件：通过

mock API 级验证结果：

```json
{
  "rollback": 2,
  "users": [
    {
      "text": "第一轮编辑后文本",
      "turnId": "turn_mq61saia",
      "visible": true
    }
  ]
}
```

结论：同一 session 操作已串行化，前端异常 echo 不再生成可编辑 turn id，核心分叉链路仍通过。

## 真实 adapter 观察

当前本地 service 默认启用真实 adapter。对正在运行的 session 分叉会返回：

```json
{ "message": "Cannot fork a session while a turn is running." }
```

该行为符合实现约束，前端也会在 busy 状态禁用编辑入口。
