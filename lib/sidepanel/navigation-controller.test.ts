import { describe, expect, it } from "vitest";

import { createSidepanelNavigationController } from "./navigation-controller";

describe("createSidepanelNavigationController", () => {
  it("opens the sidepanel and disables it when the associated tab starts navigating", async () => {
    const openedTabs: number[] = [];
    const disabledTabs: number[] = [];
    const controller = createSidepanelNavigationController({
      openPanel: async (tabId) => {
        openedTabs.push(tabId);
      },
      disablePanel: async (tabId) => {
        disabledTabs.push(tabId);
      },
    });

    await controller.openForTab(7);
    await controller.handleTabUpdated(7, { status: "loading" });
    await controller.handleTabUpdated(7, { status: "loading" });

    expect(openedTabs).toEqual([7]);
    expect(disabledTabs).toEqual([7]);
  });

  it("does not close the sidepanel when a different tab starts navigating", async () => {
    const closedTabs: number[] = [];
    const controller = createSidepanelNavigationController({
      openPanel: async () => {},
      closePanel: async (tabId) => {
        closedTabs.push(tabId);
      },
      disablePanel: async () => {},
    });

    await controller.openForTab(7);
    await controller.handleTabUpdated(8, { status: "loading" });

    expect(closedTabs).toEqual([]);
  });

  it("does not close the sidepanel for non-loading tab updates", async () => {
    const closedTabs: number[] = [];
    const controller = createSidepanelNavigationController({
      openPanel: async () => {},
      closePanel: async (tabId) => {
        closedTabs.push(tabId);
      },
      disablePanel: async () => {},
    });

    await controller.openForTab(7);
    await controller.handleTabUpdated(7, { status: "complete" });
    await controller.handleTabUpdated(7, {});

    expect(closedTabs).toEqual([]);
  });

  it("disables the sidepanel when closePanel is not available", async () => {
    const disabledTabs: number[] = [];
    const controller = createSidepanelNavigationController({
      openPanel: async () => {},
      disablePanel: async (tabId) => {
        disabledTabs.push(tabId);
      },
    });

    await controller.openForTab(7);
    await controller.handleTabUpdated(7, { status: "loading" });

    expect(disabledTabs).toEqual([7]);
  });
});
