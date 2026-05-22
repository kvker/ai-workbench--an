# 实现记录

## 决策

- 后端 `document-region/open` 接口不再调用服务器本机的 `xdg-open/open/cmd start`，只负责准备需求工作区并返回路径。
- 前端点击“打开文档区”时，请求后端拿到 `path`，按 `VITE_DOCUMENT_REGION_BASE_URL`（默认 `http://172.16.4.81:8080/`）拼接 `folder` 参数，并用新标签页打开。
- 为降低浏览器拦截概率，确认点击时先打开 `about:blank` 新标签，请求成功后再跳转到目标文档区 URL。
- 2026-05-22 追加调整：点击“打开文档区”不再弹确认框，直接打开新标签并跳转文档区；失败时关闭预开的空白标签并展示错误提示。

## 变更文件

- `repos/service/src/routes/task.js`
- `repos/app/src/services/task.ts`
- `repos/app/src/pages/DemandDetailPage.tsx`
