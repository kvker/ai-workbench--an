# 实现记录

## 流程等级

L1 快速修复。用户已明确要求直接处理，需求范围集中在 service 创建需求时的工作区初始化。

## 决策

- 不读取或输出 `.env` 的实际值，仅通过运行时环境变量 `TEMPLATE_REPO_URL` 和 `TEMPLATE_ROOT_DIR` 使用配置。
- 需求 hash 作为 demand id，需求分支与工作区目录统一命名为 `task-[hash]`。
- `workspaces` 目录位于 `TEMPLATE_ROOT_DIR/workspaces`，不存在时由服务端创建。
- 克隆命令限定为 `git clone --depth 1 --single-branch --branch main`，避免拉取其他分支信息。
- 克隆完成后创建并切换到 `task-[hash]`，再删除本地 `main` 分支。
- 打开详情页时由 `GET /api/task/:demandId` 触发后端恢复检查；若需求存在但工作区目录缺失，则自动重建。
- 恢复时先检测模板仓库是否存在目标需求分支：
  - 若存在，浅克隆该目标分支。
  - 若不存在，浅克隆 `main`，创建并切换到目标需求分支，再删除本地 `main`。
- 若工作区目录存在但目标分支缺失，后端会在该 git 工作区内恢复目标分支；目录存在但不是 git 仓库时返回冲突错误。
- `TEMPLATE_ROOT_DIR` 支持相对路径；相对路径按 service 工程目录解析。需求工作区放在模板目录同级，形如 `workspaces/task-[hash]`，并持久化为绝对 `workspacePath`。
- git 子进程设置 30 秒超时；模板仓库访问异常或认证卡住时，接口返回超时错误而不是无限等待。
- service 开发脚本改为 `nodemon app.js`，本地开发时自动重启，避免手动重启旧进程导致接口命中旧逻辑。
- `GET /api/task/:demandId` 的工作区恢复按分支名加进程内互斥锁，同一需求的并发请求共享同一个恢复任务，避免 React 开发模式双请求撞到半成品目录。
- `GET /api/task/:demandId` 仅在工作区字段变化时写入 JSON，避免只读详情请求频繁改 `updatedAt`。
- nodemon 开发脚本只监听 `app.js` 和 `src` 下的 JS/CJS 文件，并忽略 `data`，避免 service 写 `workbench.json` 时触发自重启。
- 详情页加载任务详情时展示专用初始化状态，文案为“正在初始化需求工程”，并在初始化期间禁用消息输入和发送按钮。
- 分支名保持 `task-[hash]` 不变；工作区文件夹改为 `task-[hash]--[username]`，用于隔离不同用户的本地工作区。
- 用户名解析优先级：`x-workspace-user` 请求头、`user` 查询参数、服务运行系统用户名。用户名会被规范化为路径安全 slug。
- 详情接口按当前请求用户动态返回 `workspaceFolder/workspacePath`，不再把其他用户的工作区路径覆盖进共享需求元数据。
- 用户目录标识从 username 收敛为 user id。前端原型阶段通过 mock session 自动带 `x-workspace-user-id`，后端优先解析该 header；未来接入登录后替换为 token/session 解析。
- 新增 `background/tech/mock-and-todos.md` 作为 mock 与待真实接入事项清单；后续新增、修改或删除 mock 时必须同步该文档。
