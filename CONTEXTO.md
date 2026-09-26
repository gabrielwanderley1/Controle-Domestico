# 📱 Sistema de Controle Doméstico - Documentação Base

**Objetivo Central:** Aplicativo mobile (desenvolvido com tecnologias web) para gestão minimalista de estoque doméstico. O sistema calcula a previsão de término de itens e envia notificações antes que acabem.
**Nível de Complexidade:** Iniciante/Intermediário. O código deve ser simples, limpo e direto, utilizando padrões básicos do React e Node.js.

## 🛠️ Stack Tecnológica
- **Front-end:** React (Single Page Application).
- **Estilização:** CSS puro ou módulos CSS (foco em simplicidade).
- **Back-end:** Node.js com Express.
- **Banco de Dados & Autenticação:** Supabase.
- **Mobile:** Capacitor (para envelopar o React e gerar o APK Android).

## ⚙️ Arquitetura e Regras de Negócio
- **Segurança do Banco:** O acesso ao Supabase no front-end deve ser feito exclusivamente com a `anon_key`. Ações críticas, regras de negócio pesadas e manipulação irrestrita de dados devem ficar obrigatoriamente isoladas no back-end (Node.js).
- **Cálculo de Estoque:** Todo cálculo de validade e previsão de baixa de estoque deve cruzar as colunas `data_compra`, `quantidade` e `duracao_dias_unidade`.
- **Separação de Ambientes:** O front-end e o back-end devem ser mantidos em subpastas isoladas ou rodar em portas distintas (ex: Node na porta 3000, React/Vite na porta 5173).

## 🎨 UI/UX e Design System
- **Identidade Visual:** Temática escura (Dark Mode), confortável aos olhos, minimalista e objetiva. Sem excesso de bordas ou cores vibrantes.
- **Navegação (SPA):** A transição entre telas deve ser fluida e sem recarregamentos da página. O usuário deve sentir que as informações apenas deslizam ou surgem na mesma tela.
- **Sistema de Feedback (Pop-ups):** 
  - **PROIBIDO** o uso do `alert()` nativo do navegador.
  - Qualquer erro deve disparar um componente de Pop-up/Toast customizado seguindo o design escuro do app.
  - Ações bem-sucedidas (como editar ou adicionar itens) devem obrigatoriamente exibir o pop-up com a mensagem exata: *"Alterações salvas com sucesso!"*.

## 🔐 Autenticação e Sessão (Supabase Auth)
- **Login/Cadastro:** Feito exclusivamente via E-mail e Senha.
- **Persistência de Sessão:** O usuário deve se manter logado permanentemente. O React deve checar a sessão ativa no `localStorage` via Supabase ao abrir o app e redirecionar direto para o estoque.
- **Recuperação de Senha:** Implementar fluxo de "Esqueci minha senha" utilizando o modelo OTP (One-Time Password / Código de 6 dígitos) disparado por e-mail pelo Supabase.

## 📱 Estrutura de Telas (Views)
1. **Tela de Autenticação:** Contém Login, botão para Cadastro e botão "Esqueci minha senha".
2. **Estoque Atual (Dashboard):** Lista os itens cadastrados. Itens próximos da validade ou de zerar devem ter um indicativo visual sutil.
3. **Gestão de Estoque:** Tela (ou modal) para adicionar um novo item, retirar uma unidade ou editar propriedades (quantidade atual, duração estimada em dias).
4. **Configurações:** Tela simples contendo a opção de alterar a senha e o botão de Logout.

## 🔔 Sistema de Notificações
- O Back-end (Node.js) terá uma rotina (cron job) que verifica diariamente a tabela do Supabase.
- Quando a `data_estimada_termino` de um item estiver muito próxima da data atual, o sistema deve disparar uma notificação push para o celular do usuário informando que o item está prestes a zerar.

## 🤖 Diretrizes para o Agente de IA (Antigravity)
1. **Simplicidade:** Evite bibliotecas complexas de gerenciamento de estado (como Redux) a menos que seja estritamente necessário. Prefira a Context API ou passagem de props.
2. **Modularidade:** Separe o Pop-up de feedback em um componente isolado (`FeedbackPopup.jsx`) para que possa ser chamado facilmente de qualquer tela.
3. **Consistência:** Sempre valide as rotas e proteja as telas internas para que apenas usuários autenticados consigam acessá-las.