# Claude Code API 配置：Base URL、API Key 与 Anthropic 网关

[快速开始](../QUICKSTART.md) · [Codex 配置](codex-api-config.md) · [故障排查](../TROUBLESHOOTING.md)

## 与 Codex 配置有什么不同？

Claude Code 使用 Anthropic Messages 协议，不是把 OpenAI 兼容地址原样复制过去就能工作。

| 配置项   | SeedRouter 示例                        |
| -------- | -------------------------------------- |
| Base URL | `https://seedrouter.net`               |
| 请求接口 | 客户端追加 `/v1/messages`              |
| API Key  | 该服务商签发且拥有目标模型权限的 Key   |
| 模型     | 控制台中支持 Claude Code 的实际模型 ID |

对 SeedRouter，不要把 `https://seedrouter.net/v1` 或完整 `/v1/messages` 填入 Claude Code 的 Base URL，否则可能形成重复路径。其他网关有自定义前缀时，按其文档设置。

## 推荐操作：图形化配置与 CC Switch 导入

1. 选择 Claude Code，进入「直接配置 API」或完整配置流程。
2. 填写地址、模型和 API Key。先核对地址归属，再主动测试。
3. 预览 CC Switch 导入信息并确认打开。
4. 在 CC Switch 中确认导入、激活该服务商。
5. 重新打开终端，运行 `claude` 并验证。

本工具不会直接改写 `~/.claude`。CC Switch 的导入和激活结果应在 CC Switch 内确认。

## 手动配置需要核对什么？

Claude Code 网关文档使用 `ANTHROPIC_BASE_URL` 指定网关地址，鉴权变量取决于网关要求，常见的是 `ANTHROPIC_AUTH_TOKEN` 或 `ANTHROPIC_API_KEY`。不要同时设置多个互相冲突的凭据，也不要在共享终端或会记录输入的命令历史中直接粘贴密钥。

优先使用服务商给出的当前 Claude Code 接入步骤。只修改地址但保留旧服务商或订阅的凭据，可能造成鉴权失败或非预期路由。

## 404、401 或模型不可用怎么办？

- **404**：检查是否重复追加 `/v1`，以及网关是否提供 Anthropic Messages 接口。
- **401 / 403**：核对 Key 所属服务商、有效期、模型权限和账户限制。
- **模型不可用**：核对模型 ID，不要仅凭软件预设判断权限。
- **终端仍读取旧值**：退出旧终端，检查环境变量覆盖和激活状态。

详见 [API 故障排查](../TROUBLESHOOTING.md)。

## 参考资料

- [Claude Code 官方网关说明](https://code.claude.com/docs/en/llm-gateway)
- [SeedRouter 文档](https://seedrouter.net/doc/)

核对日期：2026-10-08；不承诺所有网关都支持所有 Claude Code 功能。
