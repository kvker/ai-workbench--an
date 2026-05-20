# 实现记录

## 决策

- 采用 L1 快速修复，仅保存 raw-input、实现记录和测试记录。
- 上传接口使用 `application/zip` / `application/octet-stream` 原始请求体，避免为单文件上传新增 multipart 依赖。
- 原始 zip 保存在 `{workspacePath}/tmp/`，同名直接覆盖。
- zip 解包后的文件写入 `{workspacePath}/artifacts/{branchName}/pm-raw/input/`，其中 `branchName` 形如 `task-[hash]`。
- 解包文件默认已存在同名文件时跳过；通过请求体 query 参数 `overwriteFiles` 预留可覆盖文件列表配置，未来可由前端暴露更细控制。
- “打开文档区”当前用本机 open/xdg-open/cmd 打开 artifacts 目录，并在代码中注释说明最终应切换为 vscode-server 协议打开指定文件夹。
- 2026-05-20 修正：“打开文档区”应打开需求子工程所在目录 `{workspacePath}`，不再打开 `{workspacePath}/artifacts/{branchName}`。
- 2026-05-20 增加详情页身份切换入口：在“查看详情”左侧增加“切换身份”按钮，弹框选项为产品、前端、后端、测试；预留 `switchDemandIdentity` 函数用于后续接入切换后的真实动作。
- 2026-05-20 接入身份切换同步：身份本地按需求保存在 localStorage，值为 `pm`、`fe`、`be`、`qa`；切换时调用 service 执行 `git pull origin main`，再覆盖同步 `background`、`conventions`、角色 skills/shared skills、角色 agents/shared agents 到需求工作区。
- 角色目录按身份值直连：`pm`、`fe`、`be`、`qa` 分别读取 `skills/{role}` 与 `agents/{role}`；复制时不保留角色目录这一层，例如 `skills/pm/xxx` 落到 `.codex/skills/xxx`。缺失角色目录按空处理，shared 目录同样按内容合并到 `.codex/skills` 与 `.codex/agents`。
- 2026-05-20 增加“更新代码”入口：详情页信息区点击后，service 在需求工作区根仓库与 `repos/` 下一级 git 仓库中分别读取当前分支，并执行 `git pull --rebase origin {current_branch}`；完成后前端刷新详情页数据。
- 2026-05-20 调整信息区按钮：全部使用 AntD small 尺寸，常驻操作靠前，状态相关的“上传原始需求”放在最后。
