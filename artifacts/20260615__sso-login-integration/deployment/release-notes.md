# SSO 登录集成发布说明

## 变更摘要

- 前端未登录入口改为跳转 SSO 登录页。
- 新增 `/auth/sign-in` 回调页，保存 qingtian 用户信息和现有 devops 登录态。
- service 新增临时 `/api/mock/sso`，后续可替换为真实 devops SSO 映射接口。

## 上线清单

- [x] 前端构建通过。
- [x] service 路由语法检查通过。
- [x] Mock 与待接入事项已登记。

## 回滚方案

- 将 `repos/app/src/App.tsx` 的 `/login` 路由和未登录跳转恢复到旧 `LoginPage`。
- 移除 `/auth/sign-in` 回调页和 `/api/mock/sso` 临时路由。
