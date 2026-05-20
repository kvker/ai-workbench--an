# 测试记录

## 执行时间

- 2026-05-20 10:01:27 CST

## 结果

| 序号 | 验证项 | 命令 | 结果 | 说明 |
|------|--------|------|------|------|
| 1 | Service 模块加载 | `node -e "require('./src/services/skillSyncService'); require('./src/routes/task'); require('./src/routes/workspace'); console.log('service modules ok')"` | 通过 | 新增模块与路由可被 CommonJS 正常加载 |
| 2 | PM skills 覆盖复制 | 临时目录模拟 `KNOWLEDGE_ROOT_DIR`、`PM_SKILLS` 后调用 `syncPmSkillsForFlow` | 通过 | `pm-raw`、`pm-demo`、`pm-handoff` 被复制到 `.codex/skills`，旧 `pm-raw/old.txt` 被覆盖删除 |
| 3 | 前端构建 | `npm run build` | 通过 | TypeScript 与 Vite 构建成功；仅保留 Vite chunk size 警告 |
| 4 | 真实 PM skills 目录同步 | `KNOWLEDGE_ROOT_DIR=../../../qingtian-harness PM_SKILLS=pm-raw,pm-demo,pm-handoff node ...` | 通过 | 源目录解析到 `/Users/zweizhao/project/current/qingtian-harness/skills/pm`，三份 skill 已同步到需求工作区 `.codex/skills` |
| 5 | 缺失 skill 边界 | `PM_SKILLS=pm-raw,pm-not-exists node ...` | 通过 | 返回 `status: partial` 和 `missing`，不抛出 500 阻断详情页 |
| 6 | PM_SKILLS_DIR 配置 | `KNOWLEDGE_ROOT_DIR=../../../qingtian-harness PM_SKILLS_DIR=skills/pm PM_SKILLS=pm-raw,pm-demo,pm-handoff node ...` | 通过 | 源目录通过 `PM_SKILLS_DIR` 解析到 `/Users/zweizhao/project/current/qingtian-harness/skills/pm` |
| 7 | PM_SKILLS_DIR 非法值边界 | `PM_SKILLS_DIR=../bad PM_SKILLS=pm-raw node ...` | 通过 | 非法相对目录回退到默认 `skills/pm`，未越界读取 |

## 风险

- 未启动完整 service 做 HTTP 端到端请求；已直接验证详情页调用的同步函数、真实知识库路径和目标工作区结果。
