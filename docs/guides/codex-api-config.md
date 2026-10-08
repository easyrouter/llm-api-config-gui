# Codex API 配置：修改 Base URL、API Key 和模型

[English](../en/guides/codex-api-config.md)
[快速开始](../QUICKSTART.md) · [Claude Code 配置](claude-code-api-config.md) · [故障排查](../TROUBLESHOOTING.md)

## 需要填写哪些值？

| 字段     | SeedRouter 示例             | 注意事项                                     |
| -------- | --------------------------- | -------------------------------------------- |
| Base URL | `https://seedrouter.net/v1` | 不要追加 `/responses` 或 `/chat/completions` |
| API Key  | 从服务商控制台获取          | 不要使用其他平台或 ChatGPT 登录凭据代替      |
| Model    | 该 Key 实际可用的模型 ID    | 不要把显示名称当作模型 ID                    |
| Protocol | Responses                   | 网关需支持客户端使用的协议与功能             |

模型可用性和价格以 [SeedRouter 控制台入口](https://seedrouter.net/?utm_source=github&utm_medium=guide&utm_campaign=seedrouter-api-setup) 为准，本文不固定推荐易变化的模型名。

## 方式一：通过 CC Switch 导入

1. 在配置助手中选择 Codex。
2. 核对地址和模型，填写 API Key，按需测试连接。
3. 预览导入信息，确认打开 CC Switch。
4. 在 CC Switch 完成导入并激活。导入后检查 CC Switch 最终写入的配置。
5. 重启 Codex CLI 或桌面客户端并验证。

## 方式二：由配置助手安全应用 config.toml

1. 展开手动配置区域。
2. 检查生成的配置模板，不要盲目修改上下文窗口和压缩参数。
3. 点击应用，检查对话框中的目标文件、脱敏内容和备份提示。
4. 确认后写入；已有文件会先备份，可通过恢复操作回退。

默认用户级路径是 `~/.codex/config.toml`；Windows 通常位于 `%USERPROFILE%\.codex\config.toml`。实际路径以应用预览为准。若启用了自定义 `CODEX_HOME`、项目级覆盖或企业托管配置，应先核对配置优先级，不能仅凭文件写入成功判断生效。

**此功能应用的是配置模板，不是任意已有 TOML 的无损字段合并。** 保留需要的原有配置，仔细审阅预览。当前生成器可能将密钥写入 `experimental_bearer_token`；配置文件和备份都应按凭据保护，不要上传到 GitHub。

## 常见问题

### 改了配置仍然使用原来的服务商

重新打开客户端，检查当前激活的服务商、环境变量、项目配置以及 CC Switch 是否再次覆盖文件。不要同时用多个配置管理工具反复写同一个文件。

### 为什么列出模型成功，实际请求仍然失败？

模型列表接口、Responses 请求以及工具调用不一定具有相同的权限或协议支持。使用目标模型运行客户端验证，再查看具体状态码。

### ChatGPT 登录与 API Key 是一回事吗？

不是。完整配置选项中保留不同账号路径；使用第三方 API 时，应使用该服务商签发的 Key，并确认其独立计费方式。

## 参考资料

- [OpenAI Codex 高级配置](https://developers.openai.com/codex/config-advanced/)
- [SeedRouter 接入文档](https://seedrouter.net/doc/)
- [项目的配置写入边界](../adr/)

本文按本项目源码与上述资料整理，核对日期：2026-10-08。客户端版本和服务商能力变化时，以实时文档和实际验证为准。
