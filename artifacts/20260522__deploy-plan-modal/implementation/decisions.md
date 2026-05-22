# 实现决策记录

## 决策 1：发布计划仓库目录使用当前需求工作区 `repos/`

发布计划仓库应绑定当前需求工作区，而不是放在根工程目录。service 在处理 `/api/task/:issueId/deploy-plan-repositories/prepare` 时会先准备当前 issue workspace，再把发布计划仓库 clone / update 到 `{workspacePath}/repos/{projectKey}`。

示例：`/home/dhf/projects/ai-workbench/workspaces/harness-ws-6105--zhaoyue/repos/{工程}`。

## 决策 2：详情页不因仓库准备失败而加载失败

发布计划列表展示是主要用户路径，clone / pull --rebase 依赖 Git 权限、仓库地址和本地状态。实现上将仓库准备失败降级为 warning，不阻塞详情页和弹框。

## 决策 3：已有仓库存在未提交变更时不执行 pull --rebase

service 会先检查 `git status --porcelain`。如工作区不干净，单项返回 `failed`，不执行 checkout 或 rebase，避免破坏本地未提交改动。

## 决策 4：未修改 Java 代码

本任务只读取 `/home/dhf/projects/devops-service` 中接口定义确认字段，没有修改 Java 代码。实现只改动 `ai-workbench` 内前端、service 和文档。

## 决策 5：Git 仓库地址从 HTTPS 转为 SSH

devops 工程配置返回的 `codeRepository` 可能是 `https://git.dahuangf.com/...`，直接 clone 会触发账号密码输入。service 在准备发布计划仓库时默认转换为 SSH：

```text
https://git.dahuangf.com/hornet/accesscontrolh5.git
ssh://git@git.dahuangf.com:10022/hornet/accesscontrolh5.git
```

默认 host 为 `git.dahuangf.com`，端口为 `10022`，可通过 `DEPLOY_PLAN_GIT_SSH_HOST`、`DEPLOY_PLAN_GIT_SSH_PORT` 覆盖。
