# 测试报告

## 验证命令

- `npm run build`
- `npm run lint`
- `node --check app.js && find src -name '*.js' -not -path '*/node_modules/*' -print0 | xargs -0 -n1 node --check`
- `node - <<'NODE' ... listDbMaterials() ... NODE`
- Browser 验证 `http://localhost:5174/db`

## 结果

- `npm run build`：通过。
- `npm run lint`：通过。
- service JS 语法检查：通过。
- `listDbMaterials()`：当前 `background/db` 不存在时返回 `missing: true` 与空 materials。
- Browser 验证：`/db` 展示 `未找到 background/db`，生成按钮在未选择物料时禁用。

## 说明

- 构建输出存在既有 Vite chunk size warning，不影响本次功能通过。
- `background/db` 当前不存在，页面以目录约定和空状态提示限定物料范围，未新增 mock 数据。
