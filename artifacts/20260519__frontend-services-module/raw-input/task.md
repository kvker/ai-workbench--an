# 原始输入

用户希望初始化前端内的对接后端服务模块，放到 `services`。后端暂时不对接真实服务。最终方案收敛为：

- 不需要 adapters。
- 直接提供 `http.ts`，但里面先置空，作为未来真实 HTTP 请求入口。
- 具体业务数据在 `workspace` 和 `task` 里面 mock。
- 可以弄一个 `mock.json` 用来提取数据。
