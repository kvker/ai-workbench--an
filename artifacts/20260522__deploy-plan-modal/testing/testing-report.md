# 发布计划弹框测试报告

## 测试用例

| 序号 | 用例 | 结果 | 备注 |
|------|------|------|------|
| 1 | service 入口语法检查：`node --check app.js` | ✅ | 通过 |
| 2 | service task 路由语法检查：`node --check src/routes/task.js` | ✅ | 通过 |
| 3 | service 发布计划仓库服务语法检查：`node --check src/services/deployPlanRepositoryService.js` | ✅ | 通过 |
| 4 | 前端构建：`npm run build` | ✅ | 通过，Vite 输出既有 chunk size warning |
| 5 | 本次改动文件 lint：`npx eslint src/pages/DemandDetailPage.tsx src/pages/demand-detail/DeployPlanDialog.tsx src/pages/demand-detail/DemandInfoRegion.tsx src/pages/demand-detail/demandDetailData.ts src/services/deployPlan.ts src/services/task.ts src/services/types.ts src/services/index.ts` | ✅ | 通过 |
| 6 | 前端全量 lint：`npm run lint` | ✅ | 通过 |

## 缺陷记录

| 序号 | 描述 | 严重程度 | 状态 |
|------|------|----------|------|
| 1 | `DemandBoardPage.tsx` 既有 effect 中同步触发加载触发 lint 规则 | 中 | 已修复并验证通过 |

## 备注

- 未启动前端开发服务；本次完成了构建和静态检查。
- 未真实调用 devops 接口和 Git clone，因为需要真实登录 token、仓库权限和接口环境。
