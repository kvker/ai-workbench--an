# 测试报告

## 已执行

- `git -C repos/service status --short --branch`
  - 结果：`main...origin/main`。
- `git -C repos/service pull --ff-only`
  - 结果：`Already up to date.`。
- `node -c app.js && node -c src/routes/webhook.js && node -c src/services/harnessRepositoryService.js`
  - 结果：通过。
- 直接调用 `pullHarnessMain()`
  - 结果：`status=up-to-date`。
  - harness 路径：`/Users/zweizhao/project/current/qingtian-harness`。
  - branch：`main`。
  - commit：`68855ad61ebb26891385416b19edd452646c6b5f`。
- `PORT=4310 node app.js` 后执行 `curl -sS -X POST http://127.0.0.1:4310/api/webhook/harness/pull-main`
  - 结果：返回 `status=up-to-date`，branch 为 `main`，before/after commit 一致。
- 2026-06-15 追加验证：临时创建 bare remote、work repo 和 clone repo，直接调用 `pullHarnessMain()`。
  - 远端无新 commit 时返回 `status=up-to-date`，并将 `latestCommit` 写入内存状态。
  - 远端新增 commit 后返回 `status=updated`，并将新的 `afterCommit` 写入内存状态。
- 2026-06-15 追加验证：直接调用 `getHarnessStatus()`。
  - 初始状态返回 `{ latestCommit: null }`。
  - 调用 `pullHarnessMain()` 后返回 `{ latestCommit: afterCommit }`。
