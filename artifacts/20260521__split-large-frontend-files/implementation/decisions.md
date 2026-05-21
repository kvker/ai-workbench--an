# 实现记录

## 流程等级

- 采用 L1 快速修复。
- 原因：用户选择快速修复，目标是前端文件拆分，保持行为不变。

## 实现决策

- 对 `CodexConversationModule.tsx` 做搬家式拆分：
  - 事件转换、活动状态、会话 localStorage 等纯逻辑迁到 `codexConversationUtils.ts`。
  - 消息列表相关展示组件迁到 `CodexConversationMessages.tsx`。
  - 会话列表区域迁到 `CodexSessionRegion.tsx`。
- 对 `DemandDetailPage.tsx` 做搬家式拆分：
  - 信息区、流程区、产物区、预览弹窗、详情弹窗迁到 `pages/demand-detail/`。
  - 详情页数据加载、身份存储、产物格式化等工具迁到 `demandDetailData.ts`。
  - 页面主文件保留状态编排、事件处理和区域装配。
- 不改变现有接口请求、状态推进、AI 会话创建和产物预览行为。
