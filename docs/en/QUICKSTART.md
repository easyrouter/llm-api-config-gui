# Quick start: change the API configuration for Codex or Claude Code

[Project overview](../../README.md) · [中文](../QUICKSTART.md) · [Troubleshooting](TROUBLESHOOTING.md)

## What do you need?

- Codex or Claude Code, depending on the client you want to configure.
- A Base URL, API key, and model ID from the same provider.
- CC Switch if you want to use the import workflow. Codex also has a separate preview, backup, and apply workflow.

For SeedRouter, start at [seedrouter.net](https://seedrouter.net/?utm_source=github&utm_medium=guide&utm_campaign=seedrouter-api-setup) and check the current model catalog and pricing. You can use another compatible provider; its address, credentials, and model access must match.

## Already installed? Use quick API setup

The **Configure API now** shortcut is available in the current source. Existing v0.2.0 installers use the full onboarding flow; check the [release notes](https://github.com/easyrouter/seedrouter-api-setup/releases) before downloading.

1. Select Codex, Claude Code, or both on the welcome screen.
2. Choose **Configure API now**. This skips environment checks and installation; it does not mark either as passed.
3. Enter the Base URL, model ID, and API key. Check the destination before sending any credentials.
4. Run **Test connectivity** if you want to check the connection. This contacts the selected provider and may incur usage charges.
5. Preview the CC Switch import and confirm opening CC Switch.
6. Confirm the import and activate the provider inside CC Switch. A successful handoff from this assistant is not proof that activation succeeded.
7. Restart your terminal or client, then complete verification.

## New machine? Start with the environment check

Choose the full setup path. Review detected dependencies and the commands shown before approving installation. If a required component is skipped, later client verification may fail.

If quick setup reports a missing client or CC Switch, choose **Check environment first** to return to the complete flow.

## Can you configure without CC Switch?

- **Codex:** expand manual configuration, review the generated template, target path, and backup notice, then explicitly confirm applying it. The template is not a lossless merge of arbitrary existing TOML.
- **Claude Code:** the assistant does not directly write Claude configuration. Use the [manual gateway guide](guides/claude-code-api-config.md) or CC Switch.

## What counts as successful setup?

| Result                     | What it proves                        | What to check next                               |
| -------------------------- | ------------------------------------- | ------------------------------------------------ |
| Connection check passed    | That test request worked at that time | The actual model and client workflow             |
| Import handed to CC Switch | The import link was opened            | Confirm and activate in CC Switch                |
| Codex file applied         | The target file was written           | Restart the client and verify effective settings |
| Client verification passed | The tested client operation worked    | Your own task with non-sensitive input           |

A successful model-list request is not proof that Responses, Anthropic Messages, or every tool-calling feature works.

## Where should you go next?

- [Codex Base URL and API key setup](guides/codex-api-config.md)
- [Claude Code gateway setup](guides/claude-code-api-config.md)
- [401, 403, 404, 429, and connection errors](TROUBLESHOOTING.md)
- [API key and backup safety](../../SECURITY.md)
