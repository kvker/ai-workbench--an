# 实现记录

## 决策

- 采用 L1 快速修复，仅保存 raw-input、实现记录和测试记录。
- 上传接口使用 `application/zip` / `application/octet-stream` 原始请求体，避免为单文件上传新增 multipart 依赖。
- 原始 zip 保存在 `{workspacePath}/tmp/`，同名直接覆盖。
- zip 解包后的文件写入 `{workspacePath}/artifacts/{branchName}/pm-raw/input/`，其中 `branchName` 形如 `task-[hash]`。
- 解包文件默认已存在同名文件时跳过；通过请求体 query 参数 `overwriteFiles` 预留可覆盖文件列表配置，未来可由前端暴露更细控制。
- “打开文档区”当前用本机 open/xdg-open/cmd 打开 artifacts 目录，并在代码中注释说明最终应切换为 vscode-server 协议打开指定文件夹。
