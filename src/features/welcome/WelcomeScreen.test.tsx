import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import i18n from "@/i18n";
import { useWizardStore } from "@/stores/wizard";
import { mockInvoke } from "@/test/mocks/tauri";
import { Stepper } from "@/components/layout/Stepper";
import { WelcomeScreen } from "./WelcomeScreen";

describe("quick setup entry", () => {
  beforeEach(async () => {
    useWizardStore.getState().reset();
    await i18n.changeLanguage("en");
  });

  it("starts quick setup with no install, network or file operation", () => {
    render(<WelcomeScreen />);
    fireEvent.click(screen.getByRole("button", { name: "Configure API now" }));
    expect(useWizardStore.getState().step).toBe("configure");
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it("does not show skipped steps as completed", () => {
    useWizardStore.getState().startSetup("quick");
    render(<Stepper />);
    expect(screen.getAllByRole("button")).toHaveLength(4);
    expect(screen.getByRole("button", { name: i18n.t("steps.configure") })).toHaveAttribute(
      "aria-current",
      "step",
    );
    expect(
      screen.queryByRole("button", { name: i18n.t("steps.env_check") }),
    ).not.toBeInTheDocument();
  });

  it("disables quick setup when all tools are unchecked", () => {
    useWizardStore.getState().setSelectedTools([]);
    render(<WelcomeScreen />);
    expect(screen.getByRole("button", { name: "Configure API now" })).toBeDisabled();
  });

  it("discloses sponsorship and supports Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    render(<WelcomeScreen />);
    expect(screen.getByRole("button", { name: "直接配置 API" })).toBeInTheDocument();
    expect(screen.getByText(/SeedRouter 是本项目赞助方/)).toBeInTheDocument();
  });
});
