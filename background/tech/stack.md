# 技术栈

## app

| 技术 | 版本 | 用途 |
|------|------|------|
| React | ^19.2.6 | 前端 UI |
| React DOM | ^19.2.6 | React 浏览器渲染 |
| TypeScript | ~6.0.2 | 前端类型系统与构建检查 |
| Vite | ^8.0.12 | 前端开发服务器与构建 |
| @vitejs/plugin-react | ^6.0.1 | Vite React 插件 |
| ESLint | ^10.3.0 | 代码检查 |
| npm | package-lock.json | 包管理 |

来源：`projects/app/package.json`、`projects/app/package-lock.json`。

## service

| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | 待确认 | 服务端运行环境 |
| Express | ^5.2.1 | HTTP 服务 |
| CommonJS | 待确认 | 模块格式 |
| npm | package-lock.json | 包管理 |

来源：`projects/service/package.json`、`projects/service/app.js`、`projects/service/package-lock.json`。

## 工具链

| 工具 | 用途 |
|------|------|
| npm run dev | `projects/app` 前端开发服务 |
| npm run build | `projects/app` 前端构建 |
| npm run lint | `projects/app` 代码检查 |
| npm run preview | `projects/app` 构建产物预览 |
| node app.js | `projects/service` 当前服务启动方式 |

来源：`projects/app/package.json`、`projects/service/AGENTS.md`、`.agents/recipes.json`。

## 命令覆盖情况

- `projects/app`：已识别 `build` 和 `lint`；测试、独立类型检查、代码生成命令缺失。
- `projects/service`：未识别到 npm scripts；测试、构建、代码检查、类型检查、代码生成命令缺失。

来源：`.agents/recipes.json`。
