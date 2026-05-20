# 实现记录

## 流程判断

- 等级：L1 快速修复。
- 原因：用户明确要求直接修改；改动集中在 `projects/app` 样式与主题，不涉及接口、数据结构、权限、部署或 service 行为。

## 初步问题定位

- 全局 Shell、登录页和品牌标识使用高饱和 cyan/blue/emerald 渐变，和产研工作台的密集操作界面气质不匹配。
- Ant Design token 的 `colorPrimary` 使用 `#22d3ee`，按钮、Badge、Steps 等控件呈现偏荧光的青色。
- `toneClasses` 只有深色模式配色，`Pill` 在浅色页面也使用深色背景，导致标签视觉突兀。
- 页面同时混用 Tailwind 原型半透明背景、AntD 默认控件和局部硬编码色，缺少统一色板。

## 实现策略

- 收敛为专业工作台配色：浅色模式采用中性灰白底，主色使用靛蓝，状态色降低饱和度。
- 统一 Ant Design token，让控件、边框、背景和主按钮跟页面色板一致。
- 将标签和用户消息等状态色改为支持明暗模式的函数，避免浅色页套用深色胶囊。
- 保持页面结构和功能不变，只调整视觉层级、背景、边框、阴影和 hover 状态。

## 变更范围

- `AppThemeProvider`：调整 Ant Design 主题 token，主色从荧光青收敛为靛蓝，并补齐边框、填充和控件选中态。
- `themeClasses` / `toneClasses`：建立浅色与深色两套通用面板、状态标签和消息色。
- `Topbar` / `LoginPage` / `DemandBoardPage` / `DemandDetailPage` / `CodexConversationModule`：移除原型期高饱和渐变和透明背景，统一工作台层级。
- `Pill` / `Avatar` / `Button`：接入统一色板，避免浅色模式出现深色标签。
