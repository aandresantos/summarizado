import { beforeEach, describe, expect, it } from "vitest";

import { detectCrossOriginIframes } from "./detect-cross-origin-iframes";

const appendIframe = (contentDocument: Document | null | Error): void => {
  const iframe = document.createElement("iframe");

  Object.defineProperty(iframe, "contentDocument", {
    configurable: true,
    get: () => {
      if (contentDocument instanceof Error) {
        throw contentDocument;
      }

      return contentDocument;
    },
  });

  document.body.append(iframe);
};

describe("detectCrossOriginIframes", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("returns no warning when the document has no iframes", () => {
    expect(detectCrossOriginIframes(document)).toBeNull();
  });

  it("does not count same-origin iframes", () => {
    appendIframe(document.implementation.createHTMLDocument("Same origin"));

    expect(detectCrossOriginIframes(document)).toBeNull();
  });

  it("counts iframes whose contentDocument is null", () => {
    appendIframe(null);
    appendIframe(document.implementation.createHTMLDocument("Same origin"));
    appendIframe(null);

    expect(detectCrossOriginIframes(document)).toEqual({
      type: "cross-origin-iframe",
      count: 2,
    });
  });

  it("counts iframes that throw a SecurityError when accessed", () => {
    appendIframe(new DOMException("Blocked", "SecurityError"));

    expect(detectCrossOriginIframes(document)).toEqual({
      type: "cross-origin-iframe",
      count: 1,
    });
  });
});
