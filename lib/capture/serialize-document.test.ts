import { describe, expect, it } from "vitest";

import { serializeDocument } from "./serialize-document";

describe("serializeDocument", () => {
  it("serializes text/html documents with documentElement.outerHTML", () => {
    document.documentElement.innerHTML =
      '<head><title>Example</title></head><body><main data-id="content"><h1>Hello</h1></main></body>';

    expect(serializeDocument(document, "html")).toBe(
      '<html><head><title>Example</title></head><body><main data-id="content"><h1>Hello</h1></main></body></html>',
    );
  });

  it("serializes XHTML documents with XMLSerializer", () => {
    const xhtml = new DOMParser().parseFromString(
      '<html xmlns="http://www.w3.org/1999/xhtml"><body><br /></body></html>',
      "application/xhtml+xml",
    );

    expect(serializeDocument(xhtml, "xhtml")).toBe(
      '<html xmlns="http://www.w3.org/1999/xhtml"><body><br /></body></html>',
    );
  });

  it("serializes text/plain documents from body text with normalized line breaks", () => {
    document.body.textContent = "First line\r\nSecond line\rThird line";

    expect(serializeDocument(document, "plain-text")).toBe(
      "First line\nSecond line\nThird line",
    );
  });

  it("returns an empty string when a text/plain document has no body text", () => {
    document.body.textContent = null;

    expect(serializeDocument(document, "plain-text")).toBe("");
  });
});
