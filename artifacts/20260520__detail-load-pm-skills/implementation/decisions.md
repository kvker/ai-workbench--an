# 实现记录

## 流程等级

- 采用 L1 快速修复。
- 原因：用户选择“快速修复”，需求边界明确，主要影响 service 详情页加载链路和少量流程序号字段。

## 实现决策

- 详情页 `GET /api/task/:demandId` 在确保需求工作区后，按当前流程序号判断是否同步 PM skills。
- 当前流程序号优先读取流程节点的 `sequence`、`order`、`index` 或 `stepIndex` 数字字段；旧数据没有序号时使用数组下标兜底。
- 序号小于 3 时，将 `$KNOWLEDGE_ROOT_DIR/$PM_SKILLS_DIR/{PM_SKILLS}` 中配置的 skill 目录覆盖复制到 `{workspacePath}/.codex/skills/`。
- `PM_SKILLS_DIR` 默认为 `skills/pm`；该配置必须是 `KNOWLEDGE_ROOT_DIR` 下的相对目录，非法值会回退到默认值。
- `KNOWLEDGE_ROOT_DIR` 按 service 工程根目录解析；绝对路径直接使用，相对路径以 `projects/service` 为基准。
- skills 同步失败不再阻断详情页请求，返回 `skillSync.status` 为 `skipped` 或 `partial`，并包含缺失或失败信息。
- 新建需求默认流程节点补充 `sequence: 0..3`，前端类型同步允许该字段。

## 需求澄清

- 原始输入中描述 PM skills 位于 `$KNOWLEDGE_ROOT_DIR/pm/`。
- 后续澄清新增环境变量 `PM_SKILLS_DIR=skills/pm`，并明确真实目录结构为 `qingtian-harness/skills/pm/{skill}`。
- 最终实现以 `$KNOWLEDGE_ROOT_DIR/$PM_SKILLS_DIR/{skill}` 为准，不再依赖硬编码的 `pm` 或 `skills/pm` 业务路径。

## 边界修正

- 详情页主请求不能因为 PM skills 缺失而 500；同步异常会返回 `skillSync.status = skipped | partial` 和原因。
- `KNOWLEDGE_ROOT_DIR` 相对路径按 service 工程根目录解析。例如 `../../../qingtian-harness` 解析为 `/Users/zweizhao/project/current/qingtian-harness`。
- 响应中返回 `sourceRoot`、`sourceRootCandidates`、`targetRoot`、`missing` 和 `failed`，方便核对拷贝来源与目标。
