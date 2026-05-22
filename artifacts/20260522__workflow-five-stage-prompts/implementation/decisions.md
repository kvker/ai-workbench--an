# 实现记录

- 新增前端共享流程映射，将后端 harness status 聚合展示为 5 个阶段：产品规划、前端开发、后端开发、测试验收、归档。
- 需求页按 5 个阶段聚合需求分栏，并使用 repeat(5, minmax(180px, 1fr)) 占满宽度。
- 详情页流程区使用同一 5 阶段映射。
- 激活态流程节点显示开始/完成按钮；非激活态不显示交互按钮。
- 开始按钮创建新对话并发送 hello；完成按钮创建新对话并发送 hi。
- 新对话 alias 使用「流程名--YYYYMMDD」。

## 追加：移除信息区切换角色

- 信息区删除角色切换按钮和相关展示。
- 详情页删除切换身份弹窗、状态、localStorage 读取和 sync 调用。
- 前端 task service 删除 DemandIdentity 类型、syncDemandIdentity 方法，以及 ensureWorkspace 的 identity 参数。
- 后端删除 POST /api/task/:issueId/identity/sync 路由，并不再接受 workspace ensure 的 identity 查询参数；工作区准备仍按默认 pm 知识加载。
