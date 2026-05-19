# 测试报告

## 测试用例

| 序号 | 用例 | 结果 | 备注 |
|------|------|------|------|
| 1 | `npm run build` | 通过 | TypeScript 与 Vite 构建成功 |
| 2 | `npm run lint` | 通过 | ESLint 无报错 |
| 3 | 浏览器打开 `http://127.0.0.1:5173/` | 通过 | 需求页可见，Tailwind 样式生效 |
| 4 | 点击切换到详情页 | 通过 | 流程区、当前产物、对话区和历史对话可见 |
| 5 | 点击切换到代码页 | 通过 | 资源管理器、编辑器、终端和变更面板可见 |
| 6 | 页面级布局指标检查 | 通过 | 桌面视口无 body/root/stage 页面级横向溢出 |
| 7 | 直接访问 `/demands` | 通过 | URL 对应需求页 |
| 8 | 直接访问 `/demands/customer-feedback-console` | 通过 | URL 对应详情页 |
| 9 | 点击导航进入 `/demands/customer-feedback-console/code` | 通过 | URL 变化并展示代码页 |
| 10 | computed style 检查 Tailwind 生效 | 通过 | stage 为 grid、圆角与溢出样式生效 |
| 11 | `npm run build` after antd | 通过 | 构建成功；antd 引入后出现 chunk size 警告 |
| 12 | `npm run lint` after antd | 通过 | ESLint 无报错 |
| 13 | antd DOM 检查 | 通过 | 详情页存在 `.ant-btn`、`.ant-tag`、`.ant-steps`；需求页存在 `.ant-input-affix-wrapper`、`.ant-badge` |
| 14 | 子代理 antd 检查 | 完成 | 确认依赖、Provider、layer 配置和 antd 组件使用；指出残留后已继续修正 |
| 15 | 代码页入口检查 | 通过 | “打开代码页”仅保留 `https://www.baidu.com/` 的 `_blank` 外链，无内部 `/code` 链接 |
| 16 | antd 残留修正后 DOM 检查 | 通过 | 详情页存在 Button/Tag/Steps/TextArea/FloatButton；需求页存在 Segmented/Input/Badge |
| 17 | 主题切换构建检查 | 通过 | `npm run build` 成功 |
| 18 | 主题切换 lint 检查 | 通过 | `npm run lint` 成功 |
| 19 | antd MCP 组件实践复核 | 通过 | Switch 用于二态切换，Segmented 用于单选筛选，Steps 用于流程步骤，Modal 用于当前页浮层信息，Button href 用于外链 |
| 20 | 默认亮色与导航清理 | 通过 | 默认 mode 为 `light`；右上角不再显示“需求页”“详情页”导航按钮 |

## 备注

- 浏览器截图在一次移动视口尝试中出现截图超时，未取得移动截图。
- 当前实现已使用响应式断点，窄屏下隐藏部分辅助栏并保留核心切换入口。
