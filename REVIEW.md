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

### [TASK-04] - Listagem de Estoque (ItemList) e Indicadores Visuais de Validade
- **Data da Revisão:** 2026-09-28
- **Veredito:** APROVADO COM AJUSTES
- **Arquivos Auditados:**
  - `Aplicativo/src/components/ItemList.tsx`
  - `Aplicativo/src/components/ItemList.css`
  - `Aplicativo/src/pages/HomePage.tsx`
  - `Aplicativo/src/styles/variables.css`
- **Validações Realizadas:**
  - [x] Conformidade de escopo com `CONTEXTO.md` (Dashboard do estoque atual implementado com listagem reativa e indicativos visuais sutis para itens próximos do término ou zerados).
  - [x] Inexistência de segredos no código (Consulta via `fetchItens` com RLS `auth.uid() = user_id`).
  - [x] Verificação de integridade da tipagem e build (`npm run build` executado com 0 erros).
  - [x] Design System e Tokens (Inclusão de `--color-warning` em `variables.css` e estilização minimalista em Dark Mode).
- **Observações / Correções Aplicadas:**
  - **Ação Corretiva Direta (Cálculo de Dias Restantes):** Ajustada a fórmula em `ItemList.tsx` (`getDiasRestantes`) para utilizar `Math.round` em vez de `Math.ceil`, garantindo precisão em comparações de datas e neutralizando variações mínimas em transições de horário de verão.
  - Veredito final: APROVADO COM AJUSTES (ajuste fino preventivo de arredondamento temporal aplicado com sucesso).

### [TASK-05] - Worker de Notificações em Background (Node.js, Cron e SMTP)
- **Data da Revisão:** 2026-09-29
- **Veredito:** APROVADO COM AJUSTES
- **Arquivos Auditados:**
  - `Worker/src/config.ts`
  - `Worker/src/supabaseClient.ts`
  - `Worker/src/mailer.ts`
  - `Worker/src/worker.ts`
  - `Worker/package.json`
  - `Worker/tsconfig.json`
  - `Worker/.env.example`
  - `Worker/.gitignore`
- **Validações Realizadas:**
  - [x] Conformidade de escopo com `CONTEXTO.md` (Separação estrita de ambientes: back-end Node.js isolado na pasta `Worker/`; rotina periódica via `node-cron` para monitoramento de vencimento; consulta administrativa com `service_role_key` isolada no back-end; despacho de alertas via SMTP/e-mail agrupado por usuário).
  - [x] Inexistência de segredos no código (Arquivo `.env` contendo credenciais críticas mantido devidamente ignorado via `.gitignore`; variáveis carregadas estritamente por `process.env`).
  - [x] Verificação de integridade da tipagem e build (`npm run build` do Worker e do Aplicativo executados com 0 erros).
  - [x] Não-exposição de chaves sensíveis (A `SUPABASE_SERVICE_ROLE_KEY` permanece estritamente restrita ao ambiente do Worker).
- **Observações / Correções Aplicadas:**
  - **Ação Corretiva Direta (Restauração e Segurança de Arquivos):** Os arquivos fonte TypeScript em `Worker/src` e as configurações principais (`package.json`, `tsconfig.json`, `.gitignore`) encontravam-se vazios (0 bytes) e sem `.env.example`. Foi criado o `Worker/.gitignore` bloqueando dependências, builds e `.env`, e os arquivos `.ts` e configurações foram integralmente reconstituídos e tipados.
  - **Ação Corretiva Direta (Timezone no Limiar):** Implementada a função `formatToISO()` em `Worker/src/worker.ts` para utilizar extração local de data em vez de conversão direta via `toISOString()`, evitando discrepâncias de fuso horário.
  - Veredito final: APROVADO COM AJUSTES (correção crítica de fontes vazios, segurança de `.gitignore` e blindagem de timezone aplicadas com sucesso durante a auditoria).

### [TASK-06] - Módulo de Varredura de Estoque, Mapeamento FCM e Modo de Execução Única
- **Data da Revisão:** 2026-10-04
- **Veredito:** APROVADO COM AJUSTES
- **Arquivos Auditados:**
  - `Worker/src/varredura.ts`
  - `Worker/src/worker.ts`
  - `Worker/src/supabaseClient.ts`
  - `Worker/package.json`
  - `Worker/supabase/fcm_tokens.sql`
- **Validações Realizadas:**
  - [x] Conformidade de escopo com `CONTEXTO.md` (Separação modular da varredura diária de itens próximos da validade/vencidos, preparação para envio de push notification mapeando tokens FCM dos usuários afetados, preservação do canal de fallback de e-mail).
  - [x] Inexistência de segredos no código (Uso estrito de `supabaseAdmin` em ambiente back-end via `service_role_key`; credenciais mantidas em variáveis de ambiente).
  - [x] Verificação de integridade da tipagem e build (`npm run build` do Worker e do Aplicativo compilados com 0 erros).
  - [x] Segurança de Banco / RLS (Criação de DDL idempotente para `fcm_tokens` com RLS habilitado e policies restritas a `auth.uid() = user_id`).
- **Observações / Correções Aplicadas:**
  - **Ação Corretiva Direta (Restauração de Arquivos):** Os arquivos `Worker/src/varredura.ts` e `Worker/supabase/fcm_tokens.sql` foram criados inicialmente com 0 bytes no ambiente, provocando quebra de imports em `Worker/src/worker.ts`. O código TypeScript de varredura foi integralmente reconstituído e o script SQL estruturado com tabelas, índices e políticas de Row Level Security.
  - Veredito final: APROVADO COM AJUSTES (correção de arquivos vazios e implementação do schema SQL de tokens FCM concluídas com sucesso).

### [TASK-07] - Configuração e Inicialização do Capacitor Android (Mobile)
- **Data da Revisão:** 2026-10-06
- **Veredito:** APROVADO
- **Arquivos Auditados:**
  - `Aplicativo/capacitor.config.ts`
  - `Aplicativo/package.json`
  - `Aplicativo/package-lock.json`
  - `Aplicativo/tsconfig.node.json`
  - `Aplicativo/android/`
- **Validações Realizadas:**
  - [x] Conformidade de escopo com `CONTEXTO.md` (Implementação da infraestrutura mobile via Capacitor para empacotamento do React em APK Android; `appId` configurado como `com.controledomestico.app`, `webDir` apontando para o bundle de produção `dist/`, e `backgroundColor` `#121220` Dark Mode prevenindo flash branco na WebView).
  - [x] Inexistência de segredos no código (Nenhuma chave privada, credencial ou keystore exposta; template `.gitignore` do Android cobre `local.properties`, `*.jks`, `*.keystore` e diretórios de build).
  - [x] Verificação de integridade da tipagem e build (`npm run build` do Aplicativo e do Worker executados com 0 erros; inclusão de `capacitor.config.ts` no `tsconfig.node.json` validada).
  - [x] Ausência de regressão (Configurações de compilação web e scripts Vite preservados integralmente).
- **Observações / Correções Aplicadas:**
  - Todos os arquivos e dependências encontram-se íntegros, sem necessidade de intervenções corretivas imediatas.
  - Veredito final: APROVADO.

---