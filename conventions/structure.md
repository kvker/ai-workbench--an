# 目录结构规范

## repos/ 目录结构

```text
repos/
├── app/
│   ├── AGENTS.md
│   ├── README.md
│   ├── eslint.config.js
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── public/
│   │   ├── favicon.svg
│   │   └── icons.svg
│   ├── src/
│   │   ├── App.css
│   │   ├── App.tsx
│   │   ├── assets/
│   │   ├── index.css
│   │   └── main.tsx
│   ├── tsconfig.app.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
└── service/
    ├── AGENTS.md
    ├── README.md
    ├── app.js
    ├── package-lock.json
    └── package.json
```

来源：`repos/` 目录扫描，已排除 `node_modules`。

## 工程说明

| 目录 | 工程 | 职责 |
|------|------|------|
| repos/app | app | AI 工作台的 Web 用户操作端 |
| repos/service | service | 承担 Linux 原生功能服务的服务端 |

来源：`repos/app/AGENTS.md`、`repos/service/AGENTS.md`、用户在 `/an-init` 中明确输入。

## 结构约定

- `repos/` 下每个一级子目录视为一个独立工程。
- `repos/app` 当前沿用 Vite + React 的扁平入口结构，主要代码在 `src/`。
- `repos/service` 当前只有 `app.js`，后续按真实职责自然拆分，不为空目录完整性提前创建模块。
- 多工程路径约束使用 `repos/**` 覆盖。
