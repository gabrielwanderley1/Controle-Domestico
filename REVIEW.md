# Diretrizes e Registro de Revisão Técnica (QA)

Este documento define os critérios de validação que devem ser inspecionados após a conclusão de qualquer tarefa técnica, bem como o histórico de auditoria das entregas.

---

## 1. Critérios Universais de Validação

Toda tarefa deve ser aprovada sob os seguintes pilares antes de ser considerada concluída:

1. **Aderência ao Escopo (`CONTEXTO.md`):**
   - O código implementa estritamente o que foi solicitado na tarefa?
   - Houve implementação prematura de módulos futuros descritos no `CONTEXTO.md`? (Se sim: reprovar).
2. **Idempotência e Não-Regressão:**
   - As alterações preservam arquivos e configurações existentes?
   - Há duplicação desnecessária de funções, tipos ou clientes de conexão?
3. **Segurança e Isolamento:**
   - Nenhum segredo, senha ou Service Role Token foi exposto em código versionável.
   - Chamadas ao banco respeitam o contexto do usuário autenticado e políticas de RLS.
4. **Qualidade de Código e Tipagem:**
   - Não há erros de sintaxe ou warnings críticos no terminal.
   - Padrões de nomenclatura e convenções do projeto foram mantidos.

---

## 2. Histórico de Auditorias

### [TASK-02] - Centralização de Design Tokens, Estilização Dark Mode e Assets Base
- **Data da Revisão:** 2026-09-26
- **Veredito:** APROVADO
- **Arquivos Auditados:**
  - `Aplicativo/src/styles/variables.css`
  - `Aplicativo/src/index.css`
  - `Aplicativo/src/components/FeedbackPopup.css`
  - `Aplicativo/src/pages/AuthPage.css`
  - `Aplicativo/src/pages/HomePage.css`
  - `Aplicativo/src/pages/HomePage.tsx`
  - `Aplicativo/public/favicon.svg`
  - `Aplicativo/.gitignore`
- **Validações Realizadas:**
  - [x] Conformidade de escopo com `CONTEXTO.md` (Design system Dark Mode, sem avanço prematuro para módulos futuros de estoque)
  - [x] Inexistência de segredos no código (Variáveis e `.gitignore` validados)
  - [x] Verificação de integridade da tipagem e build (`npm run build` executado com 0 erros)
  - [x] Resolução de referências de assets (Favicon SVG alinhado ao `index.html`)
- **Observações / Correções Aplicadas:**
  - Estilos migrados com sucesso para variáveis CSS globais (`variables.css`), garantindo padronização tipográfica, paleta Dark Mode e consistência em componentes (`FeedbackPopup`, `AuthPage`, `HomePage`).
  - Nenhuma inconsistência técnica ou quebra de build detectada.

### [TASK-03] - Formulário de Cadastro de Itens (AddItemForm) e Integração com Dashboard
- **Data da Revisão:** 2026-09-26
- **Veredito:** APROVADO COM AJUSTES
- **Arquivos Auditados:**
  - `Aplicativo/src/components/AddItemForm.tsx`
  - `Aplicativo/src/components/AddItemForm.css`
  - `Aplicativo/src/pages/HomePage.tsx`
  - `Aplicativo/src/pages/HomePage.css`
  - `Aplicativo/src/index.css`
  - `Aplicativo/src/pages/AuthPage.css`
- **Validações Realizadas:**
  - [x] Conformidade de escopo com `CONTEXTO.md` (Cálculo de término cruzando `data_compra`, `quantidade` e `duracao_dias_unidade`; mensagem exata *"Alterações salvas com sucesso!"*; sem `alert()` nativo; feedback via `FeedbackPopup`).
  - [x] Inexistência de segredos no código (Persistência via `insertItem` com RLS do Supabase).
  - [x] Verificação de integridade da tipagem e build (`npm run build` executado com 0 erros).
  - [x] Não-regressão e reutilização de estilos (Globalização do `.spinner-small` em `index.css`).
- **Observações / Correções Aplicadas:**
  - **Ação Corretiva Direta (Timezone):** Ajustadas as funções `getTodayISO()` e `calcularDataTermino()` em `AddItemForm.tsx` para operar com base na data do fuso horário local em vez de `toISOString()`, prevenindo deslocamentos involuntários de data em fusos horários negativos (ex: UTC-3).
  - Veredito final: APROVADO COM AJUSTES (correção de fuso horário realizada com sucesso durante a auditoria).

---