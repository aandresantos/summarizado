import type { CaptureResult } from "./types";

export type CaptureRequestMessage = { type: "CAPTURE_REQUEST" };

export type CaptureResponseMessage = CaptureResult;

export const isCaptureRequestMessage = (
  message: unknown,
): message is CaptureRequestMessage => {
  if (typeof message !== "object" || message === null) {
    return false;
  }

  return "type" in message && message.type === "CAPTURE_REQUEST";
};
