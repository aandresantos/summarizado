import { beforeEach, describe, expect, it, vi } from "vitest";

import { captureDocument } from "./capture";

const appendCrossOriginIframe = (): void => {
  const iframe = document.createElement("iframe");

  Object.defineProperty(iframe, "contentDocument", {
    configurable: true,
    get: () => null,
  });

  document.body.append(iframe);
};

describe("captureDocument", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-02T03:04:05.000Z"));

    Object.defineProperty(window, "location", {
      configurable: true,
      value: new URL("https://example.com/article"),
    });
  });

  it("returns a success result with serialized HTML and metadata", () => {
    document.documentElement.innerHTML =
      "<head></head><body><article>Readable content</article></body>";

    expect(captureDocument(document)).toEqual({
      status: "success",
      html: "<html><head></head><body><article>Readable content</article></body></html>",
      warnings: [],
      error: null,
      meta: {
        url: "https://example.com/article",
        contentType: "text/html",
        capturedAt: "2026-01-02T03:04:05.000Z",
      },
    });
  });

  it("returns a partial result when cross-origin iframes are present", () => {
    document.documentElement.innerHTML =
      "<head></head><body><article>Readable content</article></body>";
    appendCrossOriginIframe();

    const result = captureDocument(document);

    expect(result.status).toBe("partial");
    expect(result.warnings).toEqual([
      { type: "cross-origin-iframe", count: 1 },
    ]);
    expect(result.error).toBeNull();
    expect(result.html).toContain("<article>Readable content</article>");
  });

  it("returns unsupported-document-type for PDF viewer documents", () => {
    Object.defineProperty(document, "contentType", {
      configurable: true,
      value: "application/pdf",
    });

    expect(captureDocument(document)).toMatchObject({
      status: "error",
      html: null,
      warnings: [],
      error: {
        type: "unsupported-document-type",
        detail: "application/pdf",
      },
      meta: {
        url: "https://example.com/article",
        contentType: "application/pdf",
      },
    });
  });
});
