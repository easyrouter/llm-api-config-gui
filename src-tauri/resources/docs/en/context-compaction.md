# Context & auto-compaction

This page explains the "Context and automatic compaction" part of the "Codex config.toml template (recommended)" card on the [Configure](wizard://configure) page: what the context window is, when Codex compacts automatically, what the template writes, and what to watch out for in CC Switch. If you only use Claude Code, you can skip this page.

## The basics

- **Context window**: with every request, Codex sends the model its instruction files (such as `AGENTS.md`), the chat so far and command output. The most the model can hold at once is called the "context window". It is measured in tokens (the unit models use to count text).
- **Automatic compaction**: when the window is nearly full, Codex "compacts" automatically — it replaces older content with a hand-off summary, keeps the messages you sent most recently, and carries on working. Some of the older detail is lost.
- Automatic compaction is always on and **cannot be switched off**. All you can change is how big the window is and when compaction happens.

## Recommended setting: OpenAI default

The card uses "OpenAI default (recommended)" by default. With it, **the template writes no context settings at all**: `model_context_window`, `model_auto_compact_token_limit` and `model_auto_compact_token_limit_scope` are all left out. Codex then uses the defaults OpenAI set for `gpt-6-astra`, `gpt-6.1-sol` and `gpt-5.6-sol`:

- a context window of **272K** (272,000 tokens);
- automatic compaction at 90% of the window, about **245K**;
- compaction at 95%, about **258K**, at the latest — `/status` also shows this number as the window size;
- scope `total` (everything in the chat is counted).

Why it is recommended:

- **It is OpenAI's default.** OpenAI has not published any other recommended numbers. An OpenAI Codex team member said on social media that this default was carefully tuned for performance and cost (a personal post about GPT-5.6 Sol on the ChatGPT subscription, not official documentation).
- **Requests normally stay below 272K.** At OpenAI's list price, a request with more than 272K input tokens is charged more for the whole request: 2x for input and cache, 1.5x for output. How the service gateway bills such requests has not been confirmed yet. Codex checks usage before each turn but does not count the message you are about to send, so pasting a very long text into an already long chat can still push that one request (and the compaction right after it) past these numbers — before pasting a long log, type `/compact` first.
- **A bigger window costs more.** Every turn sends the context again. The bigger the window, the more each turn sends, so it costs more even when the price per token stays the same.
- **Least likely to exceed the service gateway's limit.** The service gateway has not published how long a request each of its routes actually accepts. This is the smallest window on offer, so it is the most likely to fit every route. A request that is too long may fail in a way that only a new chat can fix.
- **Nothing for CC Switch to lose.** Because the template writes none of these settings, CC Switch cannot lose them when you switch providers, or carry them over to another provider.

## Large window (appears only after IT turns it on)

Most people only see "OpenAI default (recommended)" on the card. "Large window (long tasks)" appears as a second option only after IT has confirmed that every route of the service gateway accepts longer requests and has turned it on in the company preset. It only appears for GPT-6 and GPT-5.6 models: for other models (such as `gpt-5.5`) Codex uses 272K at most, so writing more would have no effect. If you choose it, the template writes (if the card shows different numbers, go by the card):

```
model_context_window = 372000
model_auto_compact_token_limit = 300000
model_auto_compact_token_limit_scope = "total"
```

That is: a context window of **372K**, automatic compaction at **300K**, and compaction at about **353K** at the latest.

- **Good for**: one task that runs for a long time. It compacts less often, so you also spend less time waiting for compaction.
- **The trade-off**: every turn sends more, so it costs more; and at OpenAI's list price, requests above 272K input tokens are also charged more for the whole request. For how the service gateway bills this, go by what IT tells you.
- **If a long chat starts failing again and again** (for example with a message that the context is too long): go back to the "Configure" page, switch back to "OpenAI default (recommended)", click "Apply to Codex on this machine" again, and then start a new chat. Retrying in the chat that fails does not help.

## What each setting means

The template this tool writes contains at most the first three settings below, and only when "Large window" is chosen. The others are listed for people who edit `config.toml` themselves; normally just leave them unset.

### `model_context_window` (context window)

How much Codex assumes the model can hold at once, in tokens. If it is not set, Codex uses 272K. Codex treats only 95% of it as usable space and always compacts when it gets there. A larger value means fewer compactions but more cost per message — and it must never be larger than what the service gateway really accepts, or long chats will fail. However large you set it, Codex treats it as 872K at most for these models.

### `model_auto_compact_token_limit` (auto-compaction threshold)

When the chat reaches this many tokens, Codex compacts automatically. If it is not set, it is 90% of the window (about 245K by default). With scope `total`, a value above 90% still counts as only 90%. A lower value means more frequent compaction: each message is cheaper, but more detail is lost. Whatever you set, Codex always compacts once 95% of the window is used.

### `model_auto_compact_token_limit_scope` (what is counted)

- `total`: the default, and the only value this tool ever writes. Counts everything currently in the chat: system instructions, `AGENTS.md`, the last compaction summary and every message since. Codex compacts as soon as the number you set is reached — the most predictable behaviour.
- `body_after_prefix`: counts only what has been added since the "current stretch" of the chat began — from the start of the session, the last compaction or the moment you resumed the chat, including the first answer. What was carried in before (instructions, `AGENTS.md`, the previous summary) is not counted. It was designed for small "growth budgets"; with a large threshold it only postpones compaction until the window is about 95% full, which leaves very little room.

This setting has **nothing to do with prompt caching**, and it is not "more accurate". Earlier versions of this tool labelled `body_after_prefix` as "recommended" and explained it as "Counts only the conversation body after the cached prefix. More accurate with prompt caching …". That explanation was wrong and has been removed.

### `compact_prompt` / `experimental_compact_prompt_file` (how the summary is written)

The instructions Codex uses to write the compaction summary; they only apply to local compaction. The built-in version already asks for progress, decisions, constraints and next steps. Leave them unset — if the file you name is missing or empty, Codex will not start.

### `tool_output_token_limit` (limit per command output)

The most of one command's output that is kept in the chat; anything beyond that is cut out of the middle. Keep the default; raising it fills the context faster.

### `features.context_management.experimental_mode` (experimental feature)

The experimental "notes across context windows" feature announced with GPT-6 Astra. OpenAI's configuration documentation says it is not currently available. It also only works when you sign in with a paid ChatGPT account such as Plus or Pro and use OpenAI's own service directly — it can never work through the service gateway or with an API key. Do not turn it on.

## Local and remote compaction

Codex can compact in two ways. For a custom provider such as the service gateway, which one it uses depends mostly on the provider's name in `config.toml` (the `name` under `[model_providers.…]`):

- **Local compaction**: the same model writes a plain-text hand-off summary through the service gateway. This works with any service gateway, and it is what this tool's template uses.
- **Remote compaction**: used when the name is exactly `OpenAI` (upper and lower case must match) or `azure` (in any mix of upper and lower case), and also when the address is an Azure address (for example one containing `openai.azure.`, `azure-api.` or `azurefd.`). The result is a piece of encrypted data that a different upstream account may not be able to read — and the service gateway has several upstreams behind it. Whether the service gateway supports it has not been confirmed either, and there is no fallback if it fails.

So keep the provider name from the template (for example "Service Gateway") and do not change it to `OpenAI`. This tool never uses either of these names: even if you enter one of them under "Values to enter", both the generated template and "Import into CC Switch" automatically use a different name (the preview before the import shows the name that is actually sent).

## What to watch out for in CC Switch

All of the options below are on CC Switch's Codex tab, in the form where you edit a provider: "1M Context Window", "Enable remote compaction", "Apply Common Config" and "Edit Common Config" sit next to the "config.toml (TOML)" field, and "Model Mapping" is under "Advanced Options". The names are those of CC Switch v3.20.4; newer versions may word them slightly differently.

- **Do not tick "1M Context Window".** Ticking it writes `model_context_window = 1000000` and `model_auto_compact_token_limit = 900000`, which Codex treats as 872K: far above the recommended value, more expensive, and possibly more than the service gateway accepts. Unticking it removes both lines again.
- **Do not tick "Enable remote compaction".** CC Switch's own explanation is: "When enabled, the active model_providers entry name is written as OpenAI so Codex can try remote compaction." Through the service gateway, remote compaction can fail or leave a long chat unable to continue.
- **Keep context settings out of the common config.** The snippet in "Edit Common Config" is merged into every provider that has "Apply Common Config" ticked, and its values override the provider's own settings.
- **Switching providers rewrites `config.toml`.** When you switch to another provider in CC Switch, it usually rewrites `~/.codex/config.toml`; switching back usually restores it. If the card on the "Configure" page shows "differs from the template", just click "Apply to Codex on this machine" again.
- **A "Universal Provider" rewrites it from a fixed template.** If you use a CC Switch "Universal Provider" and it is the provider currently in use, CC Switch rewrites `config.toml` from its own fixed template on every "Sync to Apps" or "Save & Sync". After syncing, click "Apply to Codex on this machine" again.
- **Avoid adding "Model Mapping" rows.** If you really need one, enter `272000` in the "Context Window" column of every row (`372000` with the large window). With the recommended setting, leaving that column empty makes CC Switch tell Codex that the model's window is only 128K, so compaction happens much earlier. Mapping rows also stop the priority tier from working.

### Used an earlier version, or copied a config with 372000?

Earlier versions of this tool wrote `372000`, `300000` and `body_after_prefix` into `~/.codex/config.toml`, and some tutorials also use `372000`. That number comes from Codex's settings when GPT-5.6 Sol was first released; OpenAI has since corrected it to 272,000. CC Switch may have copied these settings into the provider's configuration or into the common config, and writes them back when you switch providers. To clean up:

1. in CC Switch, edit the Codex provider you are using and, in the "config.toml (TOML)" editor, delete the `model_context_window`, `model_auto_compact_token_limit` and `model_auto_compact_token_limit_scope` lines;
2. click "Edit Common Config", then check for the same lines there and delete them;
3. save;
4. back on this tool's "Configure" page, click "Apply to Codex on this machine" again. If the file on your machine still has these old settings, the card says so; applying replaces them with the settings of the strategy chosen on the card (by default that means removing them all).

## Good habits

These habits matter more than any number:

- **Start a new chat for each separate task** (a new chat in the Codex app or IDE extension, `/new` in the CLI). Codex itself warns that very long chats and repeated compactions make its answers less accurate.
- **Compact at natural milestones yourself**: type `/compact` when a feature is done or the tests pass, rather than waiting for automatic compaction to hit in the middle of a task. Do the same before pasting a long log into a long chat.
- **Check `/status`** for the remaining context (the CLI also shows the model and the provider). With the default settings the window shows about 258K; compaction before it runs out is normal.
- **Write the plan into a file**: keep plans, decisions and progress in a file in the repository (such as `PLAN.md` or `NOTES.md`) and ask Codex to keep it up to date. Compaction keeps only a summary; files are never lost.
- **Keep `AGENTS.md` short** (Codex reads at most 32 KiB), and turn off MCP servers and skills you do not use — they take up context in every message.
- **Use `/side` for quick side questions**, and `/fork` only when the work really branches.
- **Do not switch model, tools or sandbox mode in the middle of a long chat**: it invalidates the cache (more expensive) and can disturb compaction.
- **Start a new chat after changing settings**: after editing `config.toml` or switching providers in CC Switch, start a new chat; chats that are already open keep the old settings.

## Common questions

**Codex compacted before reaching the numbers above?**
That is normal. When Codex estimates usage, it sometimes also counts the model's earlier reasoning, so compaction can come noticeably before the numbers, sometimes tens of thousands of tokens early. People see the same thing on OpenAI's own service.

**After compaction, Codex seems to have "forgotten" things said earlier?**
Compaction keeps only a summary and your most recent messages, so some older detail is lost — that is simply how compaction works. Repeat the key requirements, or write them into a file (such as `PLAN.md`) for it to read; when the chat is already very long, start a new chat and paste in the key points.

**Codex keeps saying the context is too long, and the chat cannot continue?**
Start a new chat and paste in the key points; retrying in the old chat does not help. If you wrote `model_context_window` into `config.toml` yourself, or chose "Large window", go back to the "Configure" page, choose "OpenAI default (recommended)" and click "Apply to Codex on this machine" again — that removes these settings (if they are also in CC Switch, clean them up as described in "Used an earlier version" above). If it still happens, contact IT.

**When do changed settings take effect?**
As soon as you start a new chat; chats that are already open keep the old settings. If the model list or sign-in status in the Codex desktop app has not updated, quit the app completely (including the tray icon) and open it again.

**The Codex desktop app on Windows runs in WSL mode?**
Then it reads the `~/.codex/config.toml` inside WSL, not the Windows file this tool writes, so the settings described here do not affect it. Contact IT if you need help.

Sources: OpenAI's official documentation — [Codex configuration reference](https://learn.chatgpt.com/docs/config-file/config-reference), [Codex best practices](https://learn.chatgpt.com/docs/learn/best-practices), [GPT-6 Astra model and pricing](https://developers.openai.com/api/docs/models/gpt-6-astra).
