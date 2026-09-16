export type DocumentStrategy = "html" | "xhtml" | "plain-text" | "unsupported";

export type CaptureWarning = { type: "cross-origin-iframe"; count: number };

export type CaptureError =
  | { type: "unsupported-document-type"; detail: string }
  | { type: "restricted-page" }
  | { type: "serialization-failed"; detail: string }
  | { type: "no-active-tab" };

export interface CaptureResult {
  status: "success" | "partial" | "error";
  html: string | null;
  warnings: CaptureWarning[];
  error: CaptureError | null;
  meta: {
    url: string;
    contentType: string;
    capturedAt: string;
  };
}
