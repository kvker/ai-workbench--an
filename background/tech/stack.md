# 技术栈

## app

| 技术 | 版本 | 用途 |
|------|------|------|
| React | ^19.2.6 | 前端 UI |
| React DOM | ^19.2.6 | React 浏览器渲染 |
| antd | ^6.4.3 | 前端基础组件库 |
| @ant-design/icons | ^6.2.3 | 前端图标组件 |
| Tailwind CSS | ^4.3.0 | 辅助布局、间距和局部样式工具类 |
| @tailwindcss/vite | ^4.3.0 | Vite Tailwind CSS 插件 |
| react-router-dom | ^7.15.1 | 前端路由 |
| TypeScript | ~6.0.2 | 前端类型系统与构建检查 |
| Vite | ^8.0.12 | 前端开发服务器与构建 |
| @vitejs/plugin-react | ^6.0.1 | Vite React 插件 |
| ESLint | ^10.3.0 | 代码检查 |
| npm | package-lock.json | 包管理 |

来源：`repos/app/package.json`、`repos/app/package-lock.json`。

## service

| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | 待确认 | 服务端运行环境 |
| Express | ^5.2.1 | HTTP 服务 |
| CommonJS | 待确认 | 模块格式 |
| npm | package-lock.json | 包管理 |

来源：`repos/service/package.json`、`repos/service/app.js`、`repos/service/package-lock.json`。

## 工具链

| 工具 | 用途 |
|------|------|
| npm run dev | `repos/app` 前端开发服务 |
| npm run build | `repos/app` 前端构建 |
| npm run lint | `repos/app` 代码检查 |
| npm run preview | `repos/app` 构建产物预览 |
| node app.js | `repos/service` 当前服务启动方式 |

来源：`repos/app/package.json`、`repos/service/AGENTS.md`、`.agents/recipes.json`。

## 命令覆盖情况

- `repos/app`：已识别 `build` 和 `lint`；测试、独立类型检查、代码生成命令缺失。
- `repos/service`：未识别到 npm scripts；测试、构建、代码检查、类型检查、代码生成命令缺失。

来源：`.agents/recipes.json`。

## 更新记录

| 日期 | 更新内容 | 触发来源 |
|------|---------|---------|
| 2026-05-20 | 补充 app 已接入的 antd、@ant-design/icons、Tailwind CSS、@tailwindcss/vite 和 react-router-dom 依赖。 | an-refresh / 用户指令 |
