import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Alert, ErrorBanner, Spinner } from "@/components/ui";
import { useAsync } from "@/hooks";
import { getConfigGuide } from "@/lib/tauri";
import type { ConfigGuide, GuideBranch, ToolId } from "@/lib/types";

import { AccountPathCard } from "./AccountPathCard";
import { CcSwitchImportCard } from "./CcSwitchImportCard";
import { CodexConfigCard } from "./CodexConfigCard";
import { CodexFastUiCard } from "./CodexFastUiCard";
import { GuideStepList } from "./GuideStepList";
import { ProviderValuesCard } from "./ProviderValuesCard";

export interface ToolGuideProps {
  tool: ToolId;
  simple?: boolean;
}

/**
 * Walkthrough for one tool: loads `get_config_guide(tool)` and renders the editable provider
 * card (with the integrated connectivity test), the one-click CC Switch import and the manual
 * steps. Mount it with `key={tool}` so switching tabs remounts everything — including the API
 * key, which lives only in this subtree's state and must not survive a tab change.
 */
export function ToolGuide({ tool, simple = false }: ToolGuideProps) {
  const { t } = useTranslation();
  const guide = useAsync(getConfigGuide);
  const { run } = guide;

  useEffect(() => {
    void run(tool);
  }, [run, tool]);

  if (guide.error) {
    return <ErrorBanner error={guide.error} onRetry={() => void run(tool)} />;
  }
  if (!guide.data) {
    return (
      <div className="flex items-center gap-3 py-8 text-sm text-neutral-500">
        <Spinner size="sm" />
        {t("guide:loading", { tool: t(`tools.${tool}`) })}
      </div>
    );
  }

  return <LoadedGuide guide={guide.data} simple={simple} />;
}

/**
 * The loaded walkthrough; owns the editable values (and the in-memory API key) and, for Codex,
 * the account path: `chatgpt_login` (CC Switch "OpenAI Official" preset + sign in) or `api_key`
 * (custom provider with the gateway key). The path is session state only — never persisted.
 */
function LoadedGuide({ guide, simple }: { guide: ConfigGuide; simple: boolean }) {
  const { t } = useTranslation();
  const [detailed, setDetailed] = useState(!simple);
  const isCodex = guide.tool === "codex";
  const [branch, setBranch] = useState<GuideBranch>("api_key");
  const activeBranch: GuideBranch | null = isCodex ? branch : null;
  const [providerName, setProviderName] = useState(guide.preset.providerName);
  const [baseUrl, setBaseUrl] = useState(guide.preset.baseUrl);
  const [model, setModel] = useState(guide.preset.modelHint);
  const [apiKey, setApiKey] = useState("");
  // Resolved per tool by the Rust core: Anthropic Messages for Claude Code.
  const protocol = guide.preset.protocol;

  return (
    <div className="space-y-5" data-testid={`tool-guide-${guide.tool}`}>
      {simple && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={detailed}
            onChange={(event) => {
              setDetailed(event.target.checked);
              setBranch("api_key");
            }}
          />
          {t("guide:quick.detailed")}
        </label>
      )}
      {detailed && isCodex && (
        <Alert variant="info" data-testid="codex-client-note">
          {t("guide:codexClientNote")}
        </Alert>
      )}
      {detailed && isCodex && <AccountPathCard branch={branch} onChange={setBranch} />}
      <ProviderValuesCard
        simple={!detailed}
        tool={guide.tool}
        preset={guide.preset}
        branch={activeBranch}
        probeProtocol={protocol}
        providerName={providerName}
        onProviderNameChange={setProviderName}
        baseUrl={baseUrl}
        onBaseUrlChange={setBaseUrl}
        model={model}
        onModelChange={setModel}
        apiKey={apiKey}
        onApiKeyChange={setApiKey}
      />
      {activeBranch !== "chatgpt_login" && (
        <CcSwitchImportCard
          tool={guide.tool}
          providerName={providerName}
          baseUrl={baseUrl}
          model={model}
          apiKey={apiKey}
        />
      )}
      <details
        open={detailed || undefined}
        className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
      >
        <summary className="cursor-pointer text-sm font-medium">{t("guide:quick.manual")}</summary>
        <div className="mt-4 space-y-5">
          {isCodex && (
            <CodexConfigCard
              preset={guide.preset}
              providerName={providerName}
              baseUrl={baseUrl}
              model={model}
              apiKey={apiKey}
            />
          )}
          <GuideStepList
            guide={guide}
            branch={activeBranch}
            live={{ providerName, baseUrl, model }}
            probe={{ baseUrl, apiKey, protocol }}
            onPickModel={setModel}
          />
        </div>
      </details>
      {/* Windows-only; the card renders nothing elsewhere (ADR-0007). Signed-in users get the
          speed option natively, so the patch is offered on the API-key path only. */}
      {detailed && activeBranch === "api_key" && <CodexFastUiCard />}
    </div>
  );
}
