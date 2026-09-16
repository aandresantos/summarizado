import type { CaptureWarning } from "./types";

export const detectCrossOriginIframes = (
  document: Document,
): CaptureWarning | null => {
  const iframes = Array.from(document.querySelectorAll("iframe"));
  let crossOriginIframeCount = 0;

  for (const iframe of iframes) {
    try {
      if (iframe.contentDocument === null) {
        crossOriginIframeCount += 1;
      }
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "SecurityError") {
        crossOriginIframeCount += 1;
        continue;
      }

      throw error;
    }
  }

  if (crossOriginIframeCount === 0) {
    return null;
  }

  return {
    type: "cross-origin-iframe",
    count: crossOriginIframeCount,
  };
};
