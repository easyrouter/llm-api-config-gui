/**
 * Wizard state — the single source of truth for "where the user is" and what has been
 * established so far (environment snapshot, chosen tools, verification outcome).
 *
 * Rules
 * - Never store an API key here (or anywhere). The key lives only in the local state of the
 *   Verify screen for the duration of one request.
 * - Steps are linear but the user may jump back; `furthestStep` gates forward navigation.
 * - `diagnose` is a panel inside the Verify screen, not a step of its own: every navigation
 *   request for it (`FixAction.go_to_step`, help links, docs `wizardStep`) lands on `verify`.
 * - `navigationLocked` is raised by a screen while work that must not be abandoned is running
 *   (an `npm install` job, an installer download); the Stepper and Back/Next honour it.
 */
import { create } from "zustand";

import type { EnvSnapshot, ToolId, VerifyResult, WizardStep } from "@/lib/types";

export const WIZARD_STEPS: readonly WizardStep[] = [
  "welcome",
  "env_check",
  "install",
  "configure",
  "verify",
  "done",
] as const;

/** The screen a navigation target actually shows (`diagnose` lives inside `verify`). */
export function normalizeStep(step: WizardStep): WizardStep {
  return step === "diagnose" ? "verify" : step;
}

/** Position of `step` in the linear flow (`diagnose` counts as `verify`). */
export function stepIndex(step: WizardStep): number {
  return WIZARD_STEPS.indexOf(normalizeStep(step));
}

export type SetupMode = "full" | "quick";

export function stepsForMode(mode: SetupMode): readonly WizardStep[] {
  return mode === "quick" ? ["welcome", "configure", "verify", "done"] : WIZARD_STEPS;
}

export interface WizardState {
  setupMode: SetupMode;
  startSetup: (mode: SetupMode) => void;
  step: WizardStep;
  furthestStep: WizardStep;
  selectedTools: ToolId[];
  telemetryOptIn: boolean;
  snapshot: EnvSnapshot | null;
  verifyResults: Partial<Record<ToolId, VerifyResult>>;
  helpOpen: boolean;
  helpSectionId: string | null;
  /**
   * Incremented on every `openHelp` call so the help panel can honour a request for the section
   * it already showed earlier (the id alone would not change).
   */
  helpRequestId: number;
  /** True while a screen runs work that would be orphaned by leaving it (see module doc). */
  navigationLocked: boolean;

  goTo: (step: WizardStep) => void;
  next: () => void;
  back: () => void;
  setSelectedTools: (tools: ToolId[]) => void;
  setTelemetryOptIn: (on: boolean) => void;
  setSnapshot: (snapshot: EnvSnapshot | null) => void;
  setVerifyResult: (tool: ToolId, result: VerifyResult) => void;
  openHelp: (sectionId?: string | null) => void;
  closeHelp: () => void;
  setNavigationLocked: (locked: boolean) => void;
  reset: () => void;
}

const initial = {
  setupMode: "full" as SetupMode,
  step: "welcome" as WizardStep,
  furthestStep: "welcome" as WizardStep,
  selectedTools: ["codex", "claude-code"] as ToolId[],
  telemetryOptIn: false,
  snapshot: null,
  verifyResults: {},
  helpOpen: false,
  helpSectionId: null,
  helpRequestId: 0,
  navigationLocked: false,
};

/** Previous/next step in the active flow, clamped at its boundaries. */
function adjacentStep(state: WizardState, offset: number): WizardStep {
  const steps = stepsForMode(state.setupMode);
  const index = steps.indexOf(normalizeStep(state.step));
  return steps[Math.min(Math.max(index + offset, 0), steps.length - 1)] ?? "welcome";
}

export const useWizardStore = create<WizardState>()((set, get) => ({
  ...initial,

  startSetup: (setupMode) => {
    if (get().navigationLocked || get().selectedTools.length === 0) return;
    const step = setupMode === "quick" ? "configure" : "env_check";
    set({ setupMode, step, furthestStep: step, snapshot: null, verifyResults: {} });
  },

  goTo: (target) =>
    set((s) => {
      const step = normalizeStep(target);
      return {
        step,
        setupMode: step === "env_check" || step === "install" ? "full" : s.setupMode,
        furthestStep: stepIndex(step) > stepIndex(s.furthestStep) ? step : s.furthestStep,
      };
    }),

  next: () => get().goTo(adjacentStep(get(), 1)),

  back: () => set({ step: adjacentStep(get(), -1) }),

  setSelectedTools: (tools) => set({ selectedTools: tools }),
  setTelemetryOptIn: (on) => set({ telemetryOptIn: on }),
  setSnapshot: (snapshot) => set({ snapshot }),
  setVerifyResult: (tool, result) =>
    set((s) => ({ verifyResults: { ...s.verifyResults, [tool]: result } })),
  openHelp: (sectionId = null) =>
    set((s) => ({ helpOpen: true, helpSectionId: sectionId, helpRequestId: s.helpRequestId + 1 })),
  closeHelp: () => set({ helpOpen: false }),
  setNavigationLocked: (locked) => set({ navigationLocked: locked }),
  reset: () => set({ ...initial }),
}));
