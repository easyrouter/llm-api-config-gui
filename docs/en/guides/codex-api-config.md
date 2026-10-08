# Codex API configuration: custom Base URL, API key, and model

[Quick start](../QUICKSTART.md) · [中文](../../guides/codex-api-config.md) · [Claude Code](claude-code-api-config.md)

## Which values does Codex need?

| Field    | SeedRouter example                   | Check before saving                                                    |
| -------- | ------------------------------------ | ---------------------------------------------------------------------- |
| Base URL | `https://seedrouter.net/v1`          | Do not append `/responses` or `/chat/completions`                      |
| API key  | A key issued by your chosen provider | Do not substitute another provider's key or a ChatGPT login credential |
| Model    | A model ID available to that key     | A marketing name is not necessarily an API model ID                    |
| Protocol | Responses                            | The gateway must support the protocol and client features you use      |

Check the provider's live model catalog rather than treating this assistant's bundled preset as a guarantee of access. [SeedRouter documentation](https://seedrouter.net/doc/) describes its current integration options.

## How do you change the Codex API without editing TOML manually?

1. Select Codex in SeedRouter API Setup.
2. Enter the endpoint, API key, and model; optionally test the connection.
3. Preview the CC Switch import and confirm opening CC Switch.
4. Confirm and activate the provider there.
5. Restart Codex and verify the result.

The assistant and CC Switch are separate applications. Sending an import does not confirm that CC Switch saved or activated it.

## How do you apply config.toml directly?

Expand the manual configuration section, review the generated template, and choose the apply action. The confirmation dialog shows the destination and a masked preview. Existing files are backed up before a confirmed write; the restore action can restore the previous backup.

**This applies a template, not a lossless field-by-field merge of any existing configuration.** Preserve custom settings you need and review differences before confirming.

The default user file is `~/.codex/config.toml`; on Windows it is usually `%USERPROFILE%\.codex\config.toml`. Use the path shown by the assistant as the actual write destination. A custom `CODEX_HOME`, project-level settings, or managed configuration can change what the client reads.

The current template can store the key in `experimental_bearer_token`. Protect the configuration and backups as credentials. Do not commit them or paste them into public issues.

## Why might Codex still use the previous provider?

Check the activated CC Switch profile, restart the client, and inspect environment or project overrides. Avoid multiple configuration managers repeatedly overwriting the same file.

## Why can the model list work while an actual request fails?

Model-list access, Responses support, model permissions, and tool calling are different capabilities. Test the target model through the client, then use the [error checklist](../TROUBLESHOOTING.md).

## Is a ChatGPT login the same as an API key?

No. The full configuration view retains different account paths. A third-party API requires that provider's credentials and has its own usage and billing rules.

## Sources and scope

- [OpenAI Codex advanced configuration](https://developers.openai.com/codex/config-advanced/)
- [SeedRouter integration documentation](https://seedrouter.net/doc/)
- [Project configuration and recovery decisions](../../adr/)

Reviewed against the project source and linked documentation on 2026-10-08. This is not an official OpenAI guide; client versions and provider capabilities may change.
