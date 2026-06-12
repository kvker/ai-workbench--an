# DB ops 工作区同步技术规格

## 范围

- DB 物料源目录：Harness `background/ops/db`。
- DB 工作区目录：service 工程当前工作目录下 `workspaces-ops-db/{user}/`。
- 用户标识：复用 `x-workspace-user` 解析和清洗规则。
- 同步行为：进入页面或刷新物料后创建用户目录；勾选变化后将已选文件夹复制到用户目录。

## 变更清单

| 序号 | 变更项 | 文件路径 | 说明 |
|------|--------|----------|------|
| 1 | 新增 DB 工作区同步服务 | `repos/service/src/services/dbMaterialsService.js` | 校验物料 ID，清空并复制已选目录到 `workspaces-ops-db/{user}` |
| 2 | 新增同步接口 | `repos/service/src/routes/db.js` | `POST /api/db/workspace/sync` |
| 3 | 前端接入同步 | `repos/app/src/services/db.ts`、`repos/app/src/pages/DbPage.tsx` | 页面加载、刷新和勾选变化后调用同步接口 |

## 测试计划

- 前端 `npm run build`。
- 后端 `node --check`。
- 使用临时 Harness 目录调用 service 方法，验证只复制已选目录、取消勾选会清理旧目录。
