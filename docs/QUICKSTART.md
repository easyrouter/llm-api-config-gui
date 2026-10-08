# 新手快速开始：修改 Codex 和 Claude Code 的 API 配置

[English](en/QUICKSTART.md)
[返回首页](../README.zh-CN.md) · [常见错误](TROUBLESHOOTING.md) · [English overview](../README.md)

## 开始前准备什么？

- 要使用的客户端：Codex 或 Claude Code。
- 同一个服务商提供的 Base URL、API Key、模型名。
- 若使用一键导入：先安装 CC Switch。没有安装时可回到「先检查环境」。

使用 SeedRouter 时，可从 [官网](https://seedrouter.net/?utm_source=github&utm_medium=guide&utm_campaign=seedrouter-api-setup) 创建 API Key 并查看模型。其他服务商的 Key 不能自动用于 SeedRouter，反之亦然。

## 已经装好工具，只想更换 API

此快捷入口属于当前源码，尚未包含在现有 v0.2.0 安装包中。

1. 在欢迎页选择本次要配置的工具。
2. 点击「直接配置 API」。此入口不安装软件，也不检查或修改系统环境。
3. 核对 Base URL、模型名，填写服务商提供的 API Key。使用其他服务商时，三者都要匹配。
4. 点击连接测试。请求会发送到所填地址，可能产生服务商用量费用；不确定地址来源时不要发送密钥。
5. 点击 CC Switch 导入按钮，检查脱敏预览，再确认打开 CC Switch。
6. 在 CC Switch 中确认导入并激活服务商。看到本工具的「已发送」提示只代表已交接，不代表客户端已经可用。
7. 关闭旧终端，打开新终端，到「验证」页面检查客户端。

## 没有安装过工具

选择「开始检查」，按环境检查、按需安装、配置、验证的顺序操作。安装前确认显示的命令和下载来源，不需要的组件可以跳过。若跳过必需组件，后面的验证可能失败。

## 不想使用 CC Switch

- **Codex**：展开「不用 CC Switch？展开手动配置与 Codex 安全应用」。检查模板、目标路径和备份提示，再确认应用。不要在不了解差异时覆盖已有定制配置。
- **Claude Code**：本工具不直接写入 Claude 配置。按照 [Claude Code 配置指南](guides/claude-code-api-config.md) 手动配置，或使用 CC Switch。

## 修改后怎么确认成功？

- 连接测试通过：只说明测试请求在当时成功，不保证所有模型和完整工作流可用。
- CC Switch 导入成功：还需在 CC Switch 激活对应服务商。
- Codex 文件写入成功：还需重启客户端，确认其读取了这份配置。
- 最后在目标客户端发送不含敏感信息的短请求。实际工作流通过后才算接入完成。

遇到错误先查 [故障排查](TROUBLESHOOTING.md)，不要公开粘贴密钥或整个配置文件。
