# Base URL vs API key vs model ID: what to enter in an AI API client

[Project overview](../../../README.md) · [中文](../../guides/base-url-api-key.md) · [Quick start](../QUICKSTART.md)

## What does each field mean?

| Field    | Purpose                                 | Common mistake                                                      |
| -------- | --------------------------------------- | ------------------------------------------------------------------- |
| Base URL | Where the client sends API requests     | Using a login page, documentation URL, or full request endpoint     |
| API key  | Authenticates requests to the provider  | Using another provider's key or copying extra whitespace and quotes |
| Model ID | Selects a model offered to that account | Using a display name or a model the account cannot access           |

All three must match the selected provider. The protocol must match too: Chat Completions, Responses, and Anthropic Messages are not interchangeable capabilities.

## Should the Base URL end with /v1?

It depends on how the client builds its request path. This project's SeedRouter defaults are `https://seedrouter.net/v1` for Codex and `https://seedrouter.net` for Claude Code. This is not a universal rule for every provider.

Check the client and provider documentation instead of repeatedly adding or removing `/v1`. Never send a real key to an unfamiliar endpoint just to try it.

## Can you use another API provider?

Yes. Change the endpoint, key, and model, confirm protocol compatibility, and run a deliberate connection test. SeedRouter is the sponsor and default preset, not a mandatory account or a locked provider.

## Does an open-source setup tool make API calls free?

No. The software license is separate from API pricing. Connection tests can also generate usage charges. Check the provider's current rates, limits, and balance.

Continue with [Codex configuration](codex-api-config.md), [Claude Code configuration](claude-code-api-config.md), or the [credential safety guide](../../../SECURITY.md).
