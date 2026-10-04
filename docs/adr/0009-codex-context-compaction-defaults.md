# ADR-0009: Codex context window and auto-compaction follow OpenAI's defaults

- Status: accepted
- Date: 2026-10-04
- Supersedes in part: the context lines of the PM's `config.toml` template (Q-M1, internal
  `OPEN_QUESTIONS.md`): `model_context_window = 372000`, `model_auto_compact_token_limit =
300000`, `model_auto_compact_token_limit_scope = "body_after_prefix"` (UI label "recommended").
  The rest of that template — provider table, `service_tier`, model, reasoning effort — is
  unchanged by this ADR.
- Related: ADR-0003 (never write `~/.cc-switch`), ADR-0006 (CC Switch deep-link import),
  ADR-0008 (the `config.toml` write), hard rules 1, 4 and 5

## Context

The Codex card wrote a 372K window, compaction at 300K, scope `body_after_prefix`, and told users
that this scope "only counts the conversation body after the cached prefix", is "more accurate
together with prompt caching" and is the recommended choice. We checked that against OpenAI's
documentation, the Codex source at `rust-v0.160.0` (the latest stable release, also the core of
desktop app 26.930), the CC Switch source at v3.20.4 and the gateway's public endpoints. Claims
were checked independently against primary sources before being relied on. Findings:

- **OpenAI publishes no recommended numbers.** The config reference describes the three keys and
  says scope `total` is the default; the config sample says "When unset, Codex uses model or
  preset defaults". Codex's bundled catalog gives `gpt-6-astra`, `gpt-6.1-sol` and `gpt-5.6-sol`
  a 272,000-token window (`max_context_window` 872,000, no per-model compaction limit), so with no
  key written Codex compacts at 90 % = 244,800 and forces compaction at 95 % = 258,400 in every
  scope (`openai_models.rs`, `context_window.rs`). OpenAI Codex staff describe that default as
  tuned for performance and cost (personal posts on X, about GPT-5.6 Sol — not documentation).
- **372,000 is not a GPT-6 value.** It was GPT-5.6 Sol's launch window in Codex 0.144.0; OpenAI
  "corrected their context windows to 272,000 tokens" in 0.144.6. The 300,000 limit has no
  external source.
- **`body_after_prefix` was explained wrongly.** Its "prefix" is the input of the first request
  of the current compaction window (instructions, AGENTS.md, the carried summary — set again after
  every compaction or resume), not the prompt-cache prefix; Codex never reads cached-token counts
  there. It exists for small "growth since compaction" budgets (PR #22870). With a 300K limit on a
  372K window it moves compaction to the 95 % hard cap (~353K), leaving ~18K of headroom.
- **Above 272K input, OpenAI's list price charges the whole request 2x input / 1.5x output.** The
  gateway publishes flat per-token prices today, but every turn re-sends the context, so a larger
  window costs more per turn regardless.
- **An over-long request through the gateway can be unrecoverable.** Codex 0.160 recognises
  `context_length_exceeded` only inside a streamed `response.failed`; a synchronous HTTP 400 —
  which stock new-api (the gateway's code base) returns when an upstream rejects a request before
  streaming — becomes a generic error, and the thread cannot be compacted back below the limit.
  The gateway's real per-route input limit is not published, and how it reports an over-long
  request has not been tested.
- **Compaction mode depends on the provider's display name.** Exactly `OpenAI` (or `azure`, or
  an Azure base URL) switches Codex to remote compaction: an encrypted item only the upstream
  account that created it can read, with no local fallback. Any other name gets local compaction
  (a plain-text hand-off summary through the normal Responses endpoint), which works through any
  gateway. CC Switch's "Enable remote compaction" checkbox renames the provider to `OpenAI`; its
  "1M Context Window" checkbox writes 1,000,000 / 900,000, which Codex clamps to 872,000.
- **CC Switch v3.20.4 rebuilds `config.toml` from its own database** on every provider switch,
  after copying the live file back into the outgoing provider; its shared "common config"
  snippet can pick up keys we write and apply them to other providers. Keys we do not write
  cannot be lost or spread that way.

## Decision

1. **Default strategy `openai_default`: the template writes none of the three context keys.**
   Codex uses the model's catalog window (272K) and compacts at 90 % (≈245K), forced at 95 %
   (≈258K). Requests normally stay below 272K — Codex's pre-turn check does not count the incoming
   message (`turn.rs:179-182`), so a very large paste near the trigger can push one request, and
   the compaction after it, over — and the smallest window is the most likely to fit every gateway
   route.
2. **Optional strategy `large_window`, off by default.** `gateway.codexLargeContext` in
   `app-config.json` (`enabled`, `contextWindow`, `autoCompactTokenLimit`; shipped as
   `false / 372000 / 300000`, `TODO(IT)`) adds it to the card. The template then writes the window,
   the limit and scope `total` — never `body_after_prefix`. The core offers it only when the preset
   is enabled and sane — a window above Codex's default and at most its 872K cap, a limit above zero
   and at most 90 % of the window (Codex clamps anything higher under `total`) — and only for a
   model whose Codex window can grow: the GPT-6 / GPT-5.6 catalog family, matched the way Codex
   matches slugs (longest prefix, retried once without a `namespace/` segment). For `gpt-5.5` and
   unknown slugs Codex caps the window at 272K, so the option would quote numbers Codex never
   uses. A request for it otherwise renders the default, and the response says so
   (`contextStrategy`).
3. **Local compaction through the provider name.** The Codex provider's `name` is never exactly
   `OpenAI` or `azure` in any case — neither in the template's table nor in the one-click CC Switch
   import, which CC Switch writes verbatim as the table's `name`: such a user or preset name falls
   back to the preset name, then to the table id (the import's masked preview shows the result).
   Codex also compacts remotely for a base URL with an Azure marker (`openai.azure.`,
   `azure-api.`, `azurefd.`, …); no name can override that, and Codex 0.160 offers no switch for it
   (`capabilities.remote_compaction`, #50459, is alpha only). The shipped gateway address has no
   such marker.
4. **Explain instead of choose.** The card explains the window and compaction with numbers from
   the response DTO (`contextStrategies`, `longContextThreshold` — no number in that copy), gives
   the habits that matter more than any number (`/compact`, a new chat per task, `/status`), warns
   about CC Switch's two checkboxes, and links the new help section `context-compaction`. When the
   live file still carries context keys the rendered strategy would not write (e.g. the old 372000
   / 300000 / `body_after_prefix`), the card says what applying changes
   (`CodexConfigStatus.liveContext`) — only while the text is the generated template, since after a
   hand edit the confirm dialog's preview is the authority. A scope value other than `total` /
   `body_after_prefix` read from the user's file is never echoed.
5. The scope radio is removed. `body_after_prefix`, `compact_prompt` and the other knobs are
   explained in the help page for users who edit the file themselves; the wizard never writes them.

## Consequences

- New installs and re-applied files get OpenAI's default behaviour. Users who applied an earlier
  template see the hint and lose the old keys on the next apply.
- Long sessions compact somewhat more often than with 372K. Compaction is lossy by design, so the
  help page teaches keeping plans and decisions in files and starting a new chat per task.
- IT must confirm, before enabling `codexLargeContext`: the smallest per-route input limit for
  every model the wizard suggests (at least ~372K plus output), how requests above 272K input are
  billed, and how an over-long request fails (streamed `response.failed` vs synchronous 400).
- Revisit when Codex changes its catalog numbers (they changed before: 0.144.0 → 0.144.6), when a
  stable Codex ships `[model_providers.<id>.capabilities] remote_compaction` (#50459, alpha only)
  or a fix for synchronous-400 overflow (#48870), and when CC Switch ships its key-field write
  engine (context keys per provider, scope global, third-party tables renamed to `custom`).
- Out of scope here, flagged for a separate decision: `service_tier = "priority"` (Fast mode at a
  higher price, also applied to compaction requests), `model_reasoning_effort = "medium"` (the
  catalog default is `low`), and replacing the whole file on apply instead of merging into it.
