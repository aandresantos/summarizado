import type { DocumentStrategy } from "./types";

export const detectDocumentType = (contentType: string): DocumentStrategy => {
  if (contentType === "text/html") {
    return "html";
  }

  if (contentType === "application/xhtml+xml") {
    return "xhtml";
  }

  if (contentType === "text/plain") {
    return "plain-text";
  }

  return "unsupported";
};
