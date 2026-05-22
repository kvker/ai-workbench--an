# 发布计划弹框发布说明

## 变更摘要

- 详情页信息区新增“发布计划”按钮和弹框。
- 发布计划弹框展示当前需求关联发布计划，支持选择未创建发布计划的工程添加发布计划。
- 发布计划卡片支持二次确认后解除发布计划。
- 创建发布计划调用 devops `POST /deployPlan/add`，分支名沿用现有 `task-{issueId}` 生成规则。
- 详情页获取发布计划后调用 service 准备本地仓库分支。
- service 新增发布计划仓库准备能力：在当前需求工作区 `repos/` 下，缺失仓库执行 clone，已有仓库且工作区干净时执行 checkout 与 `git pull --rebase`。
- 未修改 `/home/dhf/projects/devops-service` Java 代码。

## 版本信息

- 版本号: 待发布流程确定
- 分支: 待发布流程确定

## 上线清单

- [x] 前端构建通过
- [x] 前端 lint 通过
- [x] service 语法检查通过
- [x] 质量评价通过
- [ ] 部署环境配置 `DEVOPS_API_BASE_URL`
- [ ] 确认运行用户具备目标仓库 clone / pull 权限
- [ ] 确认运行用户已配置 `git@git.dahuangf.com:10022` 对应 SSH key

## 回滚方案

- 前端回滚详情页发布计划入口、弹框和 service 调用相关提交。
- service 回滚 `/api/task/:issueId/deploy-plan-repositories/prepare` 路由和 `deployPlanRepositoryService`。
- 删除或保留已 clone 到当前需求工作区 `repos/` 下的本地仓库按运维策略处理。
