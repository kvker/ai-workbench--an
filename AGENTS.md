# AGENTS.md

该项目是 AI Native 工程，即 AI 直接使用的工程项目。

本文件是 AI 索引入口文件，存放精简且极度重要的信息以及其他关键信息的路由。

> **缩写说明**：对话中出现的 "AN" 一般指 AI Native 的缩写。

## 项目背景

这个项目是开发一个 AI 工作台，协同打通传统产研的业务流程 AI 化。

### 工程列表

| 工程 | 类型 | 描述 |
|------|------|------|
| app | React 前端 | AI 工作台的 Web 用户操作端 |
| service | Express 后端 | 承担 Linux 原生功能服务的服务端 |

### 必读文档

| 路径 | 描述 |
|------|------|
| [background/](background/) | 项目背景知识 |
| [conventions/](conventions/) | 项目约定规范 |
| [mock-and-todos](background/tech/mock-and-todos.md) | Mock、临时方案与后续真实接入事项 |

### 技术栈

- `repos/app`：React 19、TypeScript、Vite、ESLint、npm。
- `repos/service`：Node.js、Express 5、CommonJS、npm。

### 关键链接

| 资源 | 链接 |
|------|------|
| 设计稿 | 无，有参考代码 |
| API 文档 | 无 |
| Codex app-server 文档 | https://developers.openai.com/codex/app-server |

### OpenAI/Codex 文档约定

- 调整 `repos/service` Codex app-server adapter 或 `repos/app` 对话区时，优先参考 [Codex app-server 文档](https://developers.openai.com/codex/app-server)。
- 涉及 OpenAI/Codex 官方接口、事件结构、`turn/start`、slash 或 `$` 调用时，必须使用 `openai-docs` 技能或官方 OpenAI 文档核对最新行为。

## 工作流阶段

| 阶段 | 说明 |
|------|------|
| raw-input | 原始输入，原模原样保存用户描述 |
| requirements | 基于 raw-input 生成的技术可理解的需求 |
| design | 技术选型，讨论采用什么方案 |
| tech-spec | 技术规范，输出可执行的变更清单 |
| implementation | 按变更清单写代码 |
| testing | 基于前面的规范生成测试用例并执行测试 |
| deployment | 部署上线 |

## 工程结构

| 目录 | 用途 | AI 行为 |
|------|------|---------|
| [background](background/) | 静态背景知识 | 只读，了解领域知识 |
| [conventions](conventions/) | 项目约定规范 | 开始任务前按需读取，作为行为约束 |
| [artifacts](artifacts/) | 任务产出目录 | 频繁读写，跟踪任务产出 |
| [repos](repos/) | 实际工程项目 | 实现阶段才访问，每个子目录为一个独立工程 |

## 根工程与子工程关系

- 根工程是 AI Native 工作区，只管理 `background/`、`conventions/`、`artifacts/`、`.agents/` 等 AI 协作资产。
- `repos/` 下的每个一级子目录都是一个独立工程，可能拥有自己的 Git 仓库、依赖、构建命令和发布流程。
- 根工程与 `repos/` 子工程没有 Git 从属关系；根工程通常通过 ignore 规则忽略子工程代码，避免把独立工程误纳入根仓库。
- 修改产品代码时进入对应 `repos/{工程名}/` 处理；修改 AI Native 规范、技能、背景或任务产物时才处理根工程。

## 约定

索引文件只存放路由，不存放内容：`[name](path/to/file)`

## AI 行为约束

- 禁止自行脑补未提及的需求、功能或业务逻辑。
- 所有背景知识必须来自代码事实或用户明确输入。
- 从代码反推的信息要标注来源；无法确认的信息标记为"待确认"。
- 不主动读取或输出 `.env`、`secrets/`、credentials、密钥、token 等敏感文件；除非用户明确授权且任务必要。
- 新增、修改或删除 mock、stub、临时默认值、假数据、临时 header 或未来待接入点时，必须同步更新 [mock-and-todos](background/tech/mock-and-todos.md)。

## 必读规范

开始任务前按需读取以下规范：

| 规范 | 用途 |
|------|------|
| [principles](conventions/principles.md) | AI Native 核心原则 |
| [workflow](conventions/workflow.md) | 标准工作流 |
| [flow-policy](conventions/flow-policy.md) | 流程轻重判断 |
| [document](conventions/document.md) | 文档编写规范 |
| [frontend-structure](conventions/frontend-structure.md) | 前端页面与区域命名规范 |
| [rules](conventions/rules.md) | 对话过程中的长期记忆感知与沉淀 |
| [memories](conventions/memories/AGENTS.md) | 对话优化记录索引 |

## 当前活跃 Artifacts

开发过程中按需创建，每个功能在 `artifacts/{feature}/` 下独立管理。

| Artifact | 描述 | 状态 |
|----------|------|------|
| [20260519__frontend-tailwind-prototype](artifacts/20260519__frontend-tailwind-prototype/) | 添加 Tailwind CSS 并实现前端工作台原型 | 已完成 |
| [20260519__frontend-services-module](artifacts/20260519__frontend-services-module/) | 初始化前端 services 模块并基于 mock 数据提供工作台服务 | 已完成 |
| [20260519__local-json-persistence](artifacts/20260519__local-json-persistence/) | 使用 service 本地 JSON 持久化原型过程数据 | 已完成 |
| [20260519__an-init-autonomous-defaults](artifacts/20260519__an-init-autonomous-defaults/) | 调整 an-init 默认行为与 AGENTS 工程关系说明 | 活跃 |
| [20260519__template-workspace-clone](artifacts/20260519__template-workspace-clone/) | 创建需求时从模板仓库浅克隆工作区并切换需求分支 | 已完成 |
| [20260519__codex-conversation-module](artifacts/20260519__codex-conversation-module/) | 封装前端与 service 的 Codex 对话模块 | 活跃 |
| [20260519__frontend-login-page](artifacts/20260519__frontend-login-page/) | 增加前端登录页并接入 devops 登录接口 | 已完成 |
| [20260520__detail-raw-upload](artifacts/20260520__detail-raw-upload/) | 详情页增加上传原始需求与打开文档区入口 | 活跃 |
| [20260520__app-style-polish](artifacts/20260520__app-style-polish/) | 优化前端样式、颜色搭配与 AntD 主题一致性 | 活跃 |
| [20260520__detail-load-pm-skills](artifacts/20260520__detail-load-pm-skills/) | 请求详情页时按流程自动加载 PM skills 到需求工作区 | 活跃 |
| [20260521__detail-knowledge-role-sync](artifacts/20260521__detail-knowledge-role-sync/) | 详情页按职能加载 skills/conventions 并全量加载 background | 活跃 |
| [20260521__split-large-frontend-files](artifacts/20260521__split-large-frontend-files/) | 拆分过大的 Codex 对话模块与详情页组件文件 | 活跃 |
| [20260522__document-region-new-tab](artifacts/20260522__document-region-new-tab/) | 打开文档区改为前端新标签打开 Web 文档区 | 已完成 |
| [20260522__update-files-sync](artifacts/20260522__update-files-sync/) | 将更新代码改为更新文件并调整 Harness 文件同步策略 | 活跃 |
| [20260522__deploy-plan-modal](artifacts/20260522__deploy-plan-modal/) | 详情页增加发布计划弹框并通过发布计划接口创建分支 | 已完成 |
| [20260525__detail-update-materials](artifacts/20260525__detail-update-materials/) | 详情页将更新文件改为可视化选择角色和物料后更新 | 活跃 |
| [20260527__codex-app-server-dialog](artifacts/20260527__codex-app-server-dialog/) | 根据 Codex app-server 文档完善对话框 slash、`$` 调用和气泡兼容 | 活跃 |
| [20260527__codex-agent-toml-sync](artifacts/20260527__codex-agent-toml-sync/) | 将 Harness Markdown 自定义代理转换为 Codex `.codex/agents/*.toml` | 活跃 |
| [20260527__codex-file-change-render](artifacts/20260527__codex-file-change-render/) | 修复 Codex 对话中文件变更重复气泡与 diff Markdown 误渲染 | 活跃 |
| [20260528__artifact-region-markdown-list](artifacts/20260528__artifact-region-markdown-list/) | 修复产物区按 artifacts 目录展示 Markdown 且排除 AGENTS.md | 活跃 |
| [20260528__codex-paste-file-upload](artifacts/20260528__codex-paste-file-upload/) | AI 会话框支持粘贴文件上传到工作区 tmp 目录 | 活跃 |
| [20260529__codex-chat-file-picker](artifacts/20260529__codex-chat-file-picker/) | AI 会话输入区支持批量选择文件与文件夹上传 | 活跃 |
| [20260529__detail-react-auto-flow](artifacts/20260529__detail-react-auto-flow/) | 详情页流程区新增 ReAct AI 一键自动执行入口 | 活跃 |
| [20260601__service-harness-pull-webhook](artifacts/20260601__service-harness-pull-webhook/) | service 增加 webhook 触发 harness main 拉取 | 活跃 |
| [20260609__codex-edit-turn-fork](artifacts/20260609__codex-edit-turn-fork/) | Codex 对话支持编辑旧用户轮次并分叉新会话 | 活跃 |
| [20260609__codex-session-archive](artifacts/20260609__codex-session-archive/) | Codex 历史会话支持显式改名、归档和恢复 | 活跃 |
| [20260609__db-sql-generator](artifacts/20260609__db-sql-generator/) | 新增 DB 菜单和 SQL 生成器，复用 Codex 对话 UI 并选择 `background/db/*` 扁平物料 | 活跃 |

## Skill 路由

| 意图 | 推荐技能 |
|------|----------|
| 将已有项目迁入 AI Native 结构 | `/an-init` |
| 开始一个功能、修复、重构或文档任务 | `/an-task` |
| 拆分大型需求或长任务 | `/an-task-split` |
| 探测或刷新测试、构建、代码检查、生成命令 | `/an-recipes` |
| 根据代码和已完成任务刷新背景知识 | `/an-refresh` |
| 评价任务是否真的完成 | `/an-eval` |
| 归档已完成的任务产出 | `/an-archive` |

当用户描述开发意图（如"我要做一个XXX"、"添加XXX"、"修复XXX"、"重构XXX"等）时，触发 `/an-task`。

入口文件只负责路由，不规定具体流程轻重。触发 `/an-task` 后，由技能根据 [flow-policy](conventions/flow-policy.md) 自主判断 L0/L1/L2/L3 并推进；只有需求目标不明确、验收标准无法自洽、涉及高风险边界、需要破坏性操作或外部授权时，才暂停向用户确认。
