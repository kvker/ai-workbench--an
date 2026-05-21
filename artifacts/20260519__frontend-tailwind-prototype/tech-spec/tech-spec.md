# 前端 Tailwind 原型技术规范

## 范围

- 在 `repos/app` 中添加 Tailwind CSS。
- 参考 `harness-workbench-prototype` 中的需求页、详情页、代码页，快速实现 React 原型。
- 保持前端为静态 mock 原型，不实现真实后端、真实 Git、真实 vscode-server 或 Codex 内核。

## 变更清单

| 序号 | 文件路径 | 变更类型 | 说明 |
|------|----------|----------|------|
| 1 | repos/app/package.json | 修改 | 添加 Tailwind 相关依赖 |
| 2 | repos/app/package-lock.json | 修改 | 锁定 Tailwind 相关依赖 |
| 3 | repos/app/vite.config.ts | 修改 | 接入 Tailwind Vite 插件 |
| 4 | repos/app/src/index.css | 修改 | 引入 Tailwind 并设置全局基础样式 |
| 5 | repos/app/src/App.css | 修改 | 移除 Vite 模板样式 |
| 6 | repos/app/src/App.tsx | 修改 | 实现需求页、详情页、代码页原型切换 |

## 测试计划

- 执行 `npm run build`。
- 执行 `npm run lint`。
- 启动 `npm run dev`，用浏览器检查桌面与移动视口。
