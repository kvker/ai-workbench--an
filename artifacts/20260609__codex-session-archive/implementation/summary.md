# 实现摘要

## 已实现

- 历史对话区会话卡片新增“修改名字”按钮，替代双击改名。
- 删除双击改名相关的 `useRef`、`useEffect`、延迟单击定时器和 `onDoubleClick` 代码。
- 活跃会话卡片新增归档按钮，使用 `Popconfirm` 二次确认。
- service 在现有 `PATCH /api/codex/sessions/:sessionId` 上支持 `{ archived: true | false }`，通过 session metadata 的 `archivedAt` 标记归档状态。
- 前端按 `archivedAt` 将会话分为活跃会话和归档区。
- 归档区位于历史对话区下方，最大占侧栏 50% 高度，内容可滚动。
- 归档会话可点击“恢复”回到活跃会话列表。
- 当前选中会话被归档后，自动切换到最近活跃会话；没有活跃会话时自动创建新会话。

## 关键文件

- `repos/app/src/components/codex-conversation/CodexSessionRegion.tsx`
- `repos/app/src/components/codex-conversation/CodexConversationModule.tsx`
- `repos/app/src/services/codex.ts`
- `repos/service/src/services/codex/service.js`

## 设计说明

- 归档不是删除，只是写入/清除 `metadata.archivedAt`。
- 归档会话仍保留完整事件和 session 信息，可恢复后继续选择。
