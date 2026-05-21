# 测试记录

## 验证命令

```bash
cd repos/app && npm run build
cd repos/app && npm run lint
cd repos/service && npm run dev
curl -s http://localhost:3100/api/workspace
curl -s http://localhost:3100/api/task
curl -s -X POST http://localhost:3100/api/task/messages -H 'Content-Type: application/json' -d '{"role":"user","author":"PM","body":"本地 JSON 持久化验证消息"}'
curl -s -H 'Origin: http://127.0.0.1:5174' -I http://localhost:3100/api/workspace
```

## 结果

- 前端 build：通过。
- 前端 lint：通过。
- service 启动：通过，监听 `3100`。
- `/api/workspace`：通过。
- `/api/task`：通过。
- `/api/task/messages` 写入：通过，验证后已清理测试消息。
- CORS：通过，确认 `http://127.0.0.1:5174` 可访问 service。

## 备注

- 前端开发服务当前运行在 `http://127.0.0.1:5174/`。
- service 当前运行在 `http://localhost:3100/`。
- `npm run build` 仍有 Vite chunk size 提示，不影响本次持久化能力。
