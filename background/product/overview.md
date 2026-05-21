# 产品概述

## 产品名称

AI 工作台

## 产品定位

开发一个 AI 工作台，协同打通传统产研的业务流程 AI 化。

来源：用户在 `/an-init` 中明确输入。

## 目标用户

产品经理与研发测试。

来源：用户在 `/an-init` 中明确输入。

## 技术架构

- `repos/app` 是 Web 用户操作端，基于 React 19、TypeScript 和 Vite。
- `repos/service` 是服务端，基于 Node.js 和 Express 5，主要承担 Linux 原生功能服务。
- 前后端具体接口契约：待确认。

来源：`repos/app/package.json`、`repos/app/AGENTS.md`、`repos/service/package.json`、`repos/service/AGENTS.md`、用户在 `/an-init` 中明确输入。
