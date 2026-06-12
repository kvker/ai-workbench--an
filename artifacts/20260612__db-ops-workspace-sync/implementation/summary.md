# DB ops 工作区同步实现摘要

## 代码变更

- `repos/service/src/services/dbMaterialsService.js`
  - DB 物料枚举目录调整为 Harness `background/ops/db`。
  - `listDbMaterials()` 返回当前用户 DB 工作区路径和已存在的物料文件夹 ID。
  - 新增 `syncDbWorkspace()`，按用户清洗后的目录名同步已选物料到根工作区 `workspaces-ops-db/{user}/`。
  - 同步策略为先清空用户 DB 工作区，再复制当前已选物料目录，避免取消勾选后保留旧物料。
- `repos/service/src/routes/db.js`
  - 新增 `POST /api/db/workspace/sync`。
- `repos/service/src/services/workspaceService.js`
  - 导出 `sanitizeWorkspaceUserId()`，供 DB 工作区复用同一用户名清洗规则。
- `repos/app/src/services/db.ts`
  - 新增 `syncWorkspace(materialIds)` 服务方法。
- `repos/app/src/pages/DbPage.tsx`
  - 移除“生成 SQL”按钮和自动 prompt 逻辑。
  - 页面进入、刷新物料、勾选变化时同步当前已选 DB 物料。
  - 页面进入或刷新时根据 `workspaceMaterialIds` 反向恢复勾选。
  - 勾选变化使用 3 秒防抖，避免连续勾选时频繁复制工作区。
  - 展示同步目标目录和同步异常提示。
  - 将同步后的 `workspacePath` 传给 `CodexConversationModule`，让 DB 对话会话以当前用户 DB 工作区作为 cwd。
- `.gitignore`
  - 忽略运行产物目录 `workspaces-ops-db`。

## 决策

- DB 工作区目录固定在 AI Native 根工作区下，与现有 `workspaces/` 同级，而不是依赖 service 启动目录。
- 用户目录名复用需求工作区已有的 `x-workspace-user` 清洗逻辑。
- 同步目标目录整体替换为当前选择集合，保证刷新和取消勾选后的文件状态可预期。
- DB Codex 会话的 `workspaceId` 加入 `workspacePath`，避免复用旧的默认 DB 会话池导致 cwd 仍指向默认工作区。
