# 实现记录

## 变更摘要

- 在 `projects/app` 添加 Tailwind CSS 相关依赖。
- 在 `vite.config.ts` 接入 `@tailwindcss/vite`。
- 在 `src/index.css` 引入 Tailwind，并通过 `@source "./**/*.{ts,tsx}"` 显式声明扫描源文件。
- 将 Vite 默认页面替换为 AI 工作台原型，包含：
  - 需求看板
  - 需求详情页
  - 代码页 / vscode-server 风格视图

## 实现决策

- 采用单页内状态切换实现三屏原型，避免在快速原型阶段引入路由依赖。
- 保持静态 mock 数据，不实现真实后端、Git、vscode-server 或 Codex 内核。
- 参考目录中的视觉结构和信息架构，但用 React 组件与 Tailwind utility classes 重写。
- Tailwind v4 自动扫描在当前嵌套工程中未生成 utilities，因此使用 `@source` 显式指定 `src` 下的 TSX 文件。

## 结构修正

- 根据用户补充约定，将前端拆为 `pages/`、`components/`、`services/`、`utils/`。
- `pages/` 放 URL 对应页面：需求页、需求详情页、代码页。
- `components/` 放可复用 UI 组件，如顶部栏、按钮、标签、头像等。
- `services/` 当前放 mock 数据，作为未来 HTTP 请求或远程服务接入边界。
- `utils/` 放与业务无关的纯工具配置，例如 tone 到 CSS class 的映射。
- 引入 `react-router-dom`，将页面切换改为 URL 路由驱动：
  - `/demands`
  - `/demands/customer-feedback-console`
  - `/demands/customer-feedback-console/code`

## Ant Design 接入

- 保留 Tailwind CSS，并接入 Ant Design。
- 根据 Ant Design 官方兼容建议，在 `src/index.css` 中声明 `@layer theme, base, antd, components, utilities`。
- 在 `src/main.tsx` 中使用 `StyleProvider layer`，让 antd 样式进入独立 layer，避免和 Tailwind utilities 优先级混乱。
- 使用 `ConfigProvider` 配置 antd 暗色主题和主色。
- 当前替换为 antd 的组件包括：
  - `Button`
  - `Tag`
  - `Input`
  - `Badge`
  - `Steps`
  - `Modal`
  - `Segmented`
  - `FloatButton`
- 按用户要求移除内置代码页路由与页面实现，“打开代码页”入口改为 `target="_blank"` 外链到 `https://www.baidu.com/`。

## 主题切换

- 新增 `providers/AppThemeProvider.tsx` 和 `providers/themeContext.ts`。
- 使用 antd `theme.darkAlgorithm` 与 `theme.defaultAlgorithm` 切换暗色/亮色主题。
- 首页右上角新增 antd `Switch`，通过 `setMode` 一键切换主题。
- 外层 Tailwind 背景、边框和文字颜色会随 `isDark` 同步切换，避免 antd 变亮但页面外壳仍为暗色。
- 默认主题调整为亮色。
- 移除右上角“需求页”“详情页”导航按钮，仅保留主题开关以及当前页面相关操作。
- 根据 antd MCP 复核结果，`Switch`、`Segmented`、`Steps`、`Modal`、`Button` 的使用符合对应场景；继续清理了亮色模式下残留的深色 Tailwind 容器样式。
