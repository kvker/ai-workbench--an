# 实现记录

## 流程等级

- 采用 L1 快速修复。
- 原因：用户选择“快速修复”，规则明确，主要调整详情页知识物料同步规则。

## 实现决策

- 详情页工作区准备时默认按 `pm` 身份同步知识物料。
- 身份切换接口继续按用户选择的身份同步。
- `skills` 和 `conventions` 按职能目录加载，并兼容身份别名：
  - `fe` / `frontend` -> `frontend`
  - `be` / `backend` -> `backend`
  - `qa` / `test` / `quality` -> `qa`
  - `pm` / `product` / `pa` -> `pm`
- 工作台内部和目标工作区身份统一为 `fe` / `be` / `pm` / `qa`；源知识库目录继续兼容历史乱名。
- `skills` 同步时额外合并 `skills/shared`。
- `conventions` 同步时额外合并 `conventions/shared`；当前知识库中部分职能没有 conventions 目录，缺省时保持目标目录为空，不标记为失败。
- `background` 全量覆盖复制到工作区 `background/`。
- 为降低重复职责，详情页初始化不再调用单独的 PM skills 同步模块，改为复用 `knowledgeSyncService`。
- 身份切换接口准备工作区时跳过默认 `pm` 同步，只同步用户选择的目标身份，避免重复覆盖。
- 前端详情页初始化工作区时会读取该需求本地保存的身份，并通过 `identity` query 传给 service；没有保存身份时默认 `pm`。
- 删除未使用的 PM-only `skillSyncService`，避免后续出现两套详情页知识加载规则。
- 同步前使用 `git fetch origin main` 刷新知识库远端信息，不修改 `qingtian-harness` 当前工作树或分支，避免本机分支状态影响详情页加载。
- 合并 `skills` 和 `agents` 时先复制 shared，再复制角色目录，确保同名文件由当前角色覆盖 shared。
- 2026-05-21 撤回 Harness Markdown agents 同步：Codex `.codex/agents/` 需要 toml agent 定义，不能直接使用 Harness 的 `agents/**/AGENTS.md`。当前只同步 `background`、`conventions`、`.codex/skills`。
- 2026-05-21 修正 `background` 同步的目录已存在错误：`replaceDirectory` 不再依赖 `fs.cp(sourceDir, targetDir)` 创建目标目录，改为先确保目标目录存在，再复用目录内容复制逻辑逐项覆盖，避免 `EEXIST: file already exists, mkdir .../background` 阻断工作区准备。
- 2026-05-21 增加 workspace 级知识同步锁：同一 `workspacePath` 的 `syncKnowledgeForIdentity` 会串行执行，避免 React 快速触发两次详情页初始化或身份同步时，并发删除/复制 `background`、`conventions`、`.codex` 子目录导致 `EEXIST`。
