# 实现摘要

- 新增 `repos/app/src/pages/DbPage.tsx`。
- 在 `repos/app/src/App.tsx` 增加 `/db` 路由与侧边菜单项。
- 新增 `repos/service/src/routes/db.js` 与 `repos/service/src/services/dbMaterialsService.js`，只读列出 `background/db` 下一级物料文件夹。
- 新增 `repos/app/src/services/db.ts`，供 DB 页面加载物料选择项。
- 更新 `conventions/frontend-structure.md`，登记 DB 页。
