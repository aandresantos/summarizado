# Spec 001 — Captura de conteúdo da página

**Status:** Aprovado para implementação (TDD)
**Projeto:** Extensão Chrome (WXT + TailwindCSS/Vite + TypeScript)

## 1. Objetivo

Ao clique manual do usuário (popup ou action da extensão), capturar o conteúdo
HTML da página ativa, com fallback visível de erro quando a captura falhar ou
for parcial.

## 2. Gatilho

- Sempre manual: clique no ícone/popup da extensão. **Nada roda
  automaticamente** — a extração só acontece depois que a página já foi
  aberta e o usuário aciona a captura.
- Permissão necessária: **`activeTab`** (suficiente, já que não há execução
  automática nem background).
- Nenhum listener de mudança de DOM, nenhuma re-captura automática.

## 3. Escopo de formatos

| Tipo de documento (`document.contentType`) | Estratégia |
|---|---|
| `text/html` | `document.documentElement.outerHTML` |
| `application/xhtml+xml` | `XMLSerializer` (mais correto que `outerHTML` para XML bem formado) |
| `text/plain` | `document.body.textContent`, normalizando quebras de linha |
| PDF (viewer nativo do Chrome) | **Fora de escopo neste spec.** Detectar e retornar erro explícito `unsupported-document-type` |
| Páginas restritas (`chrome://`, Web Store, etc.) | Scripting bloqueado pelo Chrome → erro `restricted-page` antes mesmo de tentar |

## 4. Iframes cross-origin

- Content script não acessa `contentDocument` de iframes de outra origem
  (restrição do navegador).
- Comportamento: capturar o documento principal normalmente, detectar a
  presença de iframes cross-origin (`contentDocument` retorna `null` /
  lança `SecurityError`), e sinalizar isso no resultado.
- UI deve exibir aviso: **"Captura parcial — este conteúdo pode estar
  incompleto (contém elementos de outra origem que não puderam ser
  lidos)"**.

## 5. Escopo da captura

- Sempre a página inteira (não há suporte a "capturar só a seleção" neste
  spec).

## 6. Formato de saída

Por ora, o resultado é **HTML bruto** (sem conversão para Markdown). A
conversão para Markdown fica para um spec futuro, quando for implementado o
recurso de download — o ponto de extensão previsto é um módulo separado
(`lib/capture/html-to-markdown.ts`) que consome `CaptureResult.html`, sem
tocar no restante do pipeline.

```ts
interface CaptureResult {
  status: "success" | "partial" | "error";
  html: string | null;
  warnings: CaptureWarning[];
  error: CaptureError | null;
  meta: {
    url: string;
    contentType: string;
    capturedAt: string; // ISO timestamp
  };
}

type CaptureWarning = { type: "cross-origin-iframe"; count: number };

type CaptureError =
  | { type: "unsupported-document-type"; detail: string } // ex: PDF
  | { type: "restricted-page" }
  | { type: "serialization-failed"; detail: string }
  | { type: "no-active-tab" };
```

## 7. Contrato de mensagens

- Popup dispara: `chrome.runtime.sendMessage({ type: "CAPTURE_REQUEST" })`
- Content script (injetado sob demanda via `scripting.executeScript` no
  clique) responde com `CaptureResult`.
- Popup renderiza `status`:
  - `success` → mostra preview do HTML capturado.
  - `partial` → mostra preview + banner de aviso (ver seção 4).
  - `error` → mostra mensagem amigável por tipo de erro (sem stack trace
    pro usuário final).

## 8. Estrutura de arquivos (WXT)

```
entrypoints/
  popup/
    App.tsx
    capture-status.tsx      // componente de UI para success/partial/error
  content/
    index.ts                // ponto de injeção sob demanda
lib/
  capture/
    types.ts                 // CaptureResult, CaptureWarning, CaptureError, DocumentStrategy
    detect-document-type.ts
    serialize-document.ts
    detect-cross-origin-iframes.ts
    capture.ts               // orquestra tudo, retorna CaptureResult
```

Separação proposital: cada arquivo em `lib/capture` tem uma única
responsabilidade (detecção de tipo, serialização, detecção de iframe,
orquestração) — facilita testar cada peça isoladamente.

## 9. Plano de testes (TDD — escritos antes da implementação)

**Lógica pura (Vitest, sem mocks de browser):**
- `detect-document-type`: dado um `contentType`, retorna a estratégia
  correta (html/xhtml/plain-text/unsupported). ✅ **Implementado.**

**DOM (Vitest + jsdom/happy-dom):**
- `serialize-document`: dado um DOM montado, retorna o HTML/XHTML/texto
  correto conforme o tipo.
- `detect-cross-origin-iframes`: dado um DOM com iframes same-origin e
  cross-origin simulados, conta corretamente os cross-origin.

**Integração com `chrome.*` (mock via fake-browser ou similar do WXT):**
- Fluxo completo: popup envia mensagem → content script responde → popup
  recebe `CaptureResult`.
- Página restrita: `scripting.executeScript` falha → popup mostra erro
  `restricted-page`.
- Nenhuma aba ativa: mensagem enviada sem tab válida → erro
  `no-active-tab`.

**Casos de erro cobertos individualmente:**
- PDF → `unsupported-document-type`
- Serialização lança exceção → `serialization-failed`
- Página com iframe cross-origin → `status: "partial"` + warning correto

## 10. Fora de escopo (explicitamente adiado)

- Suporte a PDF.
- Conversão para Markdown / download do conteúdo capturado.
- Captura de apenas texto selecionado.
- Qualquer execução automática/background.