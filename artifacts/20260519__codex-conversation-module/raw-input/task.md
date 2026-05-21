# 原始输入

用户希望开始实现前面讨论的大功能：

- 对话区需要自定义一个 Codex 的对话模块，参考 https://developers.openai.com/codex/app-server。
- 前端和 service 都封装成独立模块，提供标准入参。
- 分析并使用可环境变量配置的参数。
- 未来运行在沙盒中，所以默认最高权限。
- 默认模型是 `gpt-5.5`。
- 前端 base url 端口是 `3100`，也就是当前启动的 service。
- workspace root 先使用用户本机路径 `/Users/zweizhao/project/current`，但需要可配置。
- 已创建 `repos/app/.env.example` 和 `repos/service/.env.example`。

用户明确要求使用 `/an-task` 开始实现。
