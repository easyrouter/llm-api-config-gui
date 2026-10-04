/**
 * Pure helpers for the context section of the Codex `config.toml` card (ADR-0009): the i18n
 * params of a strategy's explanation and the comparison of the live file's context keys with
 * what the chosen strategy writes. Every number comes from the template response — none is
 * hard-coded here.
 */
import { formatTokens } from "@/lib/format";
import type { CodexContextSettings, ContextStrategyInfo } from "@/lib/types";

/** The only scope the template writes (Codex's default). */
export const WRITTEN_SCOPE = "total";

/**
 * i18n params of one strategy's explanation (`guide:config.context.strategy.<id>.explanation`).
 * A type alias, not an interface: i18next's options need an implicit index signature.
 */
export type StrategyParams = Record<"window" | "limit" | "usable" | "longContext", string>;

/**
 * Params for a strategy's explanation. Named `window`/`limit`/…, never `context`: a value named
 * `context` would double as i18next's context option.
 */
export function strategyParams(
  info: ContextStrategyInfo,
  longContextThreshold: number,
): StrategyParams {
  return {
    window: formatTokens(info.contextWindow),
    limit: formatTokens(info.autoCompactTokenLimit),
    usable: formatTokens(info.usableContextWindow),
    longContext: formatTokens(longContextThreshold),
  };
}

/**
 * `true` when the live file's context keys are not what `info` writes: any key at all for a
 * strategy that writes none (OpenAI's defaults), anything but the exact window / limit / `total`
 * for one that writes them (the large window).
 */
export function liveContextDiffers(live: CodexContextSettings, info: ContextStrategyInfo): boolean {
  if (!info.writesKeys) return true;
  return (
    live.modelContextWindow !== info.contextWindow ||
    live.modelAutoCompactTokenLimit !== info.autoCompactTokenLimit ||
    live.modelAutoCompactTokenLimitScope !== WRITTEN_SCOPE
  );
}

/** The live keys as `key = value` pairs for the "your file currently says …" hint. */
export function describeLiveContext(live: CodexContextSettings): string {
  const parts: string[] = [];
  if (live.modelContextWindow !== null) {
    parts.push(`model_context_window = ${live.modelContextWindow}`);
  }
  if (live.modelAutoCompactTokenLimit !== null) {
    parts.push(`model_auto_compact_token_limit = ${live.modelAutoCompactTokenLimit}`);
  }
  if (live.modelAutoCompactTokenLimitScope !== null) {
    parts.push(`model_auto_compact_token_limit_scope = "${live.modelAutoCompactTokenLimitScope}"`);
  }
  return parts.join(" · ");
}
