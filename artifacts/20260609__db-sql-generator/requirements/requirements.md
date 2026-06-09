# DB SQL 生成器需求文档

## 背景与目标

在 AI 工作台中新增独立 DB 模块，用于基于 DB 背景物料生成 SQL。该模块沿用需求详情页的 Codex 对话体验，但会话和物料范围需要与需求详情页隔离。DB 物料不默认全部加载，需要用户选择 `background/db` 下一级扁平物料文件夹。

## 验收标准 (AC)

- [x] AC1: 侧边菜单提供独占 `DB` 入口。
- [x] AC2: `/db` 路由展示 SQL 生成器页面。
- [x] AC3: SQL 生成器对话区复用需求详情页同一个 `CodexConversationModule`。
- [x] AC4: DB 会话使用独立 `demandId`、`workspaceId` 和本地存储前缀，不混入需求详情页会话。
- [x] AC5: 页面列出 `background/db` 下一级扁平物料文件夹并支持勾选。
- [x] AC6: 默认不选中、不加载全部 DB 物料，未选择时不能生成 SQL。
- [x] AC7: 生成提示明确要求只读取已选 `background/db/*` 文件夹。
- [x] AC8: `background/db` 为空或不存在时不伪造数据，提示补充 DB 物料。

## 范围

### 包含

- 新增 DB 菜单和页面。
- 复用现有 Codex 对话 UI。
- 页面说明并选择 DB 物料范围。
- service 提供只读 DB 物料枚举接口。

### 不包含

- 不生成或维护 `background/db` 示例物料。
- 不修改 Codex app-server adapter 协议。

## 依赖

- 现有 Codex 会话接口。
- 现有 `CodexConversationModule`。

## 涉及模块

- 前端工作台侧边菜单。
- 前端 DB SQL 生成器页面。
- 前端 Codex 对话模块装配。
- service DB 物料只读枚举。

## 开放问题

- 无。
