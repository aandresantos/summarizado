type TabUpdateInfo = {
  status?: string;
};

type SidepanelNavigationControllerPorts = {
  openPanel: (tabId: number) => Promise<void>;
  closePanel?: (tabId: number) => Promise<void>;
  disablePanel: (tabId: number) => Promise<void>;
};

type SidepanelNavigationController = {
  openForTab: (tabId: number) => Promise<void>;
  handleTabUpdated: (
    tabId: number,
    changeInfo: TabUpdateInfo,
  ) => Promise<void>;
};

export const createSidepanelNavigationController = ({
  openPanel,
  closePanel,
  disablePanel,
}: SidepanelNavigationControllerPorts): SidepanelNavigationController => {
  let associatedTabId: number | null = null;

  const closeOrDisablePanel = async (tabId: number): Promise<void> => {
    if (closePanel !== undefined) {
      await closePanel(tabId);
      return;
    }

    await disablePanel(tabId);
  };

  return {
    openForTab: async (tabId) => {
      associatedTabId = tabId;
      await openPanel(tabId);
    },
    handleTabUpdated: async (tabId, changeInfo) => {
      if (associatedTabId === null) {
        return;
      }

      if (tabId !== associatedTabId) {
        return;
      }

      if (changeInfo.status !== "loading") {
        return;
      }

      associatedTabId = null;
      await closeOrDisablePanel(tabId);
    },
  };
};
