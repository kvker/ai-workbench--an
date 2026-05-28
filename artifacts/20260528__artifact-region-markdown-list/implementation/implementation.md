# 实现记录

## 流程等级

L1 快速修复。

## 变更

- 将产物区列表接口 `GET /api/task/:issueId/artifacts` 的扫描根目录固定为 `workspacePath/artifacts`。
- 将产物预览接口 `GET /api/task/:issueId/artifacts/preview` 的安全根目录同步调整为 `workspacePath/artifacts`，确保列表返回的任意 Markdown 文件都可预览。
- 保留既有过滤逻辑：只展示 `.md` 文件，跳过 `AGENTS.md` 和隐藏目录/文件。
- 将流程完成检查、原始需求上传、PM raw 分析和前端提示中的产物路径统一为 `workspacePath/artifacts` 下的阶段目录，不再拼接 `branchName`。

## 说明

产物目录从未要求按分支名分层；本次移除相关路径假设，统一使用 `artifacts/*`。
