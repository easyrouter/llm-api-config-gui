# LLM API Config GUI — Graphical API Configuration for Codex & Claude Code

**English** · [简体中文](README.zh-CN.md) · [Quick start](docs/en/QUICKSTART.md) · [Documentation](docs/README.md) · [Downloads](https://github.com/easyrouter/llm-api-config-gui/releases)

[![CI](https://github.com/easyrouter/llm-api-config-gui/actions/workflows/ci.yml/badge.svg)](https://github.com/easyrouter/llm-api-config-gui/actions/workflows/ci.yml)

LLM API Config GUI is an open-source desktop app for Windows and macOS. It sets up LLM APIs in Codex and Claude Code. You can use the interface to change the Base URL, API key, and model. Preview a CC Switch import, or review and apply a Codex configuration with a backup. If the tools are already installed, go straight to API setup. New users can start with an environment check and installation.

**Windows & macOS · English & 简体中文 · Apache-2.0 · Custom API providers supported**

> **Source vs installers:** the new **Configure API now** shortcut is in the current source, not in the existing v0.2.0 installers. Read each release's notes and signing status. This repository was previously named `llm-api-tutorial`; the rename does not publish a new installer.

## What can you configure?

| Task                                     | Workflow                                                                 | Boundary                                               |
| ---------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------ |
| Change Codex or Claude Code API settings | Edit Base URL, API key, and model in the GUI                             | Values must match your provider and protocol           |
| Skip setup on an existing machine        | Select tools → **Configure API now**                                     | Skipped checks are not reported as passed              |
| Set up a new machine                     | Environment check → reviewed installation → configuration → verification | Commands and changes require confirmation              |
| Import a provider into CC Switch         | Review a masked import preview, then open CC Switch                      | Confirm and activate separately in CC Switch           |
| Apply Codex config without CC Switch     | Expand manual setup → review → confirm apply                             | Backs up the existing file; not a lossless TOML merge  |
| Diagnose API errors                      | Connection checks and actionable diagnosis                               | Tests contact the selected provider and may cost money |

This is a **desktop API configuration assistant**, not an LLM API service, reverse proxy, chat client, or replacement for CC Switch. It does not directly edit Claude Code settings or the CC Switch database.

## Quick start

1. **Choose a version.** See [Releases](https://github.com/easyrouter/llm-api-config-gui/releases) for existing builds, or run the current source using the development commands below.
2. **Choose your path.** Select your tools. Use **Configure API now** if installed; use the full environment-check flow on a new machine.
3. **Enter and test settings.** Supply the matching Base URL, API key, and model. Verify the destination before sending credentials.
4. **Preview and confirm.** Import into CC Switch and activate there, or review and apply the Codex template. Restart the client and verify.

Detailed instructions: [API setup quick start](docs/en/QUICKSTART.md).

## Base URL reference for SeedRouter

| Client                    | Base URL                    | Protocol           |
| ------------------------- | --------------------------- | ------------------ |
| Codex CLI / Codex desktop | `https://seedrouter.net/v1` | Responses          |
| Claude Code               | `https://seedrouter.net`    | Anthropic Messages |

Claude Code appends `/v1/messages`; do not paste a full request path into its Base URL. Other gateways may require different prefixes. Use the actual model ID available to your key, not an assumed model name or the bundled preset alone.

## Configuration guides

| Question                                                     | Guide                                                                     |
| ------------------------------------------------------------ | ------------------------------------------------------------------------- |
| How do I change the Codex API Base URL, key, or model?       | [Codex API configuration](docs/en/guides/codex-api-config.md)             |
| How do I connect Claude Code to an Anthropic gateway?        | [Claude Code API configuration](docs/en/guides/claude-code-api-config.md) |
| What is the difference between Base URL, API key, and model? | [API configuration fields explained](docs/en/guides/base-url-api-key.md)  |
| Why do I get 401, 403, 404, 429, or a connection timeout?    | [API troubleshooting](docs/en/TROUBLESHOOTING.md)                         |
| What does this project support, and where is the evidence?   | [Project facts and limitations](docs/PROJECT-FACTS.md)                    |

Chinese versions are linked from each guide and the [documentation index](docs/README.md).

## API key safety

- No API keys in this assistant's persistent browser storage or telemetry.
- Connection tests send credentials to the entered gateway and may incur provider charges.
- Copying a generated configuration may put a key on the clipboard; history or sync may retain it.
- Confirmed Codex apply or CC Switch import may store keys in target configuration files and backups.
- Switching tool tabs clears the input state. It does not revoke keys or erase external copies.
- No silent PATH or environment changes; repairs have a separate preview and confirmation.

Read [SECURITY](SECURITY.md) before sharing logs, screenshots, or configuration files.

## Frequently asked questions

### Can I change Codex API settings without manually editing TOML?

Yes. Use the graphical import workflow, or review and explicitly apply the generated Codex template. The direct-apply path backs up the old file, but does not promise to preserve every custom setting through an automatic merge.

### Does the assistant directly modify Claude Code settings?

No. It supplies configuration values and an import preview. CC Switch handles its own confirmed changes. The documentation also describes manual gateway configuration.

### Do I have to use SeedRouter?

No. SeedRouter is the sponsor and default preset. You can use another provider that supports the selected client's protocol, with that provider's endpoint, key, and model.

### How is this different from CC Switch?

LLM API Config GUI focuses on guided onboarding, environment checks, configuration previews, and diagnosis. CC Switch is a separate provider-configuration manager. This assistant can hand an import to it; it does not claim CC Switch's capabilities as its own implementation.

### Does a successful connection test mean every client feature works?

No. It only proves that the tested request worked at that time. Model listing, Responses, Anthropic Messages, tool calling, and the user's complete workflow can have different requirements.

### Is this an official OpenAI or Anthropic tool?

No. It is an independent open-source project and does not imply endorsement by OpenAI or Anthropic.

## SeedRouter sponsorship

SeedRouter sponsors this project and provides its default API preset. You can create an API key and check models and pricing at https://seedrouter.net/, or use another compatible provider. The configuration tool is open source under Apache-2.0. Your provider sets the pricing for API usage, including connection tests.

[Get a SeedRouter API key](https://seedrouter.net/?utm_source=github&utm_medium=readme&utm_campaign=llm-api-config-gui) · [SeedRouter integration docs](https://seedrouter.net/doc/)

## Development

Node.js ≥ 20, stable Rust, and the platform's Tauri prerequisites are required. See [development setup](docs/DEVELOPMENT.md).

```bash
git clone https://github.com/easyrouter/llm-api-config-gui.git
cd llm-api-config-gui
npm ci
npm run tauri dev
```

```bash
npm run check       # Formatting, docs, lint, types, i18n, frontend and Rust tests
npm run docs:check  # Public documentation links, language navigation, and identity
npm run build      # Frontend production build, not a desktop installer
```

[Architecture](docs/ARCHITECTURE.md) · [Contributing](CONTRIBUTING.md) · [ADRs](docs/adr/) · [Release and signing](docs/RELEASE.md) · [Changelog](CHANGELOG.md)

## Feedback and license

Report reproducible setup issues with the [issue template](https://github.com/easyrouter/llm-api-config-gui/issues/new/choose). Never include real API keys or unredacted configuration files.

Licensed under [Apache-2.0](LICENSE). Attribution and third-party notices are preserved in [NOTICE](NOTICE).
