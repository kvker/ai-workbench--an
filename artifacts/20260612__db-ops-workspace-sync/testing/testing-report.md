# DB ops 工作区同步测试报告

## 测试用例

| 序号 | 用例 | 结果 | 备注 |
|------|------|------|------|
| 1 | 前端 TypeScript 构建 | 通过 | `npm run build`，仅有既有 chunk size warning |
| 2 | 前端 ESLint | 通过 | `npm run lint` |
| 3 | 后端语法检查 | 通过 | `node --check src/services/dbMaterialsService.js && node --check src/routes/db.js && node --check src/services/workspaceService.js` |
| 4 | DB 工作区复制已选目录 | 通过 | 临时 Harness 下创建 `orders`、`users`，同步后目标用户目录包含两个目录且内容一致 |
| 5 | 取消勾选清理旧目录 | 通过 | 第二次只同步 `users`，目标用户目录中 `orders` 被移除 |
| 6 | DB 对话区使用同步工作区 | 通过 | 前端构建验证 `workspacePath` 传入 `CodexConversationModule`，`workspaceId` 按用户 DB 工作区隔离 |
| 7 | 勾选同步防抖 | 通过 | 前端 lint/build 验证 3 秒防抖实现和卸载清理定时器无类型错误 |
| 8 | 刷新后反向勾选 | 通过 | 服务方法级验证：先同步 `orders`，再调用 `listDbMaterials()` 返回 `workspaceMaterialIds: ["orders"]` |
| 9 | 同用户并发同步 | 通过 | `Promise.all` 同时同步 `finance-platform` 两次，未出现 `EEXIST`，目标目录内容正确 |

## 验证命令

```bash
cd repos/app && npm run lint
cd repos/app && npm run build
cd repos/service && node --check src/services/dbMaterialsService.js && node --check src/routes/db.js && node --check src/services/workspaceService.js && node --check src/services/codex/config.js
```

服务方法级验证使用临时 Harness 目录创建 `orders`、`users` 两个物料目录：

- 第一次同步 `orders`、`users`，目标用户目录包含两个目录，`orders/schema.md` 内容一致。
- 第二次只同步 `users`，目标用户目录只剩 `users`。
- 反向勾选验证先同步 `orders`，再读取物料列表，返回的 `workspaceMaterialIds` 只包含 `orders`。
- 并发验证同时发起两次同用户同步，返回两次 `synced`，目标目录包含 `finance-platform`。
- 测试结束清理临时 Harness 目录和测试用户目录。

## 缺陷记录

无未关闭缺陷。
