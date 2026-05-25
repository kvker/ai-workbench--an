# 首页列表状态码快速修复实现记录

## 范围
- 将首页需求列表请求使用的 harness 状态码调整为 `pm`, `fe`, `be`, `qa`, `archive`。
- `archive` 作为占位状态保留。
- 保留旧数字状态码兼容，避免详情页和历史数据分组失效。

## 变更
- `repos/app/src/services/types.ts`
  - `HarnessStatus` 增加字符串状态码，同时保留旧数字状态。
- `repos/app/src/services/issue.ts`
  - 增加字符串状态标题映射。
  - `allHarnessStatuses` 改为新字符串状态码列表。
- `repos/app/src/services/workflow.ts`
  - 首页列表请求的 `workflowHarnessStatuses` 改为 `pm, fe, be, qa, archive`。
  - 工作流分组同时兼容新字符串状态与旧数字状态。
- `repos/service/src/routes/task.js`
  - 本地流程完成检查支持字符串状态码到 artifact 节点的映射。
