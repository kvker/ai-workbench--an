# 测试记录

## 结果

| 命令 | 结果 | 说明 |
|------|------|------|
| `npm run build` in `repos/app` | 通过 | TypeScript 与 Vite 构建成功；Vite 有 chunk size 警告，非本次新增问题。 |
| `node --check src/routes/task.js && node --check src/services/knowledgeSyncService.js` in `repos/service` | 通过 | 服务端变更文件语法检查通过。 |
| `npm run lint` in `repos/app` | 未通过 | 失败在 `src/pages/DemandBoardPage.tsx:47` 的 `react-hooks/set-state-in-effect` 规则，非本次改动文件。 |
| `node --check src/services/knowledgeSyncService.js` in `repos/service` | 通过 | Harness agents 归一化同步变更语法检查通过。 |
| 临时目录脚本调用 `replaceHarnessAgentFiles` | 通过 | 验证 `frontend/fe`、`backend/be`、`product/pm`、`test/qa` 与 `shared` 均写入预期的 `agents/*.md` 或 `agents/shared/*.md`，且优先使用映射中的第一个存在源。 |
| 临时 git Harness + 已有三类知识文件 workspace 调用 `syncKnowledgeForIdentity({ force: false })` | 通过 | 复现并修复页面初始化路径：当 `background/conventions/.codex/skills` 已存在但 `agents/` 缺失时，不再提前 `skipped`，会同步生成 `agents/pm.md`。 |
| 临时 Harness 无 agents 源文件时调用 `syncKnowledgeForIdentity({ force: false })` | 通过 | 验证源 agents 不存在时仍可按已有知识文件跳过，符合“源目录或文件不存在则跳过”。 |
