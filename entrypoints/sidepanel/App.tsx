import { useMemo, useState } from "react";

import type { CaptureResponseMessage } from "../../lib/capture/messages";

type CaptureState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; result: CaptureResponseMessage }
  | { status: "failed"; message: string };

type RelatedLink = {
  favicon: string;
  title: string;
  domain: string;
};

const MOCK_LINKS: RelatedLink[] = [
  {
    favicon:
      "https://www.google.com/s2/favicons?domain=developer.mozilla.org&sz=32",
    title: "Closures - JavaScript | MDN Web Docs",
    domain: "developer.mozilla.org",
  },
  {
    favicon: "https://www.google.com/s2/favicons?domain=javascript.info&sz=32",
    title: "Closures in Modern JavaScript: A Deep Dive",
    domain: "javascript.info",
  },
  {
    favicon: "https://www.google.com/s2/favicons?domain=medium.com&sz=32",
    title: "How V8 Handles Closures Under the Hood",
    domain: "medium.com",
  },
  {
    favicon:
      "https://www.google.com/s2/favicons?domain=stackoverflow.com&sz=32",
    title: "What is a closure, exactly? - Stack Overflow",
    domain: "stackoverflow.com",
  },
  {
    favicon: "https://www.google.com/s2/favicons?domain=web.dev&sz=32",
    title: "Performance Patterns with Closures - web.dev",
    domain: "web.dev",
  },
];

const getErrorMessage = (result: CaptureResponseMessage): string => {
  if (result.error === null) {
    return "";
  }

  if (result.error.type === "no-active-tab") {
    return "Nenhuma aba ativa encontrada.";
  }

  if (result.error.type === "restricted-page") {
    return "Esta página não permite captura pela extensão.";
  }

  if (result.error.type === "unsupported-document-type") {
    return `Tipo de documento não suportado: ${result.error.detail}`;
  }

  return "Não foi possível capturar esta página.";
};

const getDomain = (url: string): string => {
  if (url.length === 0) {
    return "página atual";
  }

  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

const getPageTitle = (html: string | null, fallbackUrl: string): string => {
  if (html !== null) {
    const parsedDocument = new DOMParser().parseFromString(html, "text/html");
    const title = parsedDocument.querySelector("title")?.textContent?.trim();

    if (title !== undefined && title.length > 0) {
      return title;
    }
  }

  if (fallbackUrl.length === 0) {
    return "Página capturada";
  }

  return getDomain(fallbackUrl);
};

const getHtmlSize = (html: string | null | undefined): string => {
  if (html === null || html === undefined) {
    return "0 KB";
  }

  return `${(new Blob([html]).size / 1024).toFixed(1)} KB`;
};

function Header() {
  return (
    <header className="app-header">
      <div className="brand-mark" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="2" y="3" width="12" height="1.8" fill="#F8FAFC" />
          <rect x="2" y="7" width="9" height="1.8" fill="#F8FAFC" />
          <rect x="2" y="11" width="10.5" height="1.8" fill="#22B37D" />
        </svg>
      </div>
      <span className="brand-name">Summarizando</span>
      <span className="brand-version">v1.0</span>
    </header>
  );
}

function InitialState({
  isLoading,
  onResume,
}: {
  isLoading: boolean;
  onResume: () => void;
}) {
  return (
    <section className="initial-state" aria-labelledby="initial-title">
      <div className="intro-copy">
        <div className="intro-icon" aria-hidden="true">
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
            <rect x="5" y="6" width="20" height="2.5" fill="#94A3B8" />
            <rect x="5" y="12" width="14" height="2.5" fill="#94A3B8" />
            <rect x="5" y="18" width="17" height="2.5" fill="#22B37D" />
            <rect x="5" y="24" width="10" height="2.5" fill="#CBD5E1" />
          </svg>
        </div>
        <h1 id="initial-title" className="sr-only">
          Resumo inteligente da página aberta
        </h1>
        <p>
          Gere um resumo inteligente da página aberta, com links relacionados
          selecionados automaticamente.
        </p>
      </div>

      <div className="url-chip">
        <span className="url-chip-status" aria-hidden="true" />
        <span>página atual do navegador</span>
      </div>

      <button
        className="neo-btn-primary main-action"
        disabled={isLoading}
        onClick={onResume}
        type="button"
      >
        {isLoading ? "Resumindo..." : "Resumir"}
      </button>

      <div className="privacy-note">
        {["Conteúdo processado localmente", "Nenhum dado armazenado"].map(
          (text) => (
            <div className="privacy-row" key={text}>
              <span aria-hidden="true" />
              <small>{text}</small>
            </div>
          ),
        )}
      </div>
    </section>
  );
}

function SkeletonBlock({
  width = "100%",
  height = 14,
}: {
  width?: string | number;
  height?: number;
}) {
  return (
    <div
      className="skeleton"
      style={{ width, height, flexShrink: 0 }}
      aria-hidden="true"
    />
  );
}

function LoadingState() {
  return (
    <>
      <div className="progress-track" aria-hidden="true">
        <div className="progress-bar-anim" />
      </div>

      <section className="scroll-area panel-content" aria-live="polite">
        <div className="neo-card page-card skeleton-card">
          <div className="inline-row">
            <SkeletonBlock width={18} height={18} />
            <SkeletonBlock width="55%" height={11} />
          </div>
          <SkeletonBlock width="80%" height={13} />
          <SkeletonBlock height={96} />
        </div>

        <div className="neo-card summary-skeleton">
          <SkeletonBlock width="28%" height={10} />
          <div className="stack-lines">
            <SkeletonBlock height={11} />
            <SkeletonBlock height={11} />
            <SkeletonBlock width="88%" height={11} />
            <SkeletonBlock width="70%" height={11} />
          </div>
        </div>

        <div className="related-group">
          <SkeletonBlock width="38%" height={10} />
          {Array.from({ length: 5 }).map((_, index) => (
            <div className="neo-card loading-link" key={index}>
              <SkeletonBlock width={16} height={16} />
              <div className="loading-link-copy">
                <SkeletonBlock height={11} />
                <SkeletonBlock width="45%" height={9} />
              </div>
            </div>
          ))}
        </div>

        <div className="status-line">
          <span aria-hidden="true" />
          <span>analisando página...</span>
        </div>
      </section>
    </>
  );
}

function PageContextCard({
  domain,
  htmlSize,
  title,
}: {
  domain: string;
  htmlSize: string;
  title: string;
}) {
  return (
    <article className="neo-card page-card">
      <div className="page-domain">
        <img
          src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
          alt=""
          width={16}
          height={16}
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
        <span>{domain}</span>
      </div>
      <p>{title}</p>
      <div className="thumbnail-placeholder">
        <span>{htmlSize} capturados</span>
      </div>
    </article>
  );
}

function SummaryBlock({ status }: { status: CaptureResponseMessage["status"] }) {
  const note =
    status === "partial"
      ? "A captura encontrou conteúdo parcial, mas o resumo simulado foi mantido para validar a experiência."
      : "O resumo abaixo ainda usa conteúdo mockado enquanto a etapa de geração inteligente não entra no fluxo.";

  return (
    <article className="summary-block">
      <header>
        <span>Resumo</span>
        <div aria-hidden="true" />
        <small>3 parágrafos</small>
      </header>
      <div className="summary-copy">
        <p>
          <strong>Closures</strong> são funções que lembram o escopo léxico no
          qual foram criadas, mesmo após esse escopo ter encerrado sua execução.
        </p>
        <p>
          Na prática, toda função JavaScript forma um closure com o ambiente
          externo que a contém, mantendo variáveis locais acessíveis mesmo
          quando a função externa já retornou.
        </p>
        <p>
          São amplamente usados para <strong>encapsulamento de estado</strong>,
          módulos, callbacks e memoização. Closures que retêm objetos grandes
          podem causar vazamentos de memória se não forem liberados.
        </p>
        <small>{note}</small>
      </div>
    </article>
  );
}

function RelatedLinks() {
  return (
    <section className="related-group" aria-labelledby="related-title">
      <h2 id="related-title">Links relacionados</h2>

      {MOCK_LINKS.map((link) => (
        <a
          className="neo-card related-link"
          href="#"
          key={`${link.domain}-${link.title}`}
          onClick={(event) => event.preventDefault()}
        >
          <img
            src={link.favicon}
            alt=""
            width={15}
            height={15}
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
          <span className="related-link-copy">
            <strong>{link.title}</strong>
            <small>{link.domain}</small>
          </span>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path
              d="M2.5 9.5L9.5 2.5M9.5 2.5H4M9.5 2.5V8"
              stroke="#CBD5E1"
              strokeLinecap="square"
              strokeWidth="1.5"
            />
          </svg>
        </a>
      ))}
    </section>
  );
}

function ErrorResult({
  message,
  onReset,
}: {
  message: string;
  onReset: () => void;
}) {
  return (
    <>
      <div className="progress-track is-error" aria-hidden="true" />
      <section className="scroll-area panel-content">
        <article className="error-card">
          <strong>Não foi possível resumir</strong>
          <p>{message}</p>
        </article>
        <ResetButton onReset={onReset} />
      </section>
    </>
  );
}

function ResultState({
  onReset,
  result,
}: {
  onReset: () => void;
  result: CaptureResponseMessage;
}) {
  const domain = useMemo(() => getDomain(result.meta.url), [result.meta.url]);
  const title = useMemo(
    () => getPageTitle(result.html, result.meta.url),
    [result.html, result.meta.url],
  );
  const htmlSize = useMemo(() => getHtmlSize(result.html), [result.html]);

  if (result.status === "error") {
    return <ErrorResult message={getErrorMessage(result)} onReset={onReset} />;
  }

  return (
    <>
      <div className="progress-complete" aria-hidden="true" />

      <section className="scroll-area panel-content">
        <PageContextCard domain={domain} htmlSize={htmlSize} title={title} />
        <SummaryBlock status={result.status} />
        <RelatedLinks />
        <ResetButton onReset={onReset} />
      </section>
    </>
  );
}

function ResetButton({ onReset }: { onReset: () => void }) {
  return (
    <div className="reset-area">
      <button className="neo-btn-secondary reset-button" onClick={onReset}>
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
          <path
            d="M2 7a5 5 0 105-5H4"
            stroke="#1E293B"
            strokeLinecap="square"
            strokeWidth="1.5"
          />
          <path
            d="M4 2L2 4l2 2"
            stroke="#1E293B"
            strokeLinecap="square"
            strokeWidth="1.5"
          />
        </svg>
        Resumir novamente
      </button>
    </div>
  );
}

export default function App() {
  const [captureState, setCaptureState] = useState<CaptureState>({
    status: "idle",
  });

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
    <main className="sidepanel-shell">
      <Header />
      {captureState.status === "idle" && (
        <InitialState isLoading={false} onResume={() => void capturePage()} />
      )}
      {captureState.status === "loading" && <LoadingState />}
      {captureState.status === "done" && (
        <ResultState
          onReset={() => setCaptureState({ status: "idle" })}
          result={captureState.result}
        />
      )}
      {captureState.status === "failed" && (
        <ErrorResult
          message={captureState.message}
          onReset={() => setCaptureState({ status: "idle" })}
        />
      )}
    </main>
  );
}
