# 实现记录

## 流程等级

L1 快速修复。用户选择“快速修复”，需求边界明确，直接进入实现并补充记录。

## 计划

- 详情页按钮从“更新文件”改为“更新物料”，点击打开可视化弹框。
- 弹框第一步选择角色：pm、fe、be、qa，支持多选。
- 弹框第二步按 conventions、agents、skills 分组展示物料，支持折叠、单项勾选、全组勾选和取消。
- 默认勾选规则：所选角色对应的 conventions、agents、skills 物料默认勾选；shared/delivery/engineering 等兼容物料保留在列表中，由用户按需勾选。
- 提交时按实际勾选结果更新物料；background 仍由后端每次自动刷新。

## 变更

- `repos/app/src/pages/demand-detail/DemandInfoRegion.tsx`：按钮文案改为“更新物料”。
- `repos/app/src/pages/demand-detail/UpdateMaterialsDialog.tsx`：新增更新物料弹框，提供角色多选、分组折叠、单项勾选、全组勾选/取消。
- `repos/app/src/pages/DemandDetailPage.tsx`：点击按钮改为打开弹框；提交时调用更新物料接口并按结果提示。
- `repos/app/src/services/task.ts`：新增物料列表和更新物料请求类型与 API 方法。
- `repos/service/src/routes/task.js`：新增 `GET /api/task/:issueId/materials`；扩展 `POST /api/task/:issueId/files/update`，请求体带 `roles/materials` 时按选择同步，未带时保留旧 pm 默认行为。
- `repos/service/src/services/knowledgeSyncService.js`：新增物料 manifest、默认选择计算、按选择同步逻辑；background 仍每次自动刷新。

## 决策

- 默认角色为 `pm`，兼容原“更新文件”主要给 PM 工作区补齐知识文件的旧行为。
- 默认勾选包含所选角色物料和兼容物料。这样选择 `pm + fe` 时会默认包含 `pm`、`fe`、`shared` 以及 shared agent 物料，避免丢失旧逻辑中始终合并的通用内容。
- agents 缺失时继续跳过且不计入 missing，沿用此前 Harness agents 同步约定。
