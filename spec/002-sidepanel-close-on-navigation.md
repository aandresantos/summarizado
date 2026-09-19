# Spec 002 - Fechar sidepanel ao navegar a aba

**Status:** Aprovado para implementacao (TDD)
**Projeto:** Extensao Chrome (WXT + TailwindCSS/Vite + TypeScript)

## 1. Objetivo

Quando o sidepanel da extensao estiver aberto para uma aba e essa aba navegar
para outra pagina, desabilitar automaticamente o sidepanel para evitar uma
tentativa de captura com a permissao temporaria `activeTab` ja revogada.

## 2. Contexto

A permissao `activeTab` e temporaria. Ela permite injetar script na aba ativa
apos um gesto explicito do usuario, como clicar no icone da extensao, mas pode
ser revogada quando a aba navega para outra origem.

Como o sidepanel permanece aberto entre navegacoes, o usuario pode clicar em
"Capturar HTML" depois de mudar de site. Nesse caso, a extensao tenta executar
`scripting.executeScript` sem permissao valida e a captura falha.

## 3. Comportamento esperado

- Ao clicar no icone da extensao, o background abre o sidepanel para a aba
  clicada e registra essa aba como a aba associada ao sidepanel.
- Se a aba associada ao sidepanel iniciar uma navegacao (`tabs.onUpdated` com
  `status: "loading"`), o background deve desabilitar o sidepanel para essa aba.
- Depois de desabilitar o sidepanel por navegacao, a aba deixa de ser
  considerada associada ao sidepanel.
- Navegacoes em outras abas nao devem fechar/desabilitar o sidepanel da aba
  associada.
- Atualizacoes que nao indiquem inicio de navegacao, como `status: "complete"`
  ou mudancas sem `status`, nao devem fechar/desabilitar o sidepanel.

## 4. Estrategia tecnica

- Manter a solucao sem `host_permissions` amplas.
- Usar `browser.tabs.onUpdated` no background para detectar navegacao da aba
  associada.
- Preferir uma abstracao testavel para a decisao de fechar/desabilitar o
  sidepanel, evitando testar diretamente APIs globais do browser quando a logica
  puder ser isolada.
- A acao de fechamento visual deve desabilitar o sidepanel da aba com
  `browser.sidePanel.setOptions({ tabId, enabled: false })`.
- Erros assincronos ao abrir ou desabilitar o sidepanel devem ser capturados no
  background para evitar rejeicoes nao tratadas.

## 5. Plano de testes

- Abrir o sidepanel registra a aba associada.
- `tabs.onUpdated` com a mesma aba e `status: "loading"` solicita a
  desabilitacao do sidepanel.
- Apos desabilitar por navegacao, uma segunda atualizacao da mesma aba nao deve
  tentar desabilitar novamente.
- `tabs.onUpdated` de outra aba nao deve desabilitar o sidepanel.
- `tabs.onUpdated` com `status: "complete"` nao deve desabilitar o sidepanel.

## 6. Fora de escopo

- Pedir `host_permissions` opcionais.
- Declarar `<all_urls>`.
- Capturar automaticamente ao abrir o sidepanel.
- Reabrir automaticamente o sidepanel apos navegacao.
