# 实现记录

## 流程等级

L1 快速修复。

## 决策

- 不新增 adapter 层，避免过早抽象。
- `http.ts` 只保留未来真实请求的占位能力，当前不承载业务逻辑。
- mock 数据集中放在 `services/mock.json`，业务服务通过 `workspace.ts` 和 `task.ts` 暴露语义化读取函数。
- 为避免修改 TypeScript 配置，使用 Vite `?raw` 读取 JSON 后解析。

## 变更摘要

- 新增 `repos/app/src/services/types.ts`，集中定义工作台服务层类型。
- 新增 `repos/app/src/services/mock.json` 和 `mockData.ts`，集中维护当前前端 mock 数据。
- 新增 `repos/app/src/services/http.ts`，作为未来真实 HTTP 请求占位。
- 新增 `workspace.ts` 和 `task.ts`，分别承载工作台列表与任务详情相关服务。
- 页面和组件改为从 `services` 入口获取类型与数据，不再直接依赖旧 `workbenchData.ts`。
