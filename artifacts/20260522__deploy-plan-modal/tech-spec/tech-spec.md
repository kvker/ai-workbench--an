# 发布计划弹框技术规范

## 数据模型

### 前端类型

```ts
export type DeployPlan = {
  id: number
  issueId: number
  issueName?: string
  projectName?: string
  projectCode?: string
  projectConfigId?: number
  gitProjectId?: number
  branchName?: string
  status?: number
  statusDesc?: string
}

export type ProjectConfig = {
  id: number
  projectName: string
  projectCode?: string
  codeRepository?: string
  defaultBranchName?: string
  kind?: string
}

export type CreateDeployPlanInput = {
  issueId: number
  projectConfigId: number
  branchName?: string
  planDeployDate?: string
  reviewUser?: string
  testUser?: string
  remark?: string
}
```

### service 返回类型

```ts
export type PrepareDeployPlanRepositoriesResult = {
  status: 'completed' | 'partial' | 'skipped'
  baseDir: string
  repositories: Array<{
    deployPlanId?: number
    projectConfigId?: number
    projectName?: string
    projectCode?: string
    branchName?: string
    repositoryUrl?: string
    localPath?: string
    status: 'cloned' | 'updated' | 'skipped' | 'failed'
    reason?: string
  }>
}
```

## 接口契约

### 前端调用 devops

| 方法 | 路径 | 用途 |
|------|------|------|
| `GET` | `/deployPlan/list?issueId={issueId}` | 刷新当前需求发布计划列表 |
| `POST` | `/deployPlan/add` | 创建发布计划，由该接口处理分支创建 |
| `DELETE` | `/deployPlan/delete` | 解除开发中的发布计划 |
| `GET` | `/projectConfig/list` | 查询全量工程作为发布计划可选工程 |

### 前端调用 service

| 方法 | 路径 | 用途 |
|------|------|------|
| `POST` | `/api/task/:issueId/deploy-plan-repositories/prepare` | 根据发布计划列表准备本地仓库 |

请求体：

```json
{
  "deployPlans": [
    {
      "id": 1,
      "projectConfigId": 1,
      "projectName": "frontend",
      "projectCode": "frontend",
      "branchName": "task-1"
    }
  ]
}
```

service 调 devops：

| 方法 | 路径 | 用途 |
|------|------|------|
| `GET` | `/projectConfig/detail?configId={projectConfigId}` | 获取 `codeRepository` |

service 环境变量：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `DEVOPS_API_BASE_URL` | `http://devops-api.dahuangf.com:8090/devops` | service 访问 devops 的接口地址 |
| `DEPLOY_PLAN_REPOS_DIR` | 无默认使用 | 仅作为没有 workspace baseDir 时的 fallback；正常路径使用当前需求工作区 `workspacePath/repos/` |

## 核心逻辑

### 分支名生成

```ts
function createIssueBranchName(issue: Issue) {
  return issue.wsBranchName || `task-${issue.id}`
}
```

- 前端创建发布计划时不传 `branchName`，由 devops 后端生成并创建分支。
- service `workspaceService` 保留 `task-${id}` 兜底，但不再为详情页默认加载创建/关联远端分支。

### 发布计划仓库准备

```text
for deployPlan in deployPlans:
  if missing projectConfigId or branchName:
    mark skipped
    continue

  projectConfig = GET /projectConfig/detail?configId=projectConfigId
  repositoryUrl = projectConfig.codeRepository
  localPath = workspacePath / repos / safe(projectCode || projectName || projectConfigId)

  if missing repositoryUrl:
    mark skipped
    continue

  if localPath does not exist:
    git clone --branch branchName --single-branch repositoryUrl localPath
    mark cloned
    continue

  assert localPath/.git exists
  assert git status --porcelain is empty
  git fetch origin branchName
  git checkout branchName
  git pull --rebase origin branchName
  mark updated
```

## 变更清单

| 序号 | 变更项 | 文件路径 | 变更类型 | 说明 |
|------|--------|----------|----------|------|
| 1 | 扩展发布计划和工程配置类型 | `repos/app/src/services/types.ts` | 修改 | 补 `projectConfigId/gitProjectId` 和 `ProjectConfig/CreateDeployPlanInput` |
| 2 | 新增发布计划 service | `repos/app/src/services/deployPlan.ts` | 新增 | 封装列表、创建、可选工程查询 |
| 3 | 导出发布计划 service | `repos/app/src/services/index.ts` | 修改 | 对外暴露 `deployPlanService` |
| 4 | 抽分支名生成方法 | `repos/app/src/pages/demand-detail/demandDetailData.ts` | 修改 | 新增 `createIssueBranchName` 并替换散落 fallback |
| 5 | 增加发布计划弹框组件 | `repos/app/src/pages/demand-detail/DeployPlanDialog.tsx` | 新增 | 展示列表、加号、选择未选工程、创建发布计划 |
| 6 | 信息区增加按钮 | `repos/app/src/pages/demand-detail/DemandInfoRegion.tsx` | 修改 | 新增“发布计划”按钮和回调 |
| 7 | 详情页接入发布计划状态 | `repos/app/src/pages/DemandDetailPage.tsx` | 修改 | 加载/刷新发布计划、打开弹框、触发仓库准备 |
| 8 | taskService 增加仓库准备调用 | `repos/app/src/services/task.ts` | 修改 | 调用 service 新 API |
| 9 | service 新增发布计划仓库服务 | `repos/service/src/services/deployPlanRepositoryService.js` | 新增 | devops 工程详情查询、clone、pull --rebase |
| 10 | service task 路由新增 API | `repos/service/src/routes/task.js` | 修改 | 新增 `/deploy-plan-repositories/prepare` |
| 11 | 记录实现决策 | `artifacts/20260522__deploy-plan-modal/implementation/decisions.md` | 新增 | 如实现中遇到接口字段或错误处理调整，记录原因 |

## 配置变更

- 可选新增 `repos/service/.env` 配置项由运行环境自行维护，不在本次任务读取或修改 `.env`。
- 代码新增默认值：
  - `DEVOPS_API_BASE_URL` 默认 `http://devops-api.dahuangf.com:8090/devops`。
  - 发布计划仓库目录使用当前需求工作区 `workspacePath/repos/`。

由于新增了默认目录与环境变量兜底，需要同步更新 `background/tech/mock-and-todos.md`。

## 测试计划

- `repos/app`: 运行 `npm run build`。
- `repos/app`: 运行 `npm run lint`。
- `repos/service`: 运行 `node --check app.js`。
- `repos/service`: 运行 `node --check src/routes/task.js`。
- `repos/service`: 运行 `node --check src/services/deployPlanRepositoryService.js`。
- 手工代码检查：
  - 发布计划弹框只展示未选工程。
  - service 不修改 Java 代码。
  - service 遇到缺少 `projectConfigId/branchName/codeRepository` 时返回 skipped，不阻塞详情页。
  - service 遇到已有仓库脏工作区时不执行 pull --rebase。
