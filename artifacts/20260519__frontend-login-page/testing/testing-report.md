# 测试记录

## 执行命令

```bash
npm run build
npm run lint
npm run dev -- --host 127.0.0.1
```

## 结果

- `npm run build`：通过。
- `npm run lint`：通过。
- 浏览器检查：访问 `http://127.0.0.1:5174/demands` 会跳转到 `/login`。
- 浏览器检查：登录页桌面视口显示正常。
- 浏览器检查：登录页 390x844 移动视口显示正常，无明显文字溢出或控件重叠。
- 401 处理：公共 `http.request` 已在 HTTP 状态码为 `401` 时清理本地登录态，弹出确认框，并在用户确认后跳转 `/login`。

## 注意

- 构建存在 Vite chunk size 提醒，属于现有依赖体积提示，不影响本次登录功能。
- 未使用用户提供的真实账号密码进行在线登录验证。
