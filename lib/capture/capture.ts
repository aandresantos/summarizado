import type { CaptureResult } from "./types";
import { detectCrossOriginIframes } from "./detect-cross-origin-iframes";
import { detectDocumentType } from "./detect-document-type";
import { serializeDocument } from "./serialize-document";

const getDocumentUrl = (document: Document): string => {
  return document.defaultView?.location.href ?? "";
};

export const captureDocument = (document: Document): CaptureResult => {
  const contentType = document.contentType;
  const meta = {
    url: getDocumentUrl(document),
    contentType,
    capturedAt: new Date().toISOString(),
  };
  const strategy = detectDocumentType(contentType);

  if (strategy === "unsupported") {
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

  try {
    const html = serializeDocument(document, strategy);
    const warning = detectCrossOriginIframes(document);
    const warnings = warning === null ? [] : [warning];

    return {
      status: warnings.length > 0 ? "partial" : "success",
      html,
      warnings,
      error: null,
      meta,
    };
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : "Unknown error";

    return {
      status: "error",
      html: null,
      warnings: [],
      error: {
        type: "serialization-failed",
        detail,
      },
      meta,
    };
  }
};
