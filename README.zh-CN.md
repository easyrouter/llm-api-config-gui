# SeedRouter API 配置助手：Codex / Claude Code 图形化配置工具

[English](README.md) · [快速开始](docs/QUICKSTART.md) · [常见错误](docs/TROUBLESHOOTING.md) · [文档导航](docs/README.md) · [项目事实与限制](docs/PROJECT-FACTS.md) · [下载页面](https://github.com/easyrouter/seedrouter-api-setup/releases) · [SeedRouter 官网](https://seedrouter.net/?utm_source=github&utm_medium=readme&utm_campaign=seedrouter-api-setup)

SeedRouter API Setup 是一个开源桌面配置助手，支持 Windows 和 macOS 上的 Codex 与 Claude Code。你可以在图形界面中修改 Base URL、API Key 和模型。你可以预览配置并导入 CC Switch，也可以检查并应用 Codex 配置，同时保留备份。如果你已经安装了这些工具，可以直接开始配置。如果你是第一次使用，可以从环境检查和安装开始。

> **版本说明**：本 README 描述当前源码。新的「直接配置 API」入口尚未发布安装包；现有 v0.2.0 使用完整引导流程。下载前请阅读 Release 说明，未签名构建不等于已签名、公证的正式版。

## 适合谁使用

- 已装好 Codex CLI、Codex 客户端或 Claude Code，只想修改 Base URL、API Key 或模型。
- 第一次配置 AI 编程工具，不确定 Node.js、PATH 和 API 地址是否正确。
- 使用 SeedRouter 或其他兼容网关，需要先检查连接，再确认修改。

## 能做什么

| 场景                           | 操作                                           | 安全边界                                  |
| ------------------------------ | ---------------------------------------------- | ----------------------------------------- |
| 已安装，想换 API               | 「直接配置 API」→ 填写地址、模型、密钥         | 跳过安装，不假装环境已检查                |
| 新电脑首次使用                 | 「开始检查」→ 检查环境 → 按需安装              | 运行前展示命令，安装需要确认              |
| Codex / Claude Code 切换服务商 | 预览后交给 CC Switch 导入，再在 CC Switch 激活 | 不直接改写 CC Switch 数据库或 Claude 配置 |
| 不使用 CC Switch 的 Codex 用户 | 展开手动配置 → 预览 → 确认应用                 | 先备份 `config.toml`，可恢复最近备份      |
| API 无法连接                   | 连接测试、模型检查、错误诊断                   | 测试会联系所选服务商，可能产生用量费用    |

支持 Windows、macOS，提供简体中文和英文界面。保留自定义服务商，不强制使用 SeedRouter。工具内的模型预设不是可用性保证，应以服务商实时模型列表为准。

## 快速开始：四步配置 API

1. **准备工具**：从 [Releases](https://github.com/easyrouter/seedrouter-api-setup/releases) 查看构建说明，或按下方命令运行当前源码。
2. **选择入口**：已安装工具选择「直接配置 API」；首次使用选择「开始检查」。
3. **填写并测试**：填写 API Key，确认 Base URL 和模型，再主动运行连接测试。
4. **确认修改**：选择 CC Switch 导入，或展开 Codex 手动配置；完成后重新打开终端并验证。

完整步骤：[新手 API 配置指南](docs/QUICKSTART.md)。

### SeedRouter 的 Base URL 怎么填？

| 客户端                   | Base URL                    | 协议               |
| ------------------------ | --------------------------- | ------------------ |
| Codex CLI / Codex 客户端 | `https://seedrouter.net/v1` | Responses          |
| Claude Code              | `https://seedrouter.net`    | Anthropic Messages |

Claude Code 会追加 `/v1/messages`，不要把完整接口路径填进 Base URL。其他服务商可能有不同的路径前缀，优先遵循该服务商文档。

## 配置教程与故障排查

- [Codex API 配置：自定义 Base URL、API Key 与模型](docs/guides/codex-api-config.md)
- [Claude Code API 配置：Anthropic 网关与 CC Switch](docs/guides/claude-code-api-config.md)
- [Base URL、API Key 和模型名分别是什么？](docs/guides/base-url-api-key.md)
- [401、403、404、429 和连接失败排查](docs/TROUBLESHOOTING.md)
- [密钥、剪贴板、备份与安全边界](SECURITY.md)

## SeedRouter 与本项目的关系

SeedRouter 赞助了这个项目，并提供默认 API 预设。你可以在 https://seedrouter.net/ 创建 API Key，查看模型和价格，也可以使用其他兼容的服务商。这个配置工具按 Apache-2.0 许可证开源。API 调用与连接测试是否收费、如何计费，由你选择的服务商决定。

[获取 SeedRouter API Key](https://seedrouter.net/?utm_source=github&utm_medium=readme&utm_campaign=seedrouter-api-setup) · [接入文档](https://seedrouter.net/doc/)

## 本地运行与开发

需要 Node.js ≥ 20、Rust stable 和对应系统的 Tauri 构建依赖。只想使用软件的用户不需要安装开发环境；请先查看下载页面的构建说明。

```bash
git clone https://github.com/easyrouter/seedrouter-api-setup.git
cd seedrouter-api-setup
npm ci
npm run tauri dev
```

```bash
npm run check       # 格式、类型、翻译、前端与 Rust 检查
npm run docs:check  # 本地 Markdown 链接与文档结构
npm run build      # 前端生产构建；不等于桌面安装包
```

| 开发资料        | 入口                                 |
| --------------- | ------------------------------------ |
| 架构和 IPC 协议 | [ARCHITECTURE](docs/ARCHITECTURE.md) |
| 开发环境        | [DEVELOPMENT](docs/DEVELOPMENT.md)   |
| 贡献方式        | [CONTRIBUTING](CONTRIBUTING.md)      |
| 架构决策        | [ADRs](docs/adr/)                    |
| 发布与签名      | [RELEASE](docs/RELEASE.md)           |
| 更新记录        | [CHANGELOG](CHANGELOG.md)            |

## 常见问题

### 可以不用编辑 TOML 就修改 Codex API 吗？

可以使用图形界面的导入流程，或展开 Codex 配置模板、审阅预览后确认应用。应用前会备份原文件；这不是任意 TOML 的无损合并。

### Claude Code 的配置会被直接改写吗？

不会。本工具提供值和导入预览，CC Switch 在用户确认后执行自己的配置写入。也可以按教程手动配置。

### 必须使用 SeedRouter 吗？

不必。它是赞助方和默认预设；可以更换为支持客户端所需协议的服务商，并使用对应的地址、Key 和模型。

### 与 CC Switch 有什么区别？

本工具负责新手引导、环境检查、配置预览和诊断。CC Switch 是独立的服务商配置管理工具，本项目不会将它重新包装为自有功能。

### 新入口已经有安装包了吗？

当前源码已有快捷入口，现有 v0.2.0 安装包仍使用完整流程。仓库更名不等于新版发布，下载前查看 Release 说明。

## 反馈与参与

通过 [GitHub Issues](https://github.com/easyrouter/seedrouter-api-setup/issues) 提交复现步骤，请勿上传 API Key、完整配置文件或含个人信息的日志。欢迎修正文档、补充测试和分享实际配置经验。

本项目不是 OpenAI 或 Anthropic 的官方客户端，不代表它们提供支持或背书。

## 许可证

[Apache License 2.0](LICENSE)。原项目归属与第三方声明见 [NOTICE](NOTICE)。
