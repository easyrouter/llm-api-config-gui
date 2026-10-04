import { describe, expect, it } from "vitest";

import type { CodexContextSettings, ContextStrategyInfo } from "@/lib/types";

import { describeLiveContext, liveContextDiffers, strategyParams } from "./context-strategy";

const OPENAI_DEFAULT: ContextStrategyInfo = {
  strategy: "openai_default",
  contextWindow: 272000,
  autoCompactTokenLimit: 244800,
  usableContextWindow: 258400,
  writesKeys: false,
};

const LARGE_WINDOW: ContextStrategyInfo = {
  strategy: "large_window",
  contextWindow: 372000,
  autoCompactTokenLimit: 300000,
  usableContextWindow: 353400,
  writesKeys: true,
};

function live(overrides: Partial<CodexContextSettings> = {}): CodexContextSettings {
  return {
    modelContextWindow: null,
    modelAutoCompactTokenLimit: null,
    modelAutoCompactTokenLimitScope: null,
    ...overrides,
  };
}

describe("strategyParams", () => {
  it("formats every number of the strategy and the long-context line", () => {
    expect(strategyParams(OPENAI_DEFAULT, 272000)).toEqual({
      window: "272K",
      limit: "245K",
      usable: "258K",
      longContext: "272K",
    });
    expect(strategyParams(LARGE_WINDOW, 272000)).toEqual({
      window: "372K",
      limit: "300K",
      usable: "353K",
      longContext: "272K",
    });
  });
});

describe("liveContextDiffers", () => {
  it("flags any context key when the strategy writes none", () => {
    expect(liveContextDiffers(live({ modelContextWindow: 272000 }), OPENAI_DEFAULT)).toBe(true);
    expect(
      liveContextDiffers(live({ modelAutoCompactTokenLimitScope: "total" }), OPENAI_DEFAULT),
    ).toBe(true);
  });

  it("accepts exactly the large window's keys and flags anything else", () => {
    const written = live({
      modelContextWindow: 372000,
      modelAutoCompactTokenLimit: 300000,
      modelAutoCompactTokenLimitScope: "total",
    });
    expect(liveContextDiffers(written, LARGE_WINDOW)).toBe(false);
    // the values earlier versions of this app wrote
    expect(
      liveContextDiffers(
        { ...written, modelAutoCompactTokenLimitScope: "body_after_prefix" },
        LARGE_WINDOW,
      ),
    ).toBe(true);
    // SeedRouter's own guide: same window, Codex's derived 90 % limit
    expect(
      liveContextDiffers({ ...written, modelAutoCompactTokenLimit: 334800 }, LARGE_WINDOW),
    ).toBe(true);
    // CC Switch's "1M Context Window" checkbox
    expect(
      liveContextDiffers(
        live({ modelContextWindow: 1000000, modelAutoCompactTokenLimit: 900000 }),
        LARGE_WINDOW,
      ),
    ).toBe(true);
  });
});

describe("describeLiveContext", () => {
  it("lists only the keys that are set, as TOML pairs", () => {
    expect(
      describeLiveContext(
        live({
          modelContextWindow: 372000,
          modelAutoCompactTokenLimit: 300000,
          modelAutoCompactTokenLimitScope: "body_after_prefix",
        }),
      ),
    ).toBe(
      'model_context_window = 372000 · model_auto_compact_token_limit = 300000 · model_auto_compact_token_limit_scope = "body_after_prefix"',
    );
    expect(describeLiveContext(live({ modelAutoCompactTokenLimit: 900000 }))).toBe(
      "model_auto_compact_token_limit = 900000",
    );
  });
});
