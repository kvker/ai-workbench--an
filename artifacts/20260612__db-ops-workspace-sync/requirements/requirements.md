# DB ops 工作区同步需求文档

## 背景与目标

DB 菜单需要以 Harness `background/ops/db` 为物料来源。用户进入或刷新 DB 页面时，需要按当前用户准备本地 DB 工作区；用户勾选物料后，本地工作区应只包含当前勾选的物料文件夹。

## 验收标准 (AC)

- [x] AC1: DB 物料列表扫描 Harness `background/ops/db` 下一级文件夹。
- [x] AC2: 用户进入 DB 页面或刷新物料时，会创建当前用户对应的 `workspaces-ops-db/{user}/` 目录。
- [x] AC3: 勾选 DB 物料后，已选文件夹会从 Harness `background/ops/db` 复制到当前用户目录。
- [x] AC4: 取消勾选或刷新后，当前用户目录不会保留未勾选的旧物料。
- [x] AC5: 目标目录 `workspaces-ops-db` 作为运行产物被 Git 忽略。
- [x] AC6: “生成 SQL”按钮和自动生成 prompt 入口已移除。
- [x] AC7: DB 右侧 Codex 对话区使用当前用户 `workspaces-ops-db/{user}/` 作为会话工作目录，能读取勾选后同步的新物料。
- [x] AC8: 勾选变化触发的 DB 工作区同步使用 3 秒防抖，只同步最后一次选择。
- [x] AC9: 刷新页面后，根据当前用户 `workspaces-ops-db/{user}/` 目录下已有物料文件夹反向恢复勾选状态。

## 范围

### 包含

- DB 菜单物料枚举与同步。
- DB 页面进入、刷新、勾选变化触发同步。
- 当前用户目录创建与物料复制。

### 不包含

- 修改 Codex 会话协议。
- 自动启动或操作本地常驻服务。
- 生成 SQL 的业务 prompt。

## 涉及模块

- 前端 DB 页面。
- 前端 DB service。
- 后端 DB route。
- 后端 DB materials service。

## 开放问题

无。
