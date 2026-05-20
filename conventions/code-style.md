# 代码风格规范

## 覆盖路径

```json
[
  "projects/**/*.{ts,tsx,js,jsx}",
  "projects/**/*.{css,json,md}"
]
```

## 命名规范

- `projects/app` 使用 React 组件命名方式：组件文件和组件名采用 PascalCase，例如 `App.tsx`、`App`。
- `projects/app` 当前状态变量使用 camelCase，例如 `count`、`setCount`。
- `projects/service` 当前变量使用 camelCase，例如 `app`、`port`。
- 业务类型和枚举命名应贴近领域语义，例如 `Demand`、`WorkflowNode`、`DemandDetail`。

来源：`projects/app/src/App.tsx`、`projects/service/app.js`、`projects/app/AGENTS.md`。

## 文件组织

- `projects/app` 优先沿用 Vite + React + CSS 文件结构。
- `projects/app` 静态资源放在 `public/` 或 `src/assets/`，入口保持在 `src/main.tsx`。
- `projects/service` 保持 CommonJS / Node / Express 的现有风格，除非项目明确迁移。
- `projects/service` 后续可按真实能力拆分为 `routes/`、`services/`、`repositories/`、`workspace/`、`codex/`、`vscode/`，不要提前创建空模块。

来源：`projects/app/AGENTS.md`、`projects/service/AGENTS.md`、目录扫描。

## 前端组件与样式

- `projects/app` 前端交互组件必须优先使用 antd，例如按钮、输入框、表单、弹窗、分段控制、开关、步骤条、标签、加载态和消息提示。
- Tailwind CSS 仅作为辅助样式工具，主要用于布局、间距、尺寸、响应式、文本裁剪等轻量 class，不作为替代 antd 组件体系的基础 UI 实现。
- 需要项目语义化封装时，可以在 `projects/app/src/components/` 包装 antd 组件，但封装内部仍应沿用 antd 的交互、状态和可访问性能力。
- 颜色、暗色模式和组件主题优先通过 `ConfigProvider`、主题 token 或既有样式 helper 统一处理，避免在页面中散落大段一次性视觉样式。

来源：用户指令、`projects/app/package.json`、`projects/app/src/providers/AppThemeProvider.tsx`、`projects/app/src/pages/DemandBoardPage.tsx`、`projects/app/src/pages/DemandDetailPage.tsx`、`projects/app/src/components/`。

## 注释与文档

- 文档保持简约清楚，优先记录代码事实、用户明确输入和待确认项。
- 复杂决策写进代码附近或文档，避免只留在对话里。
- 不用注释解释显而易见的赋值或框架样板。

来源：`projects/service/AGENTS.md`、根 `AGENTS.md` 行为约束。

## 更新记录

| 日期 | 更新内容 | 触发来源 |
|------|---------|---------|
| 2026-05-20 | 补充前端组件必须优先使用 antd，Tailwind CSS 仅辅助布局、间距等轻量样式的约束。 | an-refresh / 用户指令 |
