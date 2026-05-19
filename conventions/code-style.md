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

## 注释与文档

- 文档保持简约清楚，优先记录代码事实、用户明确输入和待确认项。
- 复杂决策写进代码附近或文档，避免只留在对话里。
- 不用注释解释显而易见的赋值或框架样板。

来源：`projects/service/AGENTS.md`、根 `AGENTS.md` 行为约束。
