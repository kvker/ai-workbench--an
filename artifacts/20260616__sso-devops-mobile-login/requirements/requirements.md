# SSO 接入 DevOps 手机号登录需求文档

## 背景与目标

SSO 回调已能获取 qingtian 用户信息。此前 DevOps 登录态由临时 mock 映射生成；现在 devops 已提供 `POST /user/loginByMobile`，需要改为按 qingtian 手机号调用远程 devops 接口获取真实 `UserLoginInfoVO`。

## 验收标准 (AC)

- [x] AC1: 从 devops Java 工程确认 `POST /user/loginByMobile` 存在，且请求体为 `{ "mobile": "<手机号>" }`。
- [x] AC2: SSO 登录流程获取 qingtian 用户后，使用 qingtian `mobile` 调用远程 devops `loginByMobile`。
- [x] AC3: 前端保存远程 devops 返回的 `UserLoginInfoVO` 到 `ai-workbench:login-user`。
- [x] AC4: 移除 service 旧 `/api/mock/sso` 路由和前端调用。
- [x] AC5: 不调用本地 devops 工程接口；远程 devops 地址通过 service `DEVOPS_API_BASE_URL` 解析。
- [x] AC6: mock 与待接入事项文档同步标记旧 DevOps 映射 mock 已替换。

## 范围

### 包含

- service SSO 路由新增远程 DevOps 手机号登录调用。
- 前端 SSO 登录第二步调用地址切换。
- 删除旧 service mock 路由。
- 更新 AI Native 任务文档与 mock 登记。

### 不包含

- 修改 `/Users/zweizhao/project/current/devops-service` Java 工程。
- 启动本地 service 或 devops 服务做运行态联调。

## 依赖

- 远程 devops 服务已部署 `POST /user/loginByMobile`。
- service 运行环境正确配置 `DEVOPS_API_BASE_URL`，未配置时使用现有默认远程地址。

## 涉及模块

- 前端认证服务。
- service SSO 编排路由。
- AI Native mock 与待办登记。

## 开放问题

- 无代码阻塞项；真实全链路需要人工用有效 SSO 回调验证。
