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
- 2026-05-20 将“上传原始需求”移入流程区“需求分析”节点，并新增“需求分析”动作；service 先检查 `.codex/skills/pm-raw` 和 `{workspacePath}/artifacts/{branchName}/pm-raw/input/` 非空，再创建 Codex 会话并把 input 目录路径作为 pm-raw skill 的执行输入。
- 2026-05-20 优化 Codex 会话体验：需求分析启动后自动切换右侧会话；命令输出默认折叠但保留排错入口；运行中根据事件展示活动状态；AI 消息使用 `react-markdown` 做轻量 Markdown 渲染。
- 2026-05-20 产物区改为读取工作区真实输出产物：service 列出 `{workspacePath}/artifacts/{branchName}/{node}/` 下的直接文件，前端展示文件名、节点、大小和更新时间；流程区移除状态 label，“上传原始需求”改为“上传需求”，“需求分析”按钮改为“分析”。
- 2026-05-20 产物区去掉文件右侧“产物”标记，并将产物区改为固定头部 + 可滚动列表；流程节点标题与控制按钮拆成两行展示。
- 2026-05-20 产物区列表忽略以 `.` 开头的隐藏节点目录和隐藏文件。
- 2026-05-21 产物区文件增加可点击预览：前端点击产物后调用 service 读取当前需求 artifacts 根目录内的文件内容，并在弹框中用 `marked` 渲染 Markdown；渲染前通过 DOMPurify 清理 HTML，产物列表项使用 pointer 与 hover 状态提示可点击。
- 产物预览接口只允许读取当前工作区 `{workspacePath}/artifacts/{branchName}` 下的真实文件路径，并通过 `realpath` 校验符号链接解析后的路径仍在 artifacts 根目录内。
- 2026-05-21 产物预览补充 Mermaid 支持：弹框渲染 Markdown 后识别 `pre > code.language-mermaid`，按需动态加载 `mermaid` 并将流程图替换为 SVG；Mermaid 使用 `securityLevel=strict` 生成内容，渲染失败时保留原始代码块并增加错误边框。
- Mermaid 采用动态 import，避免普通详情页加载直接引入 Mermaid 全量解析依赖；只有预览内容包含 Mermaid 代码块时才加载。
- 2026-05-21 修正 Mermaid 节点文本未显示：关闭 flowchart HTML labels，优先使用 SVG text 渲染文本；同时取消 Mermaid SVG 的二次 DOMPurify 白名单净化，避免 Mermaid 节点 label 结构被剥离。
- 2026-05-21 根据代码审核修正 Mermaid 异步渲染边界：捕获动态 import 失败，render 失败路径也遵守 effect cleanup guard，并同步设置 root-level `htmlLabels: false`。
