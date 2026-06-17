# 效能看板技术规格

## 流程等级

L2 标准开发。原因：新增用户可见菜单和报表页面，涉及前端路由、数据服务、指标口径和页面布局，但不修改后端接口、权限或持久化结构。

## 数据口径

| 指标 | 口径 |
|------|------|
| 当前归档耗时 | DirectUS `ops_issue` 中已进入 Harness 且归档状态等于 2 的需求，使用 `created_at` 时间到 `updated_at` 时间的间隔 |
| 归档时间 | issue 表归档状态等于 2 时的 `updated_at` 时间，按用户确认可视为最后一个状态的变更时间 |
| 历史基线 | 已移除访谈估算基线和提效百分比展示，当前页面仅展示 DirectUS 真实 Harness 需求统计 |
| 旧流程估算耗时 | 已移除旧流程估算对比，不再展示提效百分比 |
| 提效百分比 | 已移除 |
| 评估排除账号 | 不再特殊排除 `zhaoyue`，报表和效能统计使用全部 Harness 需求 |
| 周期指标 | 展示 P85 周期、P50 周期和平均周期；无真实周期样本时显示为空；所有周期统一使用“天”作为单位；复杂度卡片固定按 L、M、S、XS 顺序展示 |
| 阶段进度 | 基于 `harness_pm_status`、`harness_fe_status`、`harness_be_status`、`harness_qa_status`、`harness_archive_status` 分别统计未开始、进行中、已完成数量 |
| 各阶段明细 | 点击复杂度卡片内的阶段状态色块后，弹框展示对应复杂度、阶段和状态的需求明细；未归档需求的归档完成时间和归档周期显示为空 |
| 各阶段周期趋势 | 已移除独立趋势模块；当前表缺少各阶段完成时间，页面仅保留当前阶段状态分布 |
| 布局收敛 | 效能页不展示顶部说明模块，不展示趋势图和旧流程对比图，内容使用父级 100% 宽度 |
| 阶段颜色 | 阶段进度分布使用 Tailwind 柔和红色表示开始、黄色表示进行、绿色表示结束 |
| 宽度约束 | 效能页根容器、内容网格、卡片使用 `max-w-full/min-w-0/overflow-hidden`，表格滚动限制在卡片内部 |
| 入口合并 | 侧边菜单只保留 `/reports`；根路径 `/` 默认进入 `/reports`；`ReportsPage` 内部分段控件默认选中效能看板，顺序为“效能看板 / 使用看板”；`/efficiency` 兼容重定向到 `/reports` |

## 数据模型

```ts
export type EfficiencyIssue = {
  id: number
  issueName: string
  issueType?: IssueType
  complexity: 'L' | 'M' | 'S' | 'XS'
  createdUser?: string
  assignedUser?: string
  createdAt: string
  archivedAt?: string
  cycleHours?: number
  stages: Record<HarnessStatus, HarnessPhaseStatus>
}

export type EfficiencyComplexityCycle = {
  complexity: 'L' | 'M' | 'S' | 'XS'
  complexityName: string
  archivedCount: number
  medianHours: number
  p85Hours: number
  averageHours: number
}

export type EfficiencyData = {
  issues: EfficiencyIssue[]
  archivedIssues: EfficiencyIssue[]
  complexityCycles: EfficiencyComplexityCycle[]
  phaseProgress: EfficiencyPhaseProgress[]
  stageCycles: EfficiencyStageCycle[]
}
```

## 变更清单

| 序号 | 文件路径 | 变更类型 | 说明 |
|------|----------|----------|------|
| 1 | `repos/app/src/services/report.ts` | 修改 | 增加效能数据获取函数，从 DirectUS 拉取归档需求明细 |
| 2 | `repos/app/src/pages/EfficiencyPage.tsx` | 新增 | 新增效能看板内容组件，展示复杂度进度分布、P85/P50/平均周期和点击弹框明细 |
| 3 | `repos/app/src/App.tsx` | 修改 | 移除独立效能菜单，根路径和兜底路由进入 `/reports`，`/efficiency` 重定向到 `/reports` |
| 4 | `repos/app/src/components/Topbar.tsx` | 修改 | 移除独立效能页标题识别 |
| 5 | `repos/app/src/pages/ReportsPage.tsx` | 修改 | 报表页内部切换效能看板和使用看板；默认展示效能看板，使用看板位于分段控件右侧；将当前图表折叠到使用分布模块，保留表格菜单 |
| 6 | `conventions/frontend-structure.md` | 修改 | 补充效能页命名规范 |
| 7 | `background/tech/mock-and-todos.md` | 修改 | 登记效能看板真实数据统计口径和 `updated_at` 作为归档时间的当前口径 |

## 测试计划

- 运行 `npm run build` 验证 TypeScript 与 Vite 构建。
- 检查新增页面在无数据、加载失败、有数据三类状态下有明确展示。
- 检查统计服务不再特殊排除开发者账号 `zhaoyue`。
- 检查效能页展示 P85、P50、平均值和阶段进度分布。
- 检查独立趋势图和旧流程对比图已移除，复杂度卡片内阶段进度分布紧凑展示。
- 检查效能页顶部说明移除，内容不溢出父级。
- 检查右侧卡片可见、页面不左右溢出、阶段颜色语义正确。
- 检查各阶段需求明细使用全量 Harness 需求，周期 KPI 仍只使用归档完成需求。
- 检查侧边菜单只有报表入口，根路径进入 `/reports`，`/reports` 默认展示效能看板，且可切换到右侧使用看板。
