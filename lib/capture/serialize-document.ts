import type { DocumentStrategy } from "./types";

export const serializeDocument = (
  document: Document,
  strategy: Exclude<DocumentStrategy, "unsupported">,
): string => {
  if (strategy === "html") {
    return document.documentElement.outerHTML;
  }

  if (strategy === "xhtml") {
    return new XMLSerializer().serializeToString(document);
  }

  return (document.body.textContent ?? "").replace(/\r\n?/g, "\n");
};
