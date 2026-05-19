# 测试报告

## 结果

通过。

## 执行项

- `node --check app.js`
- `node --check src/routes/workspace.js`
- `node --check src/services/workspaceService.js`
- `node --check src/config/loadEnv.js`
- 使用临时本地 git 仓库模拟模板仓库，验证：
  - 创建 `TEMPLATE_ROOT_DIR/workspaces`
  - 仅从 `main` 浅克隆模板仓库
  - 创建并切换到 `task-[hash]` 分支
  - 删除本地 `main` 分支
- 使用临时本地 git 仓库模拟详情页恢复，验证：
  - 需求分支已存在时，缺失工作区可浅克隆该分支恢复
  - 需求分支不存在时，缺失工作区可从 `main` 创建目标分支
  - 工作区目录存在但目标分支缺失时，可从 `main` 修复并删除本地 `main`
- `PORT=3310 npm run start`
- 实测 `GET /api/task/test1-mpc89zwi`：
  - 发现旧 3100 进程未加载新代码，重启后恢复逻辑生效。
  - 创建并返回绝对 `workspacePath`。
  - 本地目录存在，当前分支为 `task-test1-mpc89zwi`。
- 修正目录层级后实测：
  - `workspacePath` 为 `/Users/zweizhao/project/current/workspaces/task-test1-mpc89zwi`
  - 当前分支为 `task-test1-mpc89zwi`
- `npm run dev` 使用 nodemon 启动 3100，并实测详情接口仍返回正确 `workspacePath`。
- 并发恢复测试：
  - 对已有工作区的同一详情接口并发请求 2 次，均返回 `HTTP 200`。
  - 对缺失工作区的测试需求并发请求 2 次，均返回 `HTTP 200`。
  - 测试需求最终创建目录 `/Users/zweizhao/project/current/workspaces/task-concurrency-test`，当前分支为 `task-concurrency-test`。
  - nodemon 未因 `data/workbench.json` 写入重启。
- 前端验证：
  - `npm run build` 通过。
  - 通过浏览器打开 `http://localhost:5174/demands/test1-mpc89zwi`，确认页面可渲染“正在初始化需求工程”文案。
- 用户工作区命名验证：
  - 默认用户返回 `task-test1-mpc89zwi--zweizhao`，分支仍为 `task-test1-mpc89zwi`。
  - 请求头 `x-workspace-user: zhangsan` 返回 `task-test1-mpc89zwi--zhangsan`，分支仍为 `task-test1-mpc89zwi`。
  - zhangsan 的详情访问不会覆盖 JSON 中默认用户的共享记录。
- user id 过渡验证：
  - 请求头 `x-workspace-user-id: user-123` 返回 `task-test1-mpc89zwi--user-123`，分支仍为 `task-test1-mpc89zwi`。
  - 前端 mock session 默认 user id 为 `user-zweizhao`，接口返回 `task-test1-mpc89zwi--user-zweizhao`。
- 文档同步：
  - 新增 `background/tech/mock-and-todos.md`。
  - 根 `AGENTS.md` 已加入 mock 文档路由和同步约束。

## 备注

未读取或输出真实 `.env` 内容。真实模板仓库地址由运行时环境变量加载。
