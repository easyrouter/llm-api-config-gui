# SeedRouter API Setup — a GUI for Codex and Claude Code configuration

[简体中文](README.md) · [Quick start](docs/QUICKSTART.md) · [Downloads](https://github.com/easyrouter/llm-api-tutorial/releases) · [SeedRouter](https://seedrouter.net/?utm_source=github&utm_medium=readme&utm_campaign=llm-api-tutorial)

SeedRouter API Setup helps you change the API endpoint, key, and model for Codex and Claude Code. If your tools are already installed, go straight to configuration. If you are starting from scratch, check your environment and install missing components first. The app previews changes before applying them. It also backs up the existing Codex configuration before writing it.

> This README describes the current source. The new **Configure API now** shortcut has not yet shipped in an installer. Existing v0.2.0 builds use the full guided flow. Read the release notes before downloading; unsigned builds are not signed or notarized releases.

## Choose your path

| Need                         | Workflow                                                                                       |
| ---------------------------- | ---------------------------------------------------------------------------------------------- |
| Change an existing API setup | Choose tools → **Configure API now** → edit Base URL / model / API key → test → confirm import |
| Set up a new machine         | Environment check → approved installation → configuration → verification                       |
| Configure without CC Switch  | Expand manual configuration; Codex supports preview, backup, apply and restore                 |
| Diagnose a failure           | Check URL rules, credentials, model access and connectivity; review the diagnosis              |

Windows and macOS; English and Simplified Chinese. The assistant supports custom compatible providers, not only SeedRouter. Quick setup skips environment and installation checks rather than marking them as passed.

## SeedRouter endpoint reference

| Client                    | Base URL                    | Protocol           |
| ------------------------- | --------------------------- | ------------------ |
| Codex CLI / Codex desktop | `https://seedrouter.net/v1` | Responses          |
| Claude Code               | `https://seedrouter.net`    | Anthropic Messages |

Use your provider's actual model list. The bundled model preset is not a promise of access. Claude Code appends `/v1/messages`; do not paste a full request endpoint into its Base URL.

## Security boundaries

- No API keys in this assistant's persistent browser storage or telemetry.
- A connection test sends the key to the endpoint you choose and may incur usage charges.
- Copying a configuration can put the key on the clipboard. Clipboard history or sync may retain it.
- Confirmed Codex apply may save the key in `config.toml`; backups may also contain credentials.
- CC Switch handles its own confirmed import and persistence. This app does not directly write Claude or CC Switch configuration.
- No silent system environment or PATH changes. Repairs require a preview and confirmation.

See [SECURITY](SECURITY.md) before sharing logs or backups.

## Sponsorship

[SeedRouter](https://seedrouter.net/?utm_source=github&utm_medium=readme&utm_campaign=llm-api-tutorial) sponsors this project and supplies the default API preset. Visit the website to create an API key and check available models and pricing. You can also switch to another compatible provider. The software is open source under Apache-2.0. Your chosen provider decides whether and how they charge for API calls.

[SeedRouter integration docs](https://seedrouter.net/doc/). This project is not an official OpenAI or Anthropic client and does not imply their endorsement.

## Guides

- [Quick start](docs/QUICKSTART.md) (Chinese, with endpoint and workflow reference)
- [Codex custom API configuration](docs/guides/codex-api-config.md)
- [Claude Code gateway configuration](docs/guides/claude-code-api-config.md)
- [Base URL, API key and model explained](docs/guides/base-url-api-key.md)
- [Troubleshooting 401 / 403 / 404 / 429](docs/TROUBLESHOOTING.md)

## Development

Node.js ≥ 20, stable Rust and your platform's Tauri prerequisites are required.

```bash
git clone https://github.com/easyrouter/llm-api-tutorial.git
cd llm-api-tutorial
npm ci
npm run tauri dev
```

Run `npm run check` for the full gate, `npm run docs:check` for documentation checks, and `npm run build` for the frontend production build. A frontend build is not a desktop installer.

[Architecture](docs/ARCHITECTURE.md) · [Development](docs/DEVELOPMENT.md) · [Contributing](CONTRIBUTING.md) · [Releases and signing](docs/RELEASE.md) · [Changelog](CHANGELOG.md)

## License and feedback

[Apache-2.0](LICENSE), with attribution in [NOTICE](NOTICE). Report reproducible issues through [GitHub Issues](https://github.com/easyrouter/llm-api-tutorial/issues); never include real API keys or unredacted configurations.
