# Security and API key handling / 密钥安全说明

## Credential lifecycle

- Typed API keys live in the active configuration or verification component's memory, not the assistant's persistent browser storage or telemetry.
- A user-triggered connection check transmits credentials to the entered gateway. Verify the destination before testing; use HTTPS and a limited-scope test key when possible.
- Copying a generated configuration can include the key. Clipboard managers and cross-device clipboard sync may retain it.
- Confirmed CC Switch import hands the key to the installed local application through its import URI. CC Switch controls subsequent storage. Treat the URI as a secret, even though the preview is masked.
- Confirmed Codex apply can write the key into `config.toml`. Automatic backups may contain old keys and other sensitive settings. Protect both files.
- Navigating away or switching tool tabs discards the assistant's input state; it does not revoke keys, erase the clipboard, or remove external configuration files.

## 修改和恢复边界

应用不会静默修改系统设置。Codex 模板应用会先显示预览，再按确认写入并备份；它不是任意配置的无损字段合并。Claude 和 CC Switch 的配置由用户或 CC Switch 管理。环境变量和 PATH 修复需单独预览、确认。

只下载可信来源的构建并查看签名状态。未签名或未经公证的构建不应被描述为正式可信发行版。

## Reporting / 报告问题

Do not open a public issue containing credentials, private paths, customer data, or exploit details. Use GitHub's private vulnerability reporting entry **if the repository has it enabled**; otherwise request a private reporting channel without posting sensitive material. No response-time SLA is promised.

如果已经泄露 Key，先在服务商控制台撤销或轮换，再清理公开内容。删除 Issue 或提交并不保证历史副本和缓存已被清除。

[返回首页](README.md) · [故障排查](docs/TROUBLESHOOTING.md)
