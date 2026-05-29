# 实现记录

## 流程等级

- L2 偏轻：新增详情页用户可见能力，但方案边界清楚，限定在前端详情页流程区和 Codex 会话编排。

## 设计边界

- ReAct 判断、实现、验证由 Codex 会话中的 AI 完成。
- 前端只负责发起自动执行 prompt、解析结构化结果和推进流程状态。
- 不改动 service、不替换现有单节点“标准/跳过”逻辑。

## 代码变更

- 新增 `repos/app/src/pages/demand-detail/autoFlow.ts`：
  - 生成 ReAct 自动执行 prompt。
  - 解析最后一条 assistant 消息中的 `AUTO_FLOW_RESULT` JSON。
  - 归一化可推进的 harness 阶段。
- 更新 `repos/app/src/pages/DemandDetailPage.tsx`：
  - 新增独立的 `autoFlowRunState` 和自动流程会话 id 跟踪。
  - 自动流程完成后仅在 `result=pass` 时批量调用 `updateHarnessStatus(..., 2)`。
  - 保持现有单节点 gate prompt 完成逻辑不变。
- 更新 `repos/app/src/pages/demand-detail/WorkflowRegion.tsx`：
  - 在流程标题右侧新增 `AI 自动` 按钮。
  - 点击后先展示确认浮层，说明适用场景和运行时隔离规则，再由用户确认启动。
  - 按钮只触发新的自动流程入口，不改变每个流程节点的“标准/跳过”行为。

## 安全边界

- 自动流程 prompt 明确限制只允许 L0/L1 简单任务自动闭环。
- 涉及接口、权限、安全、数据库、部署配置、跨工程复杂改动、需求不清等情况，要求 AI 输出 `need-human` 或 `blocked`。
- AI 不直接推进需求系统状态；状态推进仍由前端解析结构化结果后调用现有接口。
- 自动流程与现有单节点流程互斥：
  - 自动流程运行时禁用单节点“开始/完成/标准/跳过”操作。
  - 单节点流程执行或状态更新中禁用 `AI 自动` 入口。
  - 处理函数内也做二次拦截，避免 UI 状态刷新前发生并发启动。
- 启动前必须已关联工程：
  - 详情页通过 `deployPlans.length > 0` 判断是否存在关联工程。
  - 未关联工程时入口显示 `请先关联工程`，启动函数也会拦截并提示。
- 入口和 ReAct prompt 均提示该能力更适合纯前端简单变更；非纯前端、涉及后端/API/数据/权限/部署配合时要求 AI 停止并输出人工介入结果。
- 需求入口收敛为两类：
  - issue 的名称和备注。
  - 当前需求工作区的 `background/raw/` 文件；目录可能不存在或为空。
- 如果上述入口都缺失或内容非常模糊，ReAct prompt 要求 AI 停止自动执行并输出 `need-human`，提示用户补充 title/备注或 `background/raw` 文件。
- 自动执行完成后必须提供用户自测方案：
  - 自测方案要求包含可访问 URL，优先使用局域网 IP 或用户浏览器可访问 IP。
  - 如果需要启动前端服务，要求写清楚目录、命令、端口和 URL。
  - 如果缺少环境变量或运行配置，要求列出变量名、用途和手动植入方式，不输出任何密钥值。
  - `AUTO_FLOW_RESULT` 增加 `selfTest` 字段，同时最终 assistant 消息必须用自然语言写出“自测方式”。
