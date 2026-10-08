import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import i18n from "@/i18n";
import type {
  CheckResult,
  CodexConfigStatus,
  CodexConfigTemplate,
  ConfigGuide,
  ConnectivityReport,
  ContextStrategy,
  ContextStrategyInfo,
  GatewayProbeRequest,
  GuideStep,
  KeyValidation,
  Protocol,
  ToolId,
  UrlPreview,
  UrlWarning,
} from "@/lib/types";
import { useWizardStore } from "@/stores/wizard";
import { mockInvoke, mockWriteText, setInvokeHandlers } from "@/test/mocks/tauri";

import { ConfigureScreen } from "./ConfigureScreen";

const BASE_URL = "https://gateway.example.com/v1";
/** Claude Code's own address: the root — its client appends `/v1/messages` itself. */
const CLAUDE_BASE_URL = "https://gateway.example.com";
const GOOD_KEY = "sk-abcdefghijklmnopqrstuvwxyz";
const MASKED_LINK = `ccswitch://v1/import?resource=provider&app=codex&name=Service+Gateway&apiKey=sk-****wxyz`;

function guideFor(tool: ToolId): ConfigGuide {
  return {
    tool,
    // Mirrors `config::gateway_defaults`: each tool gets its own address, protocol and model.
    preset:
      tool === "codex"
        ? {
            providerName: "Service Gateway",
            baseUrl: BASE_URL,
            protocol: "responses",
            modelHint: "gpt-5-codex",
            reasoningEffortHint: "",
          }
        : {
            providerName: "Service Gateway",
            baseUrl: CLAUDE_BASE_URL,
            protocol: "anthropic_messages",
            modelHint: "claude-sonnet-5",
            reasoningEffortHint: "",
          },
    steps:
      tool === "codex"
        ? [
            step("open_cc_switch", null, { verifyCheck: "cc_switch" }),
            step("select_tool_tab", null, { params: { tool } }),
            step("add_official_provider", "chatgpt_login"),
            step("login_chatgpt", "chatgpt_login"),
            step("paste_base_url", "api_key", { copyValue: BASE_URL }),
            step("set_model", "api_key"),
            step("apply_codex_config", null),
          ]
        : [
            step("open_cc_switch", null, { verifyCheck: "cc_switch" }),
            step("select_tool_tab", null, { params: { tool } }),
            step("paste_base_url", null, { copyValue: BASE_URL }),
            step("set_model", null),
          ],
  };
}

function step(
  code: string,
  branch: GuideStep["branch"],
  overrides: Partial<Pick<GuideStep, "params" | "copyValue" | "verifyCheck">> = {},
): GuideStep {
  return { id: code, code, params: {}, copyValue: null, verifyCheck: null, branch, ...overrides };
}

const CONFIG_PATH = "C:\\Users\\me\\.codex\\config.toml";
const BACKUP_PATH = `${CONFIG_PATH}.seedrouter-20260819T120000.bak`;

function configStatus(overrides: Partial<CodexConfigStatus> = {}): CodexConfigStatus {
  return {
    path: CONFIG_PATH,
    exists: false,
    currentRedacted: null,
    backups: [],
    matchesTemplate: null,
    liveContext: null,
    ...overrides,
  };
}

/** Mirrors `guide::context_strategies` for the shipped preset (OpenAI's defaults only). */
const OPENAI_DEFAULT: ContextStrategyInfo = {
  strategy: "openai_default",
  contextWindow: 272000,
  autoCompactTokenLimit: 244800,
  usableContextWindow: 258400,
  writesKeys: false,
};

/** Mirrors the large window a preset with `codexLargeContext.enabled` adds. */
const LARGE_WINDOW: ContextStrategyInfo = {
  strategy: "large_window",
  contextWindow: 372000,
  autoCompactTokenLimit: 300000,
  usableContextWindow: 353400,
  writesKeys: true,
};

/**
 * Mirrors `guide::codex_config_template_response`: the toml for the strategy actually rendered
 * (OpenAI's defaults when the requested one is not on offer) plus every strategy's numbers.
 */
function codexTemplate(
  model: string,
  requested: ContextStrategy,
  offered: ContextStrategyInfo[] = [OPENAI_DEFAULT],
): CodexConfigTemplate {
  const rendered = offered.find((s) => s.strategy === requested) ?? OPENAI_DEFAULT;
  const contextLines = rendered.writesKeys
    ? [
        `model_context_window = ${rendered.contextWindow}`,
        `model_auto_compact_token_limit = ${rendered.autoCompactTokenLimit}`,
        `model_auto_compact_token_limit_scope = "total"`,
      ]
    : [];
  return {
    toml: [`model = "${model}"`, ...contextLines, `experimental_bearer_token = "<API-KEY>"`].join(
      "\n",
    ),
    contextStrategy: rendered.strategy,
    contextStrategies: offered,
    longContextThreshold: 272000,
  };
}

/** The request the card sent with its last `get_codex_config_template` call. */
function lastTemplateRequest(): { model: string; contextStrategy: ContextStrategy } {
  const calls = mockInvoke.mock.calls.filter(([cmd]) => cmd === "get_codex_config_template");
  const args = calls.at(-1)?.[1] as {
    request: { model: string; contextStrategy: ContextStrategy };
  };
  return args.request;
}

/** Number badges of the visible steps, in order. */
function stepNumbers(): string[] {
  return within(screen.getByTestId("guide-steps"))
    .getAllByRole("listitem")
    .map((li) => li.querySelector("span[aria-hidden]")?.textContent ?? "");
}

function stepCodes(): string[] {
  return within(screen.getByTestId("guide-steps"))
    .getAllByRole("listitem")
    .map((li) => li.getAttribute("data-step-code") ?? "");
}

function keyValidation(key: string): KeyValidation {
  const issues: KeyValidation["issues"] = [];
  if (key.trim().length === 0) issues.push("empty");
  if (key.length > 0 && key !== key.trim()) issues.push("leading_or_trailing_whitespace");
  if (key.trim() !== "" && !key.trim().startsWith("sk-")) issues.push("unexpected_prefix");
  return {
    valid: issues.every((i) => i === "unexpected_prefix"),
    issues,
    length: key.trim().length,
  };
}

/** Mirrors `guide::preview_url`: the bare-origin rule depends on the protocol. */
function urlPreview(url: string, protocol: Protocol = "responses"): UrlPreview {
  const trimmed = url.trim().replace(/\/+$/, "");
  if (!trimmed.startsWith("http")) {
    return { input: url, effectiveUrl: "", rule: "invalid", warnings: [] };
  }
  const versioned = trimmed.endsWith("/v1");
  const warnings: UrlWarning[] = url.trim().endsWith("/") ? ["trailing_slash_removed"] : [];
  if (protocol === "anthropic_messages") {
    if (versioned) warnings.push("anthropic_v1_suffix");
    return {
      input: url,
      effectiveUrl: trimmed,
      rule: versioned ? "already_versioned" : "root_kept",
      warnings,
    };
  }
  return {
    input: url,
    effectiveUrl: versioned ? trimmed : `${trimmed}/v1`,
    rule: versioned ? "already_versioned" : "appended_v1",
    warnings,
  };
}

function connectivity(args: Record<string, unknown> | undefined): ConnectivityReport {
  const req = args?.request as GatewayProbeRequest;
  const url = urlPreview(req.baseUrl, req.protocol);
  const key = keyValidation(req.apiKey);
  const sent = url.rule !== "invalid" && key.valid;
  const gateway = sent
    ? { ok: true, httpStatus: 200, latencyMs: 42, errorClass: null, message: null }
    : null;
  const models = sent
    ? {
        gateway: { ok: true, httpStatus: 200, latencyMs: 18, errorClass: null, message: null },
        models: ["gpt-5", "gpt-5-codex"],
      }
    : null;
  return { url, key, models, gateway };
}

const passResult: CheckResult = {
  id: "cc_switch",
  status: "pass",
  code: "cc_switch.installed",
  params: {},
  details: [],
  fixes: [],
  durationMs: 5,
};

describe("ConfigureScreen", () => {
  beforeAll(async () => {
    await i18n.changeLanguage("en");
    i18n.addResourceBundle("en", "checks", { cc_switch: { installed: "CC Switch is installed" } });
  });

  beforeEach(() => {
    useWizardStore.getState().reset();
    useWizardStore.getState().goTo("configure");
    setInvokeHandlers({
      get_config_guide: (args) => guideFor(args?.tool as ToolId),
      test_connectivity: connectivity,
      list_gateway_models: () => ({
        gateway: { ok: true, httpStatus: 200, latencyMs: 20, errorClass: null, message: null },
        models: ["gpt-5", "gpt-5-codex"],
      }),
      get_codex_config_template: (args) => {
        const req = args?.request as { model: string; contextStrategy: ContextStrategy };
        return codexTemplate(req.model, req.contextStrategy);
      },
      preview_cc_switch_import: () => ({ displayUrl: MASKED_LINK, app: "codex" }),
      open_cc_switch_import: () => undefined,
      run_env_check: () => passResult,
      codex_config_status: () => configStatus(),
      apply_codex_config: () => ({ path: CONFIG_PATH, backupPath: null, bytes: 100 }),
      restore_codex_config: () => ({ path: CONFIG_PATH, backupPath: null, bytes: 90 }),
    });
  });

  const keyInput = async () => await screen.findByTestId("key-input");

  it("offers direct endpoint and model inputs in quick mode without sending credentials", async () => {
    useWizardStore.getState().startSetup("quick");
    render(<ConfigureScreen />);
    expect(await screen.findByTestId("input-base-url")).toHaveValue(BASE_URL);
    expect(screen.getByTestId("input-model")).toHaveValue("gpt-5-codex");
    expect(screen.queryByTestId("codex-client-note")).not.toBeInTheDocument();
    expect(screen.getByTestId("codex-config-card").closest("details")).not.toHaveAttribute("open");
    expect(
      mockInvoke.mock.calls.some(([command]) =>
        ["test_connectivity", "open_cc_switch_import", "apply_codex_config"].includes(command),
      ),
    ).toBe(false);
  });

  it("clears a successful connection result when the endpoint changes", async () => {
    useWizardStore.getState().startSetup("quick");
    render(<ConfigureScreen />);
    fireEvent.change(await keyInput(), { target: { value: GOOD_KEY } });
    fireEvent.click(screen.getByTestId("test-connectivity"));
    expect(await screen.findByTestId("connectivity-result")).toBeInTheDocument();
    fireEvent.change(screen.getByTestId("input-base-url"), {
      target: { value: "https://other.example/v1" },
    });
    expect(screen.queryByTestId("connectivity-result")).not.toBeInTheDocument();
  });

  it("ignores a connection response that arrives after an endpoint edit", async () => {
    let finish!: (report: ConnectivityReport) => void;
    setInvokeHandlers({
      test_connectivity: () =>
        new Promise<ConnectivityReport>((resolve) => {
          finish = resolve;
        }),
    });
    useWizardStore.getState().startSetup("quick");
    render(<ConfigureScreen />);
    fireEvent.change(await keyInput(), { target: { value: GOOD_KEY } });
    fireEvent.click(screen.getByTestId("test-connectivity"));
    fireEvent.change(screen.getByTestId("input-base-url"), {
      target: { value: "https://other.example/v1" },
    });
    await act(async () => {
      finish(
        connectivity({
          request: { baseUrl: BASE_URL, apiKey: GOOD_KEY, model: "model", protocol: "responses" },
        }),
      );
      await Promise.resolve();
    });
    expect(screen.queryByTestId("connectivity-result")).not.toBeInTheDocument();
  });

  it("clears a successful connection result when the model or key changes", async () => {
    useWizardStore.getState().startSetup("quick");
    render(<ConfigureScreen />);
    fireEvent.change(await keyInput(), { target: { value: GOOD_KEY } });
    fireEvent.click(screen.getByTestId("test-connectivity"));
    await screen.findByTestId("connectivity-result");
    fireEvent.change(screen.getByTestId("input-model"), { target: { value: "another-model" } });
    expect(screen.queryByTestId("connectivity-result")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("test-connectivity"));
    await screen.findByTestId("connectivity-result");
    fireEvent.change(await keyInput(), { target: { value: "sk-another-test-key" } });
    expect(screen.queryByTestId("connectivity-result")).not.toBeInTheDocument();
  });

  it("drops the typed key when switching tools in quick mode", async () => {
    useWizardStore.getState().startSetup("quick");
    render(<ConfigureScreen />);
    fireEvent.change(await keyInput(), { target: { value: GOOD_KEY } });
    fireEvent.click(screen.getByRole("tab", { name: "Claude Code" }));
    expect(await screen.findByTestId("input-base-url")).toHaveValue(CLAUDE_BASE_URL);
    expect(await keyInput()).toHaveValue("");
    fireEvent.click(screen.getByRole("tab", { name: "Codex CLI" }));
    expect(await keyInput()).toHaveValue("");
  });

  it("renders the editable values, the codex client note and the numbered steps", async () => {
    render(<ConfigureScreen />);
    expect(await screen.findByText("Open CC Switch")).toBeInTheDocument();
    expect(mockInvoke).toHaveBeenCalledWith("get_config_guide", { tool: "codex" });

    // values card: provider name / base URL / protocol / model, all copyable
    const values = screen.getAllByTestId("copy-field-value").map((el) => el.textContent);
    expect(values).toContain("Service Gateway");
    expect(values).toContain(BASE_URL);
    expect(values).toContain("Responses");
    expect(values).toContain("gpt-5-codex");

    // the configuration covers Codex CLI + the Codex client (shared ~/.codex)
    expect(screen.getByTestId("codex-client-note")).toBeInTheDocument();

    // steps in order (API-key path by default: the sign-in steps are hidden), with params
    // interpolated and copy values rendered
    const steps = within(screen.getByTestId("guide-steps")).getAllByRole("listitem");
    expect(steps).toHaveLength(5);
    expect(stepCodes()).toEqual([
      "open_cc_switch",
      "select_tool_tab",
      "paste_base_url",
      "set_model",
      "apply_codex_config",
    ]);
    expect(steps[1]).toHaveTextContent("Switch to the Codex CLI tab");
    expect(within(steps[2]!).getByTestId("copy-field-value")).toHaveTextContent(BASE_URL);
    expect(steps[3]).toHaveTextContent("enter: gpt-5-codex");
  });

  it("re-runs the linked check when the user clicks 'I did this'", async () => {
    render(<ConfigureScreen />);
    const button = await screen.findByRole("button", { name: /I did this/ });
    fireEvent.click(button);
    expect(await screen.findByText("CC Switch is installed")).toBeInTheDocument();
    expect(mockInvoke).toHaveBeenCalledWith("run_env_check", { id: "cc_switch" });
    expect(screen.getByText("Pass")).toBeInTheDocument();
  });

  it("tests connectivity in place: key issues block the probe, a clean key reaches the gateway", async () => {
    render(<ConfigureScreen />);
    const input = await keyInput();
    expect(input).toHaveAttribute("type", "password");
    const testButton = screen.getByTestId("test-connectivity");
    expect(testButton).toBeDisabled();

    // a key with a blocking issue: format verdict shown, no gateway request sent
    fireEvent.change(input, { target: { value: ` ${GOOD_KEY}` } });
    fireEvent.click(testButton);
    const verdict = await screen.findByTestId("key-verdict");
    expect(verdict).toHaveAttribute("data-valid", "false");
    expect(within(verdict).getByText(/space \/ tab at the beginning or end/)).toBeInTheDocument();
    expect(screen.getByTestId("connectivity-not-sent")).toBeInTheDocument();
    expect(mockInvoke).toHaveBeenCalledWith("test_connectivity", {
      request: {
        baseUrl: BASE_URL,
        apiKey: ` ${GOOD_KEY}`,
        model: "gpt-5-codex",
        protocol: "responses",
      },
    });

    // a clean key: URL verdict + gateway result
    fireEvent.change(input, { target: { value: GOOD_KEY } });
    fireEvent.click(testButton);
    await waitFor(() =>
      expect(screen.getByTestId("key-verdict")).toHaveAttribute("data-valid", "true"),
    );
    expect(screen.getByTestId("url-verdict")).toHaveAttribute("data-rule", "already_versioned");
    const gateway = screen.getByTestId("gateway-check");
    expect(gateway).toHaveAttribute("data-status", "pass");
    const modelList = screen.getByTestId("model-list-check");
    expect(modelList).toHaveAttribute("data-status", "pass");
    expect(within(modelList).getByText("2")).toBeInTheDocument();
    expect(screen.queryByTestId("connectivity-not-sent")).toBeNull();
  });

  it("edits the base URL in place and uses it for the test and the steps", async () => {
    render(<ConfigureScreen />);
    await screen.findByText("Open CC Switch");

    fireEvent.click(screen.getByTestId("edit-base-url"));
    fireEvent.change(screen.getByTestId("input-base-url"), {
      target: { value: "https://gateway.example.com/" },
    });
    fireEvent.click(screen.getByTestId("done-base-url"));

    // the paste_base_url step copies the edited value
    const steps = within(screen.getByTestId("guide-steps")).getAllByRole("listitem");
    expect(within(steps[2]!).getByTestId("copy-field-value")).toHaveTextContent(
      "https://gateway.example.com/",
    );

    // and the connectivity test is run against it
    fireEvent.change(await keyInput(), { target: { value: GOOD_KEY } });
    fireEvent.click(screen.getByTestId("test-connectivity"));
    const verdict = await screen.findByTestId("url-verdict");
    expect(verdict).toHaveAttribute("data-rule", "appended_v1");
    expect(screen.getByText(/trailing slash is removed/)).toBeInTheDocument();
    expect(screen.getByText(/\/v1 is appended/)).toBeInTheDocument();
  });

  it("fetches the model list on the set_model step and picks a model with one click", async () => {
    render(<ConfigureScreen />);
    await screen.findByText("Open CC Switch");
    const fetchButton = screen.getByTestId("fetch-models");
    expect(fetchButton).toBeDisabled();

    fireEvent.change(await keyInput(), { target: { value: GOOD_KEY } });
    fireEvent.click(fetchButton);
    const list = await screen.findByTestId("models-list");
    expect(mockInvoke).toHaveBeenCalledWith("list_gateway_models", {
      request: { baseUrl: BASE_URL, apiKey: GOOD_KEY, model: "", protocol: "responses" },
    });

    fireEvent.click(within(list).getByRole("button", { name: "gpt-5" }));
    expect(screen.getByTestId("model-picked")).toHaveTextContent("gpt-5");
    // the values card now shows the picked model
    const modelRow = screen.getByTestId("row-model");
    expect(within(modelRow).getByTestId("copy-field-value")).toHaveTextContent(/^gpt-5$/);
  });

  it("imports into CC Switch only after showing the masked link and confirming", async () => {
    render(<ConfigureScreen />);
    await screen.findByText("Open CC Switch");
    const importButton = screen.getByTestId("cc-switch-import");
    expect(importButton).toBeDisabled();

    fireEvent.change(await keyInput(), { target: { value: GOOD_KEY } });
    fireEvent.click(importButton);

    // the dialog previews the masked deep link — the raw key never shows up
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByTestId("copy-field-value")).toHaveTextContent("apiKey=sk-****wxyz");
    expect(dialog).not.toHaveTextContent(GOOD_KEY);
    expect(mockInvoke).not.toHaveBeenCalledWith("open_cc_switch_import", expect.anything());

    fireEvent.click(within(dialog).getByRole("button", { name: "Open CC Switch" }));
    await waitFor(() =>
      expect(mockInvoke).toHaveBeenCalledWith("open_cc_switch_import", {
        request: {
          tool: "codex",
          providerName: "Service Gateway",
          baseUrl: BASE_URL,
          apiKey: GOOD_KEY,
          model: "gpt-5-codex",
        },
      }),
    );
    expect(await screen.findByTestId("import-sent")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("explains OpenAI's default context strategy and substitutes the key in the template", async () => {
    render(<ConfigureScreen />);
    await screen.findByText("Open CC Switch");
    const textarea = screen.getByTestId<HTMLTextAreaElement>("config-toml-input");
    await waitFor(() => expect(textarea.value).toContain('model = "gpt-5-codex"'));
    expect(textarea.value).toContain("<API-KEY>");
    // OpenAI's defaults: the template writes no context key at all
    expect(textarea.value).not.toContain("model_context_window");
    expect(textarea.value).not.toContain("model_auto_compact_token_limit");
    expect(lastTemplateRequest().contextStrategy).toBe("openai_default");

    // the card copy quotes the live model and the numbers from the response — never hard-coded
    const card = screen.getByTestId("codex-config-card");
    expect(card).toHaveTextContent("the priority tier for gpt-5-codex,");
    const explanation = screen.getByTestId("config-strategy-openai_default-explanation");
    expect(explanation).toHaveTextContent("a 272K context window");
    expect(explanation).toHaveTextContent("automatic compaction at about 245K");
    expect(explanation).toHaveTextContent("compaction at 258K at the latest");
    expect(explanation).toHaveTextContent("Requests normally stay below 272K");
    expect(explanation).toHaveTextContent("the defaults OpenAI set for the model");
    // only one strategy on offer: no radio list, and nothing about the old scope choice
    expect(screen.queryByTestId("config-context-choice")).toBeNull();
    expect(within(screen.getByTestId("config-context")).queryByRole("radio")).toBeNull();
    expect(card).not.toHaveTextContent(/body_after_prefix|cached prefix/);
    // the habits, the CC Switch checkboxes to leave alone, and the detailed help
    expect(screen.getByTestId("config-context-tips")).toHaveTextContent("/compact");
    expect(screen.getByTestId("config-context-cc-switch")).toHaveTextContent(
      "“1M Context Window” and “Enable remote compaction” unticked",
    );
    expect(
      within(screen.getByTestId("config-context")).getByRole("button", { name: /How it works/ }),
    ).toHaveAttribute("data-help-section", "context-compaction");

    // copying substitutes the real key for the placeholder; the screen never shows it
    fireEvent.change(await keyInput(), { target: { value: GOOD_KEY } });
    fireEvent.click(screen.getByTestId("config-toml-copy"));
    await waitFor(() => expect(mockWriteText).toHaveBeenCalled());
    const copiedText = mockWriteText.mock.calls.at(-1)?.[0] as string;
    expect(copiedText).toContain(`experimental_bearer_token = "${GOOD_KEY}"`);
    expect(copiedText).not.toContain("<API-KEY>");
    expect(textarea.value).toContain("<API-KEY>");
    expect(textarea.value).not.toContain(GOOD_KEY);
  });

  it("offers the large window only when the preset does, and freezes manual edits", async () => {
    setInvokeHandlers({
      get_codex_config_template: (args) => {
        const req = args?.request as { model: string; contextStrategy: ContextStrategy };
        return codexTemplate(req.model, req.contextStrategy, [OPENAI_DEFAULT, LARGE_WINDOW]);
      },
    });
    render(<ConfigureScreen />);
    await screen.findByText("Open CC Switch");
    const textarea = screen.getByTestId<HTMLTextAreaElement>("config-toml-input");
    await waitFor(() => expect(textarea.value).toContain('model = "gpt-5-codex"'));

    // two strategies: a radio list, recommended one preselected
    const choice = await screen.findByTestId("config-context-choice");
    expect(within(choice).getAllByRole("radio")).toHaveLength(2);
    expect(screen.getByTestId<HTMLInputElement>("config-strategy-openai_default").checked).toBe(
      true,
    );
    expect(screen.getByTestId("config-strategy-large_window-explanation")).toHaveTextContent(
      "a 372K context window with automatic compaction at 300K (scope total), and compaction at 353K at the latest",
    );
    expect(textarea.value).not.toContain("model_context_window");

    // choosing the large window regenerates the template with its three keys
    fireEvent.click(screen.getByTestId("config-strategy-large_window"));
    await waitFor(() => expect(textarea.value).toContain("model_context_window = 372000"));
    expect(textarea.value).toContain("model_auto_compact_token_limit = 300000");
    expect(textarea.value).toContain('model_auto_compact_token_limit_scope = "total"');
    expect(lastTemplateRequest().contextStrategy).toBe("large_window");

    // manual edits freeze regeneration until the template is restored
    fireEvent.change(textarea, {
      target: { value: `${textarea.value}\ntool_output_token_limit = 8000` },
    });
    fireEvent.click(screen.getByTestId("config-strategy-openai_default"));
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(textarea.value).toContain("tool_output_token_limit = 8000");
    expect(textarea.value).toContain("model_context_window = 372000");
    expect(screen.getByTestId("config-toml-edited")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("config-toml-restore"));
    await waitFor(() => expect(textarea.value).not.toContain("tool_output_token_limit = 8000"));
    expect(textarea.value).not.toContain("model_context_window");
  });

  it("follows the core when it does not offer the requested strategy", async () => {
    // a preset that offered the large window once, then IT switched it off again: the core
    // answers with OpenAI's defaults, and the radio must not keep claiming the large window
    let offered: ContextStrategyInfo[] = [OPENAI_DEFAULT, LARGE_WINDOW];
    setInvokeHandlers({
      get_codex_config_template: (args) => {
        const req = args?.request as { model: string; contextStrategy: ContextStrategy };
        return codexTemplate(req.model, req.contextStrategy, offered);
      },
    });
    render(<ConfigureScreen />);
    await screen.findByText("Open CC Switch");
    fireEvent.click(await screen.findByTestId("config-strategy-large_window"));
    const textarea = screen.getByTestId<HTMLTextAreaElement>("config-toml-input");
    await waitFor(() => expect(textarea.value).toContain("model_context_window = 372000"));

    offered = [OPENAI_DEFAULT];
    fireEvent.click(screen.getByTestId("edit-model"));
    fireEvent.change(screen.getByTestId("input-model"), { target: { value: "gpt-6-astra" } });
    await waitFor(() => expect(textarea.value).toContain('model = "gpt-6-astra"'));
    expect(textarea.value).not.toContain("model_context_window");
    expect(screen.queryByTestId("config-context-choice")).toBeNull();
    await waitFor(() => expect(lastTemplateRequest().contextStrategy).toBe("openai_default"));
  });

  it("points out context keys in the live file that applying would change", async () => {
    setInvokeHandlers({
      codex_config_status: () =>
        configStatus({
          exists: true,
          matchesTemplate: false,
          // what earlier versions of this app wrote
          liveContext: {
            modelContextWindow: 372000,
            modelAutoCompactTokenLimit: 300000,
            modelAutoCompactTokenLimitScope: "body_after_prefix",
          },
        }),
    });
    render(<ConfigureScreen />);
    await screen.findByText("Open CC Switch");
    const hint = await screen.findByTestId("config-live-context");
    expect(hint).toHaveTextContent(
      'currently says: model_context_window = 372000 · model_auto_compact_token_limit = 300000 · model_auto_compact_token_limit_scope = "body_after_prefix". Applying removes these lines',
    );

    // after a hand edit the strategy no longer describes what Apply writes: no claim at all
    const textarea = screen.getByTestId<HTMLTextAreaElement>("config-toml-input");
    fireEvent.change(textarea, {
      target: { value: `model_context_window = 372000\n${textarea.value}` },
    });
    await waitFor(() => expect(screen.queryByTestId("config-live-context")).toBeNull());
  });

  it("says the large window replaces differing keys and stays quiet when they already match", async () => {
    let live = {
      modelContextWindow: 372000,
      modelAutoCompactTokenLimit: 300000,
      modelAutoCompactTokenLimitScope: "body_after_prefix",
    };
    setInvokeHandlers({
      get_codex_config_template: (args) => {
        const req = args?.request as { model: string; contextStrategy: ContextStrategy };
        return codexTemplate(req.model, req.contextStrategy, [OPENAI_DEFAULT, LARGE_WINDOW]);
      },
      codex_config_status: () =>
        configStatus({ exists: true, matchesTemplate: false, liveContext: live }),
    });
    render(<ConfigureScreen />);
    await screen.findByText("Open CC Switch");
    expect(await screen.findByTestId("config-live-context")).toHaveTextContent(
      "Applying removes these lines",
    );

    fireEvent.click(screen.getByTestId("config-strategy-large_window"));
    await waitFor(() =>
      expect(screen.getByTestId("config-live-context")).toHaveTextContent(
        "Applying replaces them with the large-window settings",
      ),
    );

    // the live file already has exactly the large window's keys: nothing to point out
    live = { ...live, modelAutoCompactTokenLimitScope: "total" };
    fireEvent.change(await keyInput(), { target: { value: GOOD_KEY } });
    await waitFor(() => expect(screen.queryByTestId("config-live-context")).toBeNull());
  });

  it("drops the hint once the file matches the template", async () => {
    setInvokeHandlers({
      codex_config_status: () =>
        configStatus({
          exists: true,
          matchesTemplate: true,
          liveContext: {
            modelContextWindow: 400000,
            modelAutoCompactTokenLimit: null,
            modelAutoCompactTokenLimitScope: null,
          },
        }),
    });
    render(<ConfigureScreen />);
    await screen.findByText("Open CC Switch");
    expect(await screen.findByTestId("config-status")).toHaveTextContent("already the latest");
    expect(screen.queryByTestId("config-live-context")).toBeNull();
  });

  it("keeps the user's strategy click when an older template response lands after it", async () => {
    let hold = false;
    let release: () => void = () => undefined;
    setInvokeHandlers({
      get_codex_config_template: (args) => {
        const req = args?.request as { model: string; contextStrategy: ContextStrategy };
        const response = codexTemplate(req.model, req.contextStrategy, [
          OPENAI_DEFAULT,
          LARGE_WINDOW,
        ]);
        if (!hold) return response;
        return new Promise<CodexConfigTemplate>((resolve) => {
          release = () => resolve(response);
        });
      },
    });
    render(<ConfigureScreen />);
    await screen.findByText("Open CC Switch");
    const large = await screen.findByTestId<HTMLInputElement>("config-strategy-large_window");

    // a model change sends a new (openai_default) request, which is held in flight …
    hold = true;
    fireEvent.click(screen.getByTestId("edit-model"));
    fireEvent.change(screen.getByTestId("input-model"), { target: { value: "gpt-6-astra" } });
    await waitFor(() => expect(lastTemplateRequest().model).toBe("gpt-6-astra"));
    expect(lastTemplateRequest().contextStrategy).toBe("openai_default");

    // … the user picks the large window while it is pending, then the old response lands
    hold = false;
    fireEvent.click(large);
    await act(async () => {
      release();
      await Promise.resolve();
    });
    expect(screen.getByTestId<HTMLInputElement>("config-strategy-large_window").checked).toBe(true);

    // the click is not lost: its own request follows and the text gets the large window
    const textarea = screen.getByTestId<HTMLTextAreaElement>("config-toml-input");
    await waitFor(() => expect(textarea.value).toContain("model_context_window = 372000"));
    expect(lastTemplateRequest()).toMatchObject({
      model: "gpt-6-astra",
      contextStrategy: "large_window",
    });
  });

  it("omits the template numbers until the response arrives and names the model from the live field", async () => {
    let resolveTemplate: (value: CodexConfigTemplate) => void = () => undefined;
    setInvokeHandlers({
      // a preset without a model hint: the description falls back to a generic phrase
      get_config_guide: (args) => {
        const guide = guideFor(args?.tool as ToolId);
        return { ...guide, preset: { ...guide.preset, modelHint: "" } };
      },
      get_codex_config_template: () =>
        new Promise<CodexConfigTemplate>((resolve) => {
          resolveTemplate = resolve;
        }),
    });
    render(<ConfigureScreen />);
    await screen.findByText("Open CC Switch");
    await waitFor(() =>
      expect(mockInvoke).toHaveBeenCalledWith("get_codex_config_template", expect.anything()),
    );

    // loading: fallback phrase, no numbers, and nothing half-interpolated anywhere on the card
    const card = screen.getByTestId("codex-config-card");
    expect(card).toHaveTextContent("the priority tier for the selected model,");
    expect(screen.queryByTestId("config-strategy-openai_default-explanation")).toBeNull();
    expect(screen.getByTestId("config-context-tips")).toBeInTheDocument();
    expect(card).not.toHaveTextContent(/undefined|NaN|\{\{|0K/);

    // the response arrives: the numbers show up, formatted from the DTO
    await act(async () => {
      resolveTemplate(codexTemplate("", "openai_default"));
      await Promise.resolve();
    });
    expect(
      await screen.findByTestId("config-strategy-openai_default-explanation"),
    ).toHaveTextContent("272K");
    expect(card).not.toHaveTextContent(/undefined|NaN|\{\{/);
  });

  it("switches tabs per tool and discards the typed key when leaving a tab", async () => {
    render(<ConfigureScreen />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((tab) => tab.textContent)).toEqual(["Codex CLI", "Claude Code"]);

    fireEvent.change(await keyInput(), { target: { value: "sk-secret" } });
    fireEvent.click(tabs[1]!);

    expect(await screen.findByTestId("tool-guide-claude-code")).toBeInTheDocument();
    expect(mockInvoke).toHaveBeenCalledWith("get_config_guide", { tool: "claude-code" });
    expect(screen.getByTestId("key-input")).toHaveValue("");
    // Claude Code shows the protocol note instead of a protocol value, and no codex extras
    expect(screen.getByText(/Claude Code has no protocol setting/)).toBeInTheDocument();
    expect(screen.queryByTestId("codex-client-note")).toBeNull();
    expect(screen.queryByTestId("config-toml-input")).toBeNull();
    // ...and its own preset values: the root address (no /v1) and the Anthropic model.
    expect(screen.getByTestId("row-base-url")).toHaveTextContent(CLAUDE_BASE_URL);
    expect(screen.getByTestId("row-base-url")).not.toHaveTextContent(`${CLAUDE_BASE_URL}/v1`);
    expect(screen.getByTestId("row-model")).toHaveTextContent("claude-sonnet-5");
  });

  it("tests connectivity for Claude Code against the root address", async () => {
    render(<ConfigureScreen />);
    fireEvent.click(screen.getAllByRole("tab")[1]!);
    await screen.findByTestId("tool-guide-claude-code");
    fireEvent.change(screen.getByTestId("key-input"), { target: { value: GOOD_KEY } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Test connectivity" }));
      await Promise.resolve();
    });
    expect(mockInvoke).toHaveBeenCalledWith("test_connectivity", {
      request: {
        baseUrl: CLAUDE_BASE_URL,
        apiKey: GOOD_KEY,
        model: "claude-sonnet-5",
        protocol: "anthropic_messages",
      },
    });
    // The root survives the URL rules — nothing appends /v1 for Anthropic Messages.
    const verdict = await screen.findByTestId("url-verdict");
    expect(verdict).toHaveAttribute("data-rule", "root_kept");
    expect(verdict).toHaveTextContent(CLAUDE_BASE_URL);
    expect(verdict).not.toHaveTextContent(`${CLAUDE_BASE_URL}/v1`);
  });

  it("links the terminal reminder to the help section and advances to Verify", async () => {
    render(<ConfigureScreen />);
    await screen.findByText("Open CC Switch");
    fireEvent.click(screen.getByRole("button", { name: /Why is this needed/ }));
    expect(useWizardStore.getState().helpOpen).toBe(true);
    expect(useWizardStore.getState().helpSectionId).toBe("verify");

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Go to verification/ }));
      await Promise.resolve();
    });
    expect(useWizardStore.getState().step).toBe("verify");
  });

  it("switches the Codex account path: filters + renumbers steps and hides the import card", async () => {
    render(<ConfigureScreen />);
    await screen.findByText("Open CC Switch");
    // default: API-key path — custom provider + one-click import + the Windows patch card
    expect(screen.getByTestId("account-path-api_key")).toHaveAttribute("data-selected", "true");
    expect(screen.getByTestId("cc-switch-import")).toBeInTheDocument();
    expect(stepNumbers()).toEqual(["1", "2", "3", "4", "5"]);

    fireEvent.click(within(screen.getByTestId("account-path-chatgpt_login")).getByRole("radio"));
    expect(screen.getByTestId("account-path-chatgpt_login")).toHaveAttribute(
      "data-selected",
      "true",
    );
    expect(stepCodes()).toEqual([
      "open_cc_switch",
      "select_tool_tab",
      "add_official_provider",
      "login_chatgpt",
      "apply_codex_config",
    ]);
    expect(stepNumbers()).toEqual(["1", "2", "3", "4", "5"]);
    expect(screen.getByText("Add the “OpenAI Official” preset provider")).toBeInTheDocument();
    // no custom provider on the sign-in path: import card and Windows patch card are gone
    expect(screen.queryByTestId("cc-switch-import")).toBeNull();
    expect(screen.queryByTestId("codex-fast-ui")).toBeNull();
    // the values card explains the key only feeds config.toml; the template card stays
    expect(screen.getByText(/only goes into the config.toml template/)).toBeInTheDocument();
    expect(screen.getByTestId("config-toml-input")).toBeInTheDocument();

    // no account-path selector on the Claude Code tab
    fireEvent.click(screen.getAllByRole("tab")[1]!);
    await screen.findByTestId("tool-guide-claude-code");
    expect(screen.queryByTestId("account-path")).toBeNull();
    expect(screen.getByTestId("cc-switch-import")).toBeInTheDocument();
    expect(stepCodes()).toHaveLength(4);
  });

  it("applies the codex config only after a masked preview and confirmation", async () => {
    setInvokeHandlers({
      codex_config_status: () =>
        configStatus({ exists: true, matchesTemplate: false, backups: [BACKUP_PATH] }),
      apply_codex_config: () => ({ path: CONFIG_PATH, backupPath: BACKUP_PATH, bytes: 120 }),
    });
    render(<ConfigureScreen />);
    await screen.findByText("Open CC Switch");
    const textarea = screen.getByTestId<HTMLTextAreaElement>("config-toml-input");
    await waitFor(() => expect(textarea.value).toContain("<API-KEY>"));
    const status = await screen.findByTestId("config-status");
    expect(status).toHaveTextContent("differs from the template (1 backups)");

    // an empty key blocks the apply: no dialog, nothing written
    fireEvent.click(screen.getByTestId("config-apply"));
    expect(await screen.findByTestId("config-apply-needs-key")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(mockInvoke).not.toHaveBeenCalledWith("apply_codex_config", expect.anything());

    // with a key: the dialog shows path, backup note and a masked preview — never the real key
    fireEvent.change(await keyInput(), { target: { value: GOOD_KEY } });
    fireEvent.click(screen.getByTestId("config-apply"));
    const dialog = await screen.findByRole("dialog");
    expect(screen.queryByTestId("config-apply-needs-key")).toBeNull();
    expect(dialog).toHaveTextContent(CONFIG_PATH);
    expect(dialog).toHaveTextContent(/backed up first/);
    const preview = within(dialog).getByTestId("config-apply-preview");
    expect(preview).toHaveTextContent('experimental_bearer_token = "sk-****wxyz"');
    expect(preview).not.toHaveTextContent("<API-KEY>");
    expect(dialog).not.toHaveTextContent(GOOD_KEY);
    expect(within(dialog).getAllByRole("button", { name: /What does this do/ })).not.toHaveLength(
      0,
    );
    expect(mockInvoke).not.toHaveBeenCalledWith("apply_codex_config", expect.anything());

    // confirm → the real key is written (memory only), success shows path + backup
    fireEvent.click(within(dialog).getByRole("button", { name: "Write file" }));
    await waitFor(() =>
      expect(mockInvoke).toHaveBeenCalledWith("apply_codex_config", {
        request: {
          content: expect.stringContaining(`experimental_bearer_token = "${GOOD_KEY}"`) as string,
        },
      }),
    );
    expect(mockInvoke).not.toHaveBeenCalledWith("apply_codex_config", {
      request: { content: expect.stringContaining("<API-KEY>") as string },
    });
    const applied = await screen.findByTestId("config-applied");
    expect(applied).toHaveTextContent(CONFIG_PATH);
    expect(applied).toHaveTextContent(BACKUP_PATH);
    expect(screen.queryByRole("dialog")).toBeNull();
    // the screen still never shows the real key
    expect(document.body).not.toHaveTextContent(GOOD_KEY);

    // restore: confirm first (destructive), then the newest backup is put back
    fireEvent.click(screen.getByTestId("config-restore"));
    const restoreDialog = await screen.findByRole("dialog");
    expect(restoreDialog).toHaveTextContent(BACKUP_PATH);
    expect(mockInvoke).not.toHaveBeenCalledWith("restore_codex_config");
    fireEvent.click(within(restoreDialog).getByRole("button", { name: "Restore backup" }));
    await waitFor(() => expect(mockInvoke).toHaveBeenCalledWith("restore_codex_config"));
    expect(await screen.findByTestId("config-restored")).toHaveTextContent(CONFIG_PATH);
  });
});
