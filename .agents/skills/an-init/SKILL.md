---
name: an-init
description: 将现有工程转换为 AI Native 项目结构。当用户想要：1) 将现有项目转换为 AI Native 格式 2) 为已有代码生成 background/conventions/artifacts 文档 3) 执行 /an-init 命令 4) 让 AI 理解并接管现有项目 时触发此技能。**始终使用中文与用户沟通。**
---

# AI Native 项目初始化

将现有工程转换为 AI Native 项目结构。

支持将一个或多个项目复制到 `repos/` 目录，每个子目录视为一个独立工程。

## 前置检查

执行前检查：

1. **检查 `repos/` 目录内容**
   - 如果有代码：继续执行
   - 如果为空（仅有 `.gitkeep`）：
     ```
     ⚠️ repos/ 目录为空

     请将你的现有工程代码复制到 repos/ 目录：

     单项目：
     cp -r /path/to/your-project ./repos/my-project

     多项目（前后端分离等）：
     cp -r /path/to/frontend ./repos/frontend
     cp -r /path/to/backend ./repos/backend

     完成后重新执行 /an-init
     ```
     然后停止执行
2. **自动选择执行方式**

   不向用户询问是否使用子代理。AI 根据当前运行环境和任务规模自行判断：
   - 当前环境支持子代理，且有多个独立扫描任务可并行时，可以直接使用子代理。
   - 当前环境不支持子代理、任务很小或并行收益不明显时，在主流程中顺序执行同样脚本。
   - 最终报告中说明实际采用的执行方式即可。

---

## 执行流程

### 阶段一：代码分析（静默执行）

扫描 `repos/` 目录下的每个子目录，提取客观信息：

**子代理并行策略**：

| 执行者 | 职责 | 输出 |
|--------|------|------|
| 主代理 | 识别工程、补全默认假设、合并文档、最终报告 | `AGENTS.md`、`background/`、`conventions/` |
| 命令清单子代理 | 探测测试、构建、代码检查、类型检查、代码生成命令 | `.agents/recipes.json` 和命令摘要 |
| 背景扫描子代理 | 抽取依赖包、路由、接口、数据模型、测试报告线索 | 背景扫描摘要 |

命令清单子代理任务：

```text
在当前仓库中运行：
node .agents/skills/an-recipes/scripts/detect-recipes.mjs --root repos --write .agents/recipes.json

返回：
1. 识别到的工程和命令数量
2. 每个工程的测试、构建、代码检查、类型检查、代码生成命令
3. 低置信度或缺失的命令
```

背景扫描子代理任务：

```text
在当前仓库中运行：
node .agents/skills/an-refresh/scripts/scan-repos.mjs --root repos --artifacts artifacts --format markdown

返回：
1. 依赖包、脚本、依赖摘要
2. 路由和接口线索
3. 数据模型、领域模型线索
4. 测试报告和质量评价报告线索
5. 需要主代理人工判断的待确认项
```

**项目列表识别**：
- 扫描 `repos/` 下的所有一级子目录
- 每个子目录视为一个独立工程

**技术栈识别**（对每个工程分别执行以下检查）：

```
对每个工程子目录：
1. 进入 repos/{工程名}/
2. 检查是否存在 package.json、pom.xml 等特征文件
3. 根据文件内容判断技术栈
```

| 文件存在 | 项目类型 |
|----------|----------|
| `package.json` + `react` | React 前端 |
| `package.json` + `vue` | Vue 前端 |
| `package.json` + `next` | Next.js 全栈 |
| `package.json` + `express` | Express 后端 |
| `package.json` + `nest` | NestJS 后端 |
| `pom.xml` | Java/Maven |
| `requirements.txt` | Python |
| `go.mod` | Go |

**目录结构分析**：
- 扫描每个工程生成目录树
- 推断各目录用途

**代码风格分析**：
- 命名规范（camelCase/kebab-case/PascalCase）
- 文件组织方式
- 注释风格
- 命令清单子代理和背景扫描子代理返回的结构化摘要

**分析原则**：

- 所有结论必须基于代码中的客观事实（文件存在性、依赖列表、脚本名）。
- 禁止根据文件名、目录名推测业务功能、用户意图或未实现的需求。
- 无法确认的信息标记为"待确认"，不得编造。

---

### 阶段二：自动补全初始化假设

分析完成后，不再向用户提问。AI 基于代码客观事实和保守默认值自行补全文档所需信息，并在最终报告中列出默认假设，方便用户后续纠正。

**默认补全规则**：

| 信息 | 默认处理 |
|------|----------|
| 项目整体描述 | 根据工程名称、README、package 元信息、依赖和目录结构提炼一句话；证据不足时写“待确认”。 |
| 目标用户 | 不从技术栈臆测具体人群；证据不足时写“待确认”。 |
| 设计稿链接 | 检测到 UI 框架时尝试从文档或配置中查找；找不到则留空或写“未提供”。 |
| API 文档链接 | 检测到后端框架时尝试从文档、OpenAPI/Swagger 配置中查找；找不到则留空或写“未提供”。 |

**约束**：

- 禁止为了填满文档而编造业务功能、用户画像、外部链接或未实现的需求。
- 可做低风险命名类归纳，例如从工程名提取产品名；所有非代码事实都要标记为“AI 默认”或“待确认”。
- 最终报告必须包含“AI 默认假设”小节，列出哪些内容是 AI 自行补全的，以及用户可直接要求修改。

---

### 阶段三：文档生成

根据分析结果、用户已提供的信息和 AI 默认假设，生成以下文档。

> **文档生成原则**：文档中的每条信息只能来自三个来源——①用户明确输入 ②代码客观分析 ③标注为“AI 默认”的保守补全。禁止编造、推测或填充未经验证的信息。无法确认的内容标记为"待确认"或留空。

> **已有文档处理**：如果目标文件已存在（如重复执行 an-init），基于实际情况合并——保留有效内容，补充新增信息，删除过时内容。

#### AGENTS.md（更新项目背景）

```markdown
## 项目背景

{用户输入的产品描述}

> **缩写说明**：对话中出现的 "AN" 一般指 AI Native 的缩写。

### 工程列表

| 工程 | 类型 | 描述 |
|------|------|------|
| {repos下的子目录名} | {项目类型} | {简要说明} |

### 根工程与子工程关系

- 根工程是 AI Native 工作区，只管理 `background/`、`conventions/`、`artifacts/`、`.agents/` 等 AI 协作资产。
- `repos/` 下的每个一级子目录都是一个独立工程，可能拥有自己的 Git 仓库、依赖、构建命令和发布流程。
- 根工程与 `repos/` 子工程没有 Git 从属关系；根工程通常通过 ignore 规则忽略子工程代码，避免把独立工程误纳入根仓库。
- 修改产品代码时进入对应 `repos/{工程名}/` 处理；修改 AI Native 规范、技能、背景或任务产物时才处理根工程。

### 必读文档

| 路径 | 描述 |
|------|------|
| background/ | 项目背景知识 |
| conventions/ | 项目约定规范 |

### 技术栈

{从代码分析得出的技术栈概要}

### 关键链接

| 资源 | 链接 |
|------|------|
| 设计稿 | {从已有文档或配置识别；若无则留空或写“未提供”} |
| API 文档 | {从已有文档或配置识别；若无则留空或写“未提供”} |

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

## AI 行为约束

- 禁止自行脑补未提及的需求、功能或业务逻辑。
- 所有背景知识必须来自代码事实或用户明确输入。
- 从代码反推的信息要标注来源；无法确认的信息标记为"待确认"。

## Skill 路由

当用户描述开发意图（如"我要做一个XXX"、"添加XXX"、"修复XXX"、"重构XXX"等）时，
先询问用户是否使用 /an-task 标准工作流推进，提供以下选项：
1. 完整流程（raw-input → requirements → design → tech-spec → implementation → testing → deployment）
2. 快速修复（直接 implementation）
3. 自由对话（不使用工作流）
不要自动启动工作流。
```

#### background/product/overview.md

```markdown
# 产品概述

## 产品名称

{从工程名称或用户输入提取}

## 产品定位

{用户输入}

## 目标用户

{用户输入}

## 技术架构

{描述各工程之间的技术关系；证据不足时标记为“待确认”。同时说明根工程仅是 AI Native 工作区，`repos/` 下子工程是独立工程，与根工程没有 Git 从属关系。}
```

#### background/tech/stack.md

```markdown
# 技术栈

{按工程分节}

{遍历 repos/ 下的子目录，为每个工程生成一节}

## {工程名}

| 技术 | 版本 | 用途 |
|------|------|------|
| ... | ... | ... |

## 工具链

| 工具 | 用途 |
|------|------|
| ... | ... |
```

#### background/AGENTS.md

```markdown
# background 目录说明

`background/` 存放项目的稳定背景知识，包括产品定位、领域模型、技术栈、架构决策和功能状态。

## AI 行为

- 需要理解业务或技术背景时，按需读取相关文档。
- 除 `/an-init`、`/an-refresh` 或用户明确要求外，不主动修改本目录。
- 更新时保持增量，不重写人工补充内容。
- 从代码反推的信息要标注来源；无法确认的信息标记为“待确认”。
- 背景文档与 `repos/` 代码冲突时，先以代码事实为准，并在更新摘要中说明冲突。
```

# 目录结构规范

## repos/ 目录结构

{扫描 repos/ 生成的目录树}

## 工程说明

| 目录 | 工程 | 职责 |
|------|------|------|
| repos/{工程A} | {工程A名称} | {说明} |
| repos/{工程B} | {工程B名称} | {说明} |
```

> 多工程场景：`paths` 保持 `["repos/**"]` 即可覆盖所有工程。


# 代码风格规范

## 命名规范

{从代码推断}

## 文件组织

{从代码推断}
```

> 多工程场景：保留所有工程使用的文件后缀。
> 示例：`paths: ["repos/**/*.{ts,tsx,js,jsx}", "repos/**/*.java"]`

#### .agents/recipes.json

由 `/an-recipes` 或命令清单子代理探测生成，记录验证、构建、生成和开发命令清单。

#### artifacts/AGENTS.md

```markdown
# artifacts 目录说明

`artifacts/` 存放任务产出。每个任务使用独立目录，命名为 `YYYYMMDD__feature-name`。

## 约定结构

artifacts/{YYYYMMDD}__{feature-name}/
├── AGENTS.md
├── raw-input/
├── requirements/
├── design/
├── tech-spec/
├── implementation/
├── testing/
└── deployment/

## AI 行为

- 新任务优先创建独立产出目录，并在根 `AGENTS.md` 的活跃 Artifacts 表中登记。
- 产出目录只存过程文档、决策、报告和临时分析，不存放最终产品代码。
- 每个产出目录可包含自己的 `AGENTS.md` 作为任务索引。
- 任务完成后，可使用 `/an-archive` 移动到 `artifacts/archive/`。
- 恢复历史任务时先匹配目录名，再读取对应产出内容，避免无谓加载大量文档。
```

初始化完成后不保留 `background/README.md` 或 `artifacts/README.md`。目录级说明统一放入对应的 `AGENTS.md`，避免 README 与 Codex 双入口漂移。

---

## 输出格式

**单工程示例**：
```
✅ AI Native 项目初始化完成！

识别到 1 个工程：
- my-project：React 前端 - 基于 Next.js + TypeScript

生成文件：
...
```

**多工程示例**：
```
✅ AI Native 项目初始化完成！

识别到 2 个工程：
- frontend：React 前端 - 基于 Next.js + TypeScript
- backend：NestJS 后端 - Node.js + PostgreSQL

生成文件：
- AGENTS.md（更新项目背景）
- background/product/overview.md
- background/tech/stack.md（包含 frontend 和 backend 两节）
- conventions/structure.md（包含两个工程的目录结构）
- conventions/code-style.md（paths 包含 .ts 和 .js 文件）
- .agents/recipes.json（可执行命令清单）
- background/AGENTS.md
- artifacts/AGENTS.md

AI 默认假设：
- 项目整体描述：{AI 默认/待确认内容}
- 目标用户：{AI 默认/待确认内容}
- 设计稿链接：{未提供或识别结果}
- API 文档链接：{未提供或识别结果}
- 执行方式：{使用子代理并行扫描/主流程顺序扫描}

下一步：
1. 在 artifacts/ 中创建你的第一个任务产出目录
2. 参考 background/ 了解项目背景
3. 规范已写入 conventions/，编辑代码和目录结构时自动生效
```

---

### 阶段四：清理

删除模板专用文件：

1. 删除 `./README.md`（模板说明文档，仅供人类阅读）
2. 删除 `background/README.md` 和 `artifacts/README.md`（如存在），目录级说明统一使用 `AGENTS.md`
3. 删除 `repos/.gitkeep`（初始化占位文件，如存在）

如果未使用命令清单子代理，生成文档后运行命令探测：

```bash
node .agents/skills/an-recipes/scripts/detect-recipes.mjs --root repos --write .agents/recipes.json
```

如果未使用背景扫描子代理，需要本地运行背景扫描并将结果纳入文档：

```bash
node .agents/skills/an-refresh/scripts/scan-repos.mjs --root repos --artifacts artifacts --format markdown
```

---

## 错误处理

| 情况 | 处理 |
|------|------|
| repos/ 为空（仅有 .gitkeep） | 停止并提示用户复制代码到 repos/ |
| repos/ 下无子目录 | 提示用户创建工程子目录 |
| 无法识别技术栈 | 标记为“待确认”，继续生成文档，并在最终报告的 AI 默认假设中说明 |
| 用户取消 | 不生成任何文件 |
