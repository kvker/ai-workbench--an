# Codex 编辑旧轮次并分叉 需求文档

## 背景与目标

用户希望在 Codex 对话中回到历史用户消息，编辑该消息后从该点重新生成，并保留原对话分支。目标是避免直接破坏原线程，同时获得类似“编辑旧消息生成新分支”的能力。

## 验收标准 (AC)

- [x] AC1: 用户气泡提供“编辑并分叉”入口，且普通 assistant / system-like 气泡不提供该入口。
- [x] AC2: 提交编辑内容后，service 创建新的 Codex session/thread 分支，而不是直接修改原 session。
- [x] AC3: 新分支回滚被编辑用户轮次及其之后的 turns，并用编辑后的文本重新发起 turn。
- [x] AC4: 前端成功后切换到新 session，并在会话历史列表中保留原 session。
- [x] AC5: session 正在运行时不允许分叉，避免 active turn 和 rollback 冲突。
- [x] AC6: 复制功能仍复制原始 Markdown 文本，不受编辑分叉入口影响。

## 范围

### 包含

- 前端对话区用户气泡的内联编辑交互。
- 前端 Codex service 客户端新增 fork turn API。
- service Codex route/service/adapter 支持 fork + rollback + turn start。
- mock adapter 支持 API 级验证。

### 不包含

- 文件系统改动自动回滚。
- 附件内容编辑。
- 多分支树状可视化。

## 风险

- Codex app-server `thread/rollback` 不会回滚本地文件改动；当前版本明确保留该边界。
- 真实 app-server API 需要 session 空闲；当前前后端均限制 busy 状态分叉。
