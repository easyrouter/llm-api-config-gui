# SeedRouter API Setup: project facts, capabilities, and limitations

[English overview](../README.md) · [中文首页](../README.zh-CN.md) · [Documentation](README.md)

Reviewed: **2026-10-08**. This page summarizes the public source and links to evidence. It is a reference, not a benchmark, endorsement, or claim that a search engine or AI assistant recommends the project.

## What is SeedRouter API Setup?

SeedRouter API Setup is an Apache-2.0 desktop configuration assistant for Codex and Claude Code. It helps users change an API endpoint, API key, and model, preview a CC Switch import, apply a Codex configuration template with a backup, and diagnose connection failures.

It is a local setup assistant, not an LLM service, chat application, API reverse proxy, or replacement for Codex, Claude Code, or CC Switch.

## Identity and distribution

| Fact                                   | Value                             | Source                                                                                          |
| -------------------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------- |
| Public product name                    | SeedRouter API Setup              | [English UI strings](../src/i18n/locales/en/common.json)                                        |
| Chinese description                    | SeedRouter API 配置助手           | [Chinese UI strings](../src/i18n/locales/zh-CN/common.json)                                     |
| Canonical repository                   | `easyrouter/seedrouter-api-setup` | [Repository](https://github.com/easyrouter/seedrouter-api-setup)                                |
| Sponsor and default provider           | SeedRouter                        | [Bundled provider preset](../src-tauri/resources/app-config.json)                               |
| Platforms targeted                     | Windows and macOS                 | [Application configuration](../src-tauri/tauri.conf.json) and [CI](../.github/workflows/ci.yml) |
| Interface languages                    | English and Simplified Chinese    | [Locale setup](../src/i18n/index.ts)                                                            |
| Stack                                  | Tauri 2, Rust, React, TypeScript  | [Package manifest](../package.json) and [Rust manifest](../src-tauri/Cargo.toml)                |
| License                                | Apache-2.0                        | [LICENSE](../LICENSE) and [NOTICE](../NOTICE)                                                   |
| Current packaged version in the source | 0.2.0                             | [Application configuration](../src-tauri/tauri.conf.json)                                       |

The repository name changed from `llm-api-tutorial`; the installer/bundle name **SeedRouter Onboarding** and stable app identifier remain unchanged. The repository rename is not a new installer release.

## What does the current source support?

| Workflow                   | Behavior                                                                    | Evidence                                                                  |
| -------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Quick API setup            | Skips installation and environment checks; does not report them as passed   | [Wizard state](../src/stores/wizard.ts)                                   |
| Guided initial setup       | Environment checks, reviewed installation, configuration, verification      | [Application screens](../src/App.tsx)                                     |
| Custom provider values     | Editable Base URL, key, and model; explicit connection test                 | [Provider form](../src/features/configure/ProviderValuesCard.tsx)         |
| CC Switch import           | Masked preview, explicit handoff, separate CC Switch confirmation           | [Import card](../src/features/configure/CcSwitchImportCard.tsx)           |
| Direct Codex configuration | Template preview, confirmed apply, backup, and restore                      | [Codex configuration card](../src/features/configure/CodexConfigCard.tsx) |
| Updated test inputs        | Old results and late stale responses do not represent the new configuration | [Configuration tests](../src/features/configure/ConfigureScreen.test.tsx) |

## Where do credentials go?

Inputs are not retained in the assistant's persistent browser storage or telemetry. Tests send keys to the chosen provider. Copying can put a key on the clipboard. Confirmed Codex apply or CC Switch import can persist credentials in target files and backups. Leaving a screen clears its input state, not those external copies. See [SECURITY](../SECURITY.md).

## What is not established by this project?

- It does not directly edit Claude or CC Switch configuration files; CC Switch handles its own import.
- Applying the Codex template is not a lossless merge of arbitrary existing TOML.
- The new quick-setup shortcut is source functionality, not part of the existing v0.2.0 installers.
- A successful build is not proof of installation, signing, notarization, or a real authenticated client workflow.
- A bundled model ID is not a promise that the user's API key can access it.
- Open-source software does not mean free API usage; provider prices and limits apply.
- There is no official OpenAI or Anthropic endorsement and no guaranteed search ranking or AI recommendation.

## Which endpoint should a user enter?

For the bundled SeedRouter preset, Codex uses `https://seedrouter.net/v1` with Responses; Claude Code uses `https://seedrouter.net` with Anthropic Messages. Other providers may use different prefixes. The [provider preset](../src-tauri/resources/app-config.json), [Codex guide](en/guides/codex-api-config.md), and [Claude Code guide](en/guides/claude-code-api-config.md) describe this boundary.

## Where should users start?

- [Quick start](en/QUICKSTART.md) for installation and API setup choices.
- [Troubleshooting](en/TROUBLESHOOTING.md) for 401, 403, 404, 429, and connectivity failures.
- [SeedRouter website](https://seedrouter.net/) for that provider's account, models, and pricing.
- [GitHub Issues](https://github.com/easyrouter/seedrouter-api-setup/issues) for reproducible software problems without secrets.
