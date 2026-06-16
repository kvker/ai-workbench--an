# 效能看板实现摘要

## 已实现

| 项 | 说明 |
|----|------|
| 报表入口 | 侧边菜单保留统一“报表”入口，根路径 `/` 默认进入 `/reports` |
| 新增页面 | `repos/app/src/pages/EfficiencyPage.tsx` 展示复杂度进度分布，并通过点击状态色块弹框查看各阶段需求明细 |
| 数据服务 | `repos/app/src/services/report.ts` 新增 `getEfficiencyData()`，从 DirectUS `ops_issue` 拉取已归档 Harness 需求 |
| 阶段进度 | `repos/app/src/services/report.ts` 新增阶段 status 聚合，`EfficiencyPage` 展示 PM、FE、BE、QA、归档的未开始、进行中、已完成分布 |
| 评估范围 | `repos/app/src/services/report.ts` 不再排除开发者账号 `zhaoyue`，报表和效能统计使用全部 Harness 需求 |
| 布局优化 | `EfficiencyPage` 移除顶部说明模块，趋势图使用父级宽度，阶段进度分布改为紧凑红黄绿堆叠条，并限制页面横向溢出 |
| 明细数据源修正 | `repos/app/src/services/report.ts` 将各阶段需求明细改为全量 Harness 需求，周期 KPI 继续使用归档完成需求 |
| 复杂度统计 | `repos/app/src/services/report.ts` 不再基于 `ops_issue.issue_type` 映射 L/M/S/XS，改为按乘以 3 后的实际周期结果分组 |
| 复杂度进度合并 | `EfficiencyPage` 将复杂度周期分布和阶段进度分布合并为一个模块，在 L、M、S、XS 四个维度内展示 PM、FE、BE、QA、归档状态条 |
| 明细弹框 | `EfficiencyPage` 移除独立各阶段需求明细表，点击复杂度卡片内的阶段状态色块后，按复杂度、阶段和状态筛选需求并弹框展示 |
| 模块删减 | `EfficiencyPage` 移除各阶段周期趋势和当前与旧流程估算对比；`ReportsPage` 移除报表标题下的统计范围说明 |
| 入口合并 | `repos/app/src/App.tsx` 移除独立效能菜单，`ReportsPage` 内部分段切换效能看板和使用看板 |
| 报表页优化 | `repos/app/src/pages/ReportsPage.tsx` 将现有两张使用分布图表折叠为“使用分布图表”模块，保留“用户明细”表格菜单 |
| 文档同步 | 更新前端命名规范，并在 mock-and-todos 登记 7/3/1 天分组、乘以 3 和 `updated_at` 归档时间口径 |

## 关键口径

- 当前归档周期：仅统计 `harness_archive_status = 2` 的需求，使用 `created_at` 到 `updated_at` 的时间差。
- 开发者账号 `zhaoyue` 不再特殊排除，参与报表与效能统计。
- 周期指标改用 P85、P50、平均值表达周期分布。
- 阶段维度基于当前 status 展示进度分布；由于没有阶段流转历史，本次不计算各阶段耗时。
- 阶段进度分布总需求数统一放在模块标题右侧，行内只保留阶段名和紧凑状态条。
- 阶段颜色语义调整为红色未开始、黄色进行中、绿色已完成；颜色使用 Tailwind 柔和色值。
- 复杂度口径不再来自 `issue_type`；按乘以 3 后的实际周期结果分为 L、M、S、XS：L 为 7 天以上，M 为 3 天以上，S 为 1 天以上，XS 为 1 天以内。
- 复杂度周期分布按已归档 Harness 需求分别计算 P85、P50、平均值，最终展示值统一乘以 3，若结果为 0 则按 1 小时展示；页面按 P85 从高到低排序并优先展示 P85。
- 复杂度卡片不再展示 `↑xx%` 提效标识、访谈来源 hover 提示和“归档 N 个”副文案。
- 复杂度进度分布按全量 Harness 需求聚合，每个复杂度卡片内展示 PM、FE、BE、QA、归档的未开始、进行中、已完成分布；卡片顶部仅显示该复杂度全量需求数。
- 各阶段需求明细不再作为独立页面模块展示；点击复杂度进度分布中的单个状态色块后弹框展示对应需求列表。
- 各阶段需求明细不再只显示归档完成需求；未归档需求的归档时间和周期显示为 `-`。
- 中位归档周期改为真正 P50：偶数样本取中间两条平均；开发环境会在控制台打印参与周期计算的明细数据。
- `/efficiency` 作为兼容路由重定向到 `/reports`，不再作为侧边菜单入口。
- `/reports` 默认展示效能看板，分段控件顺序为“效能看板 / 使用看板”，使用看板位于右侧。
- 根路径 `/` 和未知路由兜底进入 `/reports`。
- 页面不再展示各阶段周期趋势、当前与旧流程估算对比，以及报表标题下的统计范围说明。
