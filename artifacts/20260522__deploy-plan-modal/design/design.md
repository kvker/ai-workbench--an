# 发布计划弹框技术选型

## 方案概述

前端详情页新增发布计划弹框，发布计划数据走 devops 现有接口；本地仓库准备放在 `repos/service`，由前端在详情页加载成功后触发 service 处理 clone / pull --rebase。

## 代码事实

| 事实 | 来源 |
|------|------|
| 详情页入口为 `DemandDetailPage`，信息区组件为 `DemandInfoRegion`。 | `repos/app/src/pages/DemandDetailPage.tsx`、`repos/app/src/pages/demand-detail/DemandInfoRegion.tsx` |
| 当前详情页已调用 `issueService.issueBoard(issueId)`，类型 `IssueBoard.deployPlans` 已存在。 | `repos/app/src/pages/demand-detail/demandDetailData.ts`、`repos/app/src/services/types.ts` |
| 当前工作区准备由 `taskService.ensureWorkspace(issue)` 调用 service，service 中 `workspaceService` 已包含模板仓库 clone、分支 checkout、创建本地分支逻辑。 | `repos/app/src/services/task.ts`、`repos/service/src/services/workspaceService.js` |
| devops 发布计划完整 VO 含 `projectConfigId`、`projectName`、`branchName`、`gitProjectId`，不含仓库 URL。 | `/home/dhf/projects/devops-service/.../DeployPlanVO.java`，只读 |
| devops 工程配置 VO 含 `codeRepository`、`defaultBranchName`、`kind`。 | `/home/dhf/projects/devops-service/.../ProjectConfigVO.java`，只读 |
| devops 提供 `GET /projectConfig/queryAvailableProjects`、`GET /projectConfig/detail` 和 `POST /deployPlan/add`。 | `/home/dhf/projects/devops-service/.../ProjectConfigController.java`、`DeployPlanController.java`，只读 |

## 技术选型决策

| 决策点 | 选项 | 最终选择 | 理由 |
|--------|------|----------|------|
| 发布计划列表来源 | `issueBoard.deployPlans` / `/ai/workspace/deployPlans` / `/deployPlan/list` | 优先使用 `issueBoard.deployPlans`，新增后用 `/deployPlan/list?issueId=` 刷新 | 详情页已加载 `issueBoard`，减少额外请求；完整列表保留 `projectConfigId`，便于后续补仓库信息。 |
| 可选工程来源 | `/projectConfig/list` / `/projectConfig/queryAvailableProjects` / 静态配置 | `/projectConfig/list` | 用户确认业务上发布计划选择工程应使用全量工程列表。 |
| 创建分支方式 | service 直接 git 创建分支 / devops `POST /deployPlan/add` | devops `POST /deployPlan/add` 且创建时不传 `branchName` | devops 后端在 `branchName` 为空时会新建开发分支；传入时按自定义分支校验。 |
| 自动分支生成保留方式 | 沿用 `task-${issue.id}` / 抽公共函数 / 后端生成 | 前端抽 `createIssueBranchName(issue)`，service 保留同规则兜底，创建发布计划不使用 | 当前前后端都已有 `task-${id}` 规则；保留用于旧工作区兜底，发布计划分支由 devops 创建。 |
| 本地仓库准备触发点 | 前端直接 git / service API / devops 后端 | `repos/service` 新增 API | 前端不能执行本地 git；不修改 devops Java；service 已承担本地文件系统和 git 能力。 |
| 本地仓库目录 | 根工程 `repos/{projectCode}` / 当前工作区 `repos/{projectCode}` / 全局 `deploy-plans/{projectCode}` | 当前需求工作区 `workspacePath/repos/{safeProjectCodeOrName}` | 符合一个需求绑定一个工程文件夹的语义，例如 `workspaces/harness-ws-6105--zhaoyue/repos/{工程}`。 |
| 已有仓库更新策略 | 总是 pull --rebase / 先检查脏工作区 / 强制重置 | 先检查脏工作区，干净才 checkout + pull --rebase | 避免覆盖用户或 AI 未提交改动；有脏变更则返回 skipped/error 状态。 |
| 仓库 URL 获取 | 发布计划列表直接取 / `projectConfigId -> detail` 补齐 / 环境变量映射 | `projectConfigId -> /projectConfig/detail` 补 `codeRepository` | 当前发布计划 VO 不含 URL，工程详情已有 `codeRepository`。 |
| devops Java 代码 | 修改接口补字段 / 只读使用现有接口 | 不修改 Java | 用户明确要求不要动 Java。 |

## 交互流程

1. 详情页加载 issue detail、issue board、workspace、artifacts。
2. 从 `IssueBoard.deployPlans` 得到当前发布计划列表，并展示在“发布计划”弹框中。
3. 详情页发布计划列表加载成功后，调用 service 的“准备发布计划仓库”接口。
4. service 对每个发布计划：
   - 用 `projectConfigId` 查询 devops 工程详情，获取 `codeRepository`。
   - 本地目录不存在：`git clone --branch {branchName} {codeRepository} {workspacePath}/repos/{projectKey}`。
   - 本地目录存在：检查 `.git` 和工作区干净，checkout 目标分支后 `git pull --rebase origin {branchName}`。
5. 用户点击信息区“发布计划”按钮，打开弹框查看列表。
6. 用户点击加号后，前端展示未创建发布计划的可选工程。
7. 用户选择工程后，前端调用 `POST /deployPlan/add`，只提交 `issueId` 和 `projectConfigId`，不提交 `branchName`。
8. 创建成功后刷新发布计划列表，并再次触发 service 准备新增仓库。

## 风险与权衡

- `POST /deployPlan/add` 的 `planDeployDate/reviewUser/testUser/remark` 可能存在后端隐性必填：设计上先只提交明确必需的 `issueId/projectConfigId/branchName`，若接口返回错误，再在实现阶段按错误信息补最小字段。
- 本地 clone 需要仓库访问权限：失败时不阻塞详情页展示，返回单项失败结果并在前端弱提示。
- 已有仓库存在未提交变更时不执行 pull --rebase，避免破坏本地状态。
- service 调 devops 需要透传前端 token：沿用现有 `request` header 中的 `token`，service 新接口读取并转发。
