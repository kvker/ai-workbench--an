# DB SQL 生成器技术规格

## 目标

- 新增独立菜单 `DB`。
- 新增 DB SQL 生成器页面。
- 复用需求详情页右侧 Codex 对话 UI。
- DB 模块物料范围限定为用户选择的 `background/db/*` 下一级扁平物料文件夹。

## 方案

- 前端新增 `DbPage`，布局复用详情页双栏风格。
- 右侧直接装配 `CodexConversationModule`，保持对话、历史会话、上传、编辑分叉、归档等 UI 一致。
- service 新增只读接口 `/api/db/materials`，列出 `background/db` 下一级文件夹。
- 前端加载 DB 物料后默认不选中任何项，用户勾选后才能生成 SQL。
- DB 会话使用固定归属：
  - `demandId`: `db-sql-generator`
  - `workspaceId`: `db-sql-generator`
  - `workspacePath`: 当前 AI Native 根工作区
- 页面提供首轮生成提示按钮，提示 Codex 只读取已选 `background/db/*` 文件夹并产出 SQL。
- `background/db` 当前可能不存在，页面保留目录约定和空状态提示，不新增 mock 数据。

## 验收标准

- [x] 侧边菜单出现独占 `DB` 项。
- [x] 访问 `/db` 能打开 SQL 生成器页面。
- [x] 对话区域 UI 与需求详情页一致，使用同一个 `CodexConversationModule`。
- [x] 会话与需求详情页隔离，不复用需求 id。
- [x] 生成提示明确限制物料范围为用户已选 `background/db/*` 文件夹。
- [x] 默认不加载全部 DB 物料，未选择物料时不能生成。
