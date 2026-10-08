# Claude Code API configuration: Anthropic gateway, Base URL, and API key

[Quick start](../QUICKSTART.md) · [中文](../../guides/claude-code-api-config.md) · [Codex](codex-api-config.md)

## Does Claude Code use the same Base URL as Codex?

Not necessarily. Claude Code uses the Anthropic Messages protocol. An OpenAI-compatible endpoint alone does not establish Claude Code compatibility.

| Setting                             | SeedRouter example                                   |
| ----------------------------------- | ---------------------------------------------------- |
| Base URL                            | `https://seedrouter.net`                             |
| Request path appended by the client | `/v1/messages`                                       |
| API key                             | A provider-issued key with the required model access |
| Model                               | The actual ID of a model supported for Claude Code   |

For this SeedRouter preset, do not enter `https://seedrouter.net/v1` or a complete `/v1/messages` request URL as the Base URL. That can produce a duplicated path. Other gateways may require a different prefix; follow their documentation.

## How do you configure Claude Code through CC Switch?

1. Select Claude Code in the assistant.
2. Enter the provider's endpoint, model, and API key.
3. Check the destination before running a connection test.
4. Preview the import, then confirm opening CC Switch.
5. Confirm and activate the provider in CC Switch.
6. Restart your terminal, run `claude`, and verify the result.

LLM API Config GUI does not directly write `~/.claude` or the CC Switch database. CC Switch performs its own confirmed configuration changes.

## What should you check for manual configuration?

Claude Code gateway documentation uses `ANTHROPIC_BASE_URL` to select the gateway. Authentication depends on the gateway's requirements; common variables include `ANTHROPIC_AUTH_TOKEN` and `ANTHROPIC_API_KEY`.

Do not leave conflicting credentials set. Avoid putting real keys into shared terminals or commands retained in shell history. Follow your provider's current instructions and check whether an existing login or environment override still controls requests.

Changing only the endpoint does not establish the correct authentication or billing path.

## What causes 404, 401, or model-access errors?

- **404:** check for a duplicated `/v1` segment and confirm Anthropic Messages support.
- **401 / 403:** check the key's provider, validity, model permissions, and account restrictions.
- **Unknown model:** use the exact model ID available to that key, not just the assistant's preset.
- **Old settings remain active:** restart terminals and check environment overrides and activation in CC Switch.

See the [full troubleshooting checklist](../TROUBLESHOOTING.md). A connection test may incur API charges.

## Sources and scope

- [Claude Code documentation: other LLM gateways](https://code.claude.com/docs/en/llm-gateway)
- [SeedRouter documentation](https://seedrouter.net/doc/)

Reviewed on 2026-10-08. This project is not an official Anthropic client and does not promise compatibility with every gateway or Claude Code feature.
