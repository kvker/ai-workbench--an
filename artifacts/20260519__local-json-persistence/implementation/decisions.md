# 实现记录

## 流程等级

L2 加速执行。原因：涉及前后端联调与服务端本地持久化接口，但用户明确要求面向原型快速推进。

## 决策

- 前端不直接写本地文件，仍通过 `services/http.ts` 访问服务端。
- Express service 使用本地 `data/workbench.json` 保存原型过程数据。
- 前端服务层保持 `workspace.ts` / `task.ts` 语义入口，后续接真实后端主要替换 `http.ts` 或服务内部实现。
- service 监听 `3100`，避免与 Vite 前端开发端口冲突。

## 变更摘要

- `repos/service` 新增本地 JSON store，数据文件为 `data/workbench.json`。
- `repos/service` 新增 `/api/workspace` 和 `/api/task` 路由。
- `repos/service` 支持追加消息与更新流程节点，写回本地 JSON。
- `repos/app/src/services/http.ts` 改为真实 fetch 请求，默认请求 `http://localhost:3100/api`。
- `repos/app/src/services/workspace.ts` 和 `task.ts` 改为 HTTP 服务调用，保留 mock fallback。
- 前端页面新增轻量 loading/error 提示，service 不可用时继续使用内置 mock。
