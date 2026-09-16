import { useMemo, useState } from "react";

import type { CaptureResponseMessage } from "../../lib/capture/messages";

type CaptureState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; result: CaptureResponseMessage }
  | { status: "failed"; message: string };

const getErrorMessage = (result: CaptureResponseMessage): string => {
  if (result.error === null) {
    return "";
  }

  if (result.error.type === "no-active-tab") {
    return "Nenhuma aba ativa encontrada.";
  }

  if (result.error.type === "restricted-page") {
    return "Esta pagina nao permite captura pela extensao.";
  }

  if (result.error.type === "unsupported-document-type") {
    return `Tipo de documento nao suportado: ${result.error.detail}`;
  }

  return "Nao foi possivel capturar esta pagina.";
};

export default function App() {
  const [captureState, setCaptureState] = useState<CaptureState>({
    status: "idle",
  });

  const result =
    captureState.status === "done" ? captureState.result : undefined;

  const htmlSize = useMemo(() => {
    if (result?.html === null || result?.html === undefined) {
      return "0 KB";
    }

    return `${(new Blob([result.html]).size / 1024).toFixed(1)} KB`;
  }, [result?.html]);

  const capturePage = async (): Promise<void> => {
    setCaptureState({ status: "loading" });

    try {
      const response = (await browser.runtime.sendMessage({
        type: "CAPTURE_REQUEST",
      })) as CaptureResponseMessage;

      setCaptureState({ status: "done", result: response });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro inesperado";
      setCaptureState({ status: "failed", message });
    }
  };

  return (
    <main className="flex min-h-screen w-full flex-col bg-zinc-50 text-zinc-950">
      <header className="border-b border-zinc-200 px-4 py-3">
        <h1 className="text-base font-semibold">Summarizado</h1>
      </header>

      <section className="flex flex-col gap-3 px-4 py-4">
        <button
          className="inline-flex h-10 items-center justify-center rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
          disabled={captureState.status === "loading"}
          onClick={() => void capturePage()}
          type="button"
        >
          {captureState.status === "loading" ? "Capturando..." : "Capturar HTML"}
        </button>

        {captureState.status === "failed" && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {captureState.message}
          </p>
        )}

        {result !== undefined && (
          <div className="flex flex-col gap-3">
            <div
              className={
                result.status === "error"
                  ? "rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                  : "rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
              }
            >
              {result.status === "error"
                ? getErrorMessage(result)
                : `Captura concluida (${htmlSize})`}
            </div>

            <dl className="grid grid-cols-[72px_1fr] gap-x-2 gap-y-1 text-xs text-zinc-600">
              <dt>URL</dt>
              <dd className="break-all text-zinc-800">{result.meta.url}</dd>
              <dt>Tipo</dt>
              <dd className="text-zinc-800">{result.meta.contentType}</dd>
            </dl>

            <textarea
              className="min-h-[60vh] w-full resize-y rounded-md border border-zinc-300 bg-white p-3 font-mono text-xs leading-5 text-zinc-900 outline-none focus:border-emerald-600"
              readOnly
              value={result.html ?? ""}
            />
          </div>
        )}
      </section>
    </main>
  );
}
