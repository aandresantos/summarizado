import type { CaptureResult } from "../lib/capture/types";
import { isCaptureRequestMessage } from "../lib/capture/messages";
import { createSidepanelNavigationController } from "../lib/sidepanel/navigation-controller";

const createErrorResult = (
  error: CaptureResult["error"],
  url = "",
  contentType = "",
): CaptureResult => ({
  status: "error",
  html: null,
  warnings: [],
  error,
  meta: {
    url,
    contentType,
    capturedAt: new Date().toISOString(),
  },
});

const isRestrictedUrl = (url: string): boolean => {
  return (
    url.startsWith("chrome://") ||
    url.startsWith("chrome-extension://") ||
    url.startsWith("edge://") ||
    url.startsWith("about:") ||
    url.startsWith("devtools://") ||
    url.startsWith("https://chrome.google.com/webstore") ||
    url.startsWith("https://chromewebstore.google.com")
  );
};

const captureActivePage = async (): Promise<CaptureResult> => {
  const [activeTab] = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });

  if (activeTab?.id === undefined) {
    return createErrorResult({ type: "no-active-tab" });
  }

  if (activeTab.url !== undefined && isRestrictedUrl(activeTab.url)) {
    return createErrorResult({ type: "restricted-page" }, activeTab.url);
  }

  try {
    const [injectionResult] = await browser.scripting.executeScript({
      target: { tabId: activeTab.id },
      func: (): CaptureResult => {
        const contentType = document.contentType;
        const meta = {
          url: window.location.href,
          contentType,
          capturedAt: new Date().toISOString(),
        };

        if (contentType !== "text/html") {
          return {
            status: "error",
            html: null,
            warnings: [],
            error: {
              type: "unsupported-document-type",
              detail: contentType,
            },
            meta,
          };
        }

        return {
          status: "success",
          html: document.documentElement.outerHTML,
          warnings: [],
          error: null,
          meta,
        };
      },
    });

    if (injectionResult?.result === undefined) {
      return createErrorResult({ type: "serialization-failed", detail: "" });
    }

    return injectionResult.result;
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : "Unknown error";

    return createErrorResult(
      { type: "serialization-failed", detail },
      activeTab.url,
    );
  }
};

export default defineBackground(() => {
  const sidepanelNavigationController = createSidepanelNavigationController({
    openPanel: async (tabId) => {
      const setOptionsPromise = browser.sidePanel.setOptions({
        tabId,
        path: "sidepanel.html",
        enabled: true,
      });
      const openPromise = browser.sidePanel.open({
        tabId,
      });

      await setOptionsPromise;
      await openPromise;
    },
    disablePanel: async (tabId) => {
      await browser.sidePanel.setOptions({
        tabId,
        enabled: false,
      });
    },
  });

  browser.action.onClicked.addListener(async (tab) => {
    if (!tab?.id) return;

    try {
      await sidepanelNavigationController.openForTab(tab.id);
    } catch (error: unknown) {
      console.error("Failed to open sidepanel", error);
    }
  });

  browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
    void sidepanelNavigationController
      .handleTabUpdated(tabId, changeInfo)
      .catch((error: unknown) => {
        console.error("Failed to disable sidepanel after navigation", error);
      });
  });

  browser.runtime.onMessage.addListener((message: unknown) => {
    if (!isCaptureRequestMessage(message)) {
      return;
    }

    return captureActivePage();
  });
});
