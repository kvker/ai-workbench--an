# 实现记录

## 流程等级

L1 快速修复。用户选择“快速修复”，目标集中在 Harness Markdown agents 到 Codex TOML agents 的转换。

## 变更

- `repos/service/src/services/knowledgeSyncService.js`
  - 工作区 agents 目标目录从根 `agents/` 改为 `.codex/agents/`。
  - 新增递归扫描 `KNOWLEDGE_ROOT_DIR/agents/**/AGENTS.md`。
  - 跳过 `agents/AGENTS.md` 根索引，只把子目录中的 `AGENTS.md` 当作代理定义。
  - 将相对目录转换为 agent 名称：如 `qa/testcase` -> `qa-testcase`。
  - 生成 Codex 子代理 TOML：
    - `name = "qa-testcase"`
    - `description = "qa-testcase"`
    - `developer_instructions = """...原 AGENTS.md 内容..."""`
  - 初始化跳过判断改为检查 `.codex/agents/`，避免旧根 `agents/*.md` 误判。

## 决策

- Codex 文档示例使用 `name`、`description`、`developer_instructions` 字段；本轮只生成这三个最小字段，不写模型、权限或 MCP 配置。
- 目录名按用户示例使用连字符拼接，文件名与 `name` 保持一致，例如 `.codex/agents/qa-testcase.toml`。
- 保留原 `replaceHarnessAgentFiles` 函数名，降低调用面改动。
- 根据子代理 review 结果，仅清理 P3 维护风险：删除旧 Markdown agents 映射常量、旧角色解析函数、旧单文件查找函数和导出项；暂不处理 `syncKnowledgeMaterials` agents 同步与名称冲突检测。
