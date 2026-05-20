# 测试记录

## 验证项

- `projects/app`: `npm run build`
  - 结果：通过。
  - 备注：Vite 输出 chunk size warning，为既有包体积提示，不影响本次功能。
- `projects/service`: `node -c src/routes/task.js`
  - 结果：通过。
- 上传接口真实验证：
  - 使用临时 zip 调用 `POST /api/task/test1-mpc89zwi/raw-input?fileName=raw-upload-test.zip`。
  - 第一次返回 `uploaded`，原始 zip 写入代码区 `tmp/raw-upload-test.zip`，解包文件写入 `artifacts/task-test1-mpc89zwi/pm-raw/input/raw.txt`。
  - 第二次返回 `skipped`，同名解包文件跳过。
  - 验证结束后已删除临时测试文件。
