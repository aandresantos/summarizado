# AGENT.md

Instruções para qualquer agente (Claude Code incluso) trabalhando neste
repositório.

## 1. Projeto

Extensão para Chrome ("Summarizando") construída com:

- **Framework de extensão:** WXT
- **Bundler:** Vite
- **Linguagem:** TypeScript
- **Estilo:** TailwindCSS (utility-first)

O objetivo geral do projeto é capturar o conteúdo de páginas web sob
comando manual do usuário e, futuramente, permitir exportação/edição desse
conteúdo.

## 2. Fluxo de trabalho obrigatório: spec-first + TDD

Este projeto é desenvolvido em specs numeradas (`spec-NNN-*.md`), uma por
funcionalidade. Antes de escrever qualquer código:

1. **Nunca comece a implementar sem uma spec aprovada.** Se não existir
   spec para a tarefa pedida, pare e peça para criar/revisar uma antes de
   codar.
2. **Escreva os testes antes da implementação (TDD).** Ordem esperada:
   - escrever o teste (deve falhar — "red");
   - rodar o teste e confirmar que falha pelo motivo certo;
   - escrever a implementação mínima para passar ("green");
   - rodar novamente e confirmar sucesso;
   - só então refatorar, se necessário.
3. **Não assuma requisitos não especificados.** Se a spec deixar uma
   decisão em aberto (ex: formato de saída, escopo de um caso de erro),
   pare e pergunte em vez de escolher por conta própria.
4. Specs já fechadas devem ser tratadas como fonte de verdade — mudanças
   de comportamento exigem atualizar a spec, não só o código.

## 3. Padrões de código (aplicam-se a todo código gerado ou editado)

- **TypeScript com tipagem forte.** Nunca usar `any`; preferir `unknown`
  ou tipos específicos. Sem justificativa explícita, `any` não é aceito
  em nenhuma circunstância.
- **Early return:** validar condições de erro/casos base no início da
  função, evitando `else` desnecessário e aninhamento de `if`.
- **Responsabilidade única (SRP):** componentes, funções e módulos devem
  ter uma responsabilidade bem definida. Evitar módulos "faz-tudo";
  separar lógica de negócio (hooks/funções utilitárias) da apresentação.
- **Nomenclatura declarativa:**
  - variáveis: `isLoading`, `hasPermission`, etc. — o nome já diz o que
    guardam;
  - funções: descrevem a ação/retorno (`fetchUserData`, `isValidEmail`);
  - componentes React: PascalCase, descritivos (`CaptureStatus`);
  - booleanos: prefixos `is`, `has`, `should`.
- **Imutabilidade:** preferir dados imutáveis, principalmente em estado.
- **Sem dependências externas novas sem justificativa explícita e
  aprovação.** Se uma funcionalidade parecer exigir uma lib nova, pare e
  pergunte antes de instalar — não assuma que está liberado.
- **Sem CSS customizado** (CSS Modules, styled-components, etc.) a menos
  que explicitamente pedido — usar classes utilitárias do Tailwind.
- **Sem código "mágico" ou desnecessariamente complexo.** Priorizar
  soluções simples e legíveis.
- Comentários JSDoc/TSDoc em funções, classes e tipos complexos.
- Manter consistência com `eslint`/`prettier` do projeto, se configurados
  (incluindo ordenação de classes Tailwind, se houver
  `prettier-plugin-tailwindcss`).

## 4. Segurança e permissões (específico desta extensão)

- A extensão **nunca executa nada automaticamente** — toda ação de
  captura é disparada por um clique explícito do usuário, depois que a
  página já está aberta.
- Preferir sempre o escopo mínimo de permissão necessário (ex:
  `activeTab` em vez de `host_permissions` amplas), a menos que uma spec
  futura justifique o contrário.

## 5. Estado atual do projeto

- **Spec 001 (captura de conteúdo da página):** aprovada. Decisões
  fixadas: PDF fora de escopo por ora; iframes cross-origin geram aviso
  de "captura parcial"; formato de saída é HTML bruto (conversão para
  Markdown fica para uma spec futura); escopo é sempre a página inteira
  (sem suporte a seleção de texto).
- Módulo `lib/capture/detect-document-type.ts` já implementado e testado
  (9 testes passando).
- Próximo módulo na fila: `serialize-document` (requer DOM —
  jsdom/happy-dom nos testes).