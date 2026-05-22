# 测试记录

## npm run build

- 目录：repos/app
- 结果：通过。
- 说明：Vite 输出部分 chunk 超过 500 kB 的体积警告，本次改动未引入新的构建失败。

## 追加验证

- 前端：npm run build，通过；仍有 Vite 既有 chunk 体积警告。
- 后端：timeout 2s node app.js，可正常启动并监听 3100。
- 残留检查：未找到切换身份、syncDemandIdentity、DemandIdentity、identity/sync、req.query.identity 等前后端调用残留。
