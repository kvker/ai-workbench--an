# 效能看板技术规格

## 流程等级

L2 标准开发。原因：新增用户可见菜单和报表页面，涉及前端路由、数据服务、指标口径和页面布局，但不修改后端接口、权限或持久化结构。

## 数据口径

| 指标 | 口径 |
|------|------|
| 当前归档耗时 | DirectUS `ops_issue` 中已进入 Harness 且归档状态等于 2 的需求，使用 `created_at` 时间到 `updated_at` 时间的间隔 |
| 归档时间 | issue 表归档状态等于 2 时的 `updated_at` 时间，按用户确认可视为最后一个状态的变更时间 |
| 访谈基线 | 无历史数据时使用访谈估算基线：当前比原流程提效约 30% |
| 旧流程估算耗时 | `当前周期指标 / (1 - 30%)`，分别用于中位、P85、P95 |
| 提效百分比 | `(旧流程估算耗时 - 当前周期指标) / 旧流程估算耗时 * 100%` |
| 评估排除账号 | `zhaoyue` 是开发者账号，不参与报表和效能评估 |
| 周期指标 | 不展示平均周期；展示中位周期、P85 周期、P95 周期 |
| 阶段进度 | 基于 `harness_pm_status`、`harness_fe_status`、`harness_be_status`、`harness_qa_status`、`harness_archive_status` 分别统计未开始、进行中、已完成数量 |
| 各阶段明细 | 明细表展示全部参与评估的 Harness 需求及 PM、FE、BE、QA、归档 status；未归档需求的归档完成时间和归档周期显示为空 |
| 各阶段周期趋势 | 当前表缺少各阶段完成时间，趋势模块按需求当前阶段聚合，展示从 `created_at` 到 `updated_at` 的中位周期 |
| 布局收敛 | 效能页不展示顶部说明模块，趋势图使用父级 100% 宽度，不设置横向滚动宽度 |
| 阶段颜色 | 阶段进度分布使用 Tailwind 柔和红色表示开始、黄色表示进行、绿色表示结束 |
| 宽度约束 | 效能页根容器、内容网格、卡片使用 `max-w-full/min-w-0/overflow-hidden`，表格滚动限制在卡片内部 |
| 入口合并 | 侧边菜单只保留 `/reports`；根路径 `/` 默认进入 `/reports`；`ReportsPage` 内部分段控件默认选中效能看板，顺序为“效能看板 / 使用看板”；`/efficiency` 兼容重定向到 `/reports` |

## 数据模型

```ts
export type EfficiencyIssue = {
  id: number
  issueName: string
  createdUser?: string
  assignedUser?: string
  createdAt: string
  archivedAt: string
  cycleHours: number
}

export type EfficiencyData = {
  issues: EfficiencyIssue[]
  baselineImprovementRate: number
  baselineSource: string
}
```

## 变更清单

| 序号 | 文件路径 | 变更类型 | 说明 |
|------|----------|----------|------|
| 1 | `repos/app/src/services/report.ts` | 修改 | 增加效能数据获取函数，从 DirectUS 拉取归档需求明细 |
| 2 | `repos/app/src/pages/EfficiencyPage.tsx` | 新增 | 新增效能看板内容组件，展示 KPI、各阶段趋势、对比图和各阶段明细 |
| 3 | `repos/app/src/App.tsx` | 修改 | 移除独立效能菜单，根路径和兜底路由进入 `/reports`，`/efficiency` 重定向到 `/reports` |
| 4 | `repos/app/src/components/Topbar.tsx` | 修改 | 移除独立效能页标题识别 |
| 5 | `repos/app/src/pages/ReportsPage.tsx` | 修改 | 报表页内部切换效能看板和使用看板；默认展示效能看板，使用看板位于分段控件右侧；将当前图表折叠到使用分布模块，保留表格菜单 |
| 6 | `conventions/frontend-structure.md` | 修改 | 补充效能页命名规范 |
| 7 | `background/tech/mock-and-todos.md` | 修改 | 登记访谈基线和 `updated_at` 作为归档时间的临时口径 |

## 测试计划

- 运行 `npm run build` 验证 TypeScript 与 Vite 构建。
- 检查新增页面在无数据、加载失败、有数据三类状态下有明确展示。
- 检查统计服务已排除开发者账号 `zhaoyue`。
- 检查效能页不再展示平均周期，并新增 P85、P95 和阶段进度分布。
- 检查趋势和明细模块命名及内容已改为各阶段视角。
- 检查效能页顶部说明移除、趋势图不溢出、阶段进度分布紧凑展示。
- 检查右侧卡片可见、页面不左右溢出、阶段颜色语义正确。
- 检查各阶段需求明细使用全量 Harness 需求，周期 KPI 仍只使用归档完成需求。
- 检查侧边菜单只有报表入口，根路径进入 `/reports`，`/reports` 默认展示效能看板，且可切换到右侧使用看板。
