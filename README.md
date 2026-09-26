# Sistema de Gerenciamento e Controle de Estoque

Sistema web voltado ao gerenciamento de itens, controle de suprimentos e previsão de consumo com base em ciclos de duração por unidade. A aplicação adota arquitetura moderna baseada em computação em nuvem, separação clara entre cliente e servidor e segurança a nível de linha de dados (Row Level Security).

---

## 1. Visão Geral do Projeto

O objetivo do sistema é permitir que usuários cadastrem, monitorem e analisem a durabilidade de seus suprimentos. A plataforma calcula automaticamente estimativas de término com base nas datas de compra, quantidades disponíveis e parâmetros de duração unitária, fornecendo previsibilidade para reposições.

---

## 2. Tecnologias Utilizadas

### Front-end
- **React.js:** Biblioteca para construção da interface de usuário modular e reativa.
- **TypeScript / JavaScript:** Linguagem base de tipagem e lógica da aplicação.
- **Supabase Client SDK (`@supabase/supabase-js`):** Camada de integração direta com serviços de autenticação e banco de dados.

### Back-end & Banco de Dados
- **Supabase:** Plataforma Backend-as-a-Service (BaaS).
- **PostgreSQL:** Banco de dados relacional para persistência dos dados.
- **Row Level Security (RLS):** Regras de isolamento de dados no próprio banco, garantindo que cada usuário acerte somente seus próprios registros.
- **Supabase Auth:** Gerenciamento seguro de autenticação (e-mail, senha forte e redefinição via código OTP numérico).

---

## 3. Metodologia de Desenvolvimento e Fluxo com Agentes de IA

Este projeto adota um fluxo de trabalho estruturado de engenharia assistida por inteligência artificial, dividindo responsabilidades entre planejamento estratégico e execução de código:

### Arquitetura de Prompts e Planejamento (Gemini)
- Atua como arquiteto de software, gestor de backlog e engenheiro de contexto.
- Responsável por decompor funcionalidades macro em tarefas atômicas e idempotentes.
- Formula prompts técnicos detalhados e estruturados, contendo regras de negócio, limites de escopo e instruções de validação de código pré-existente.

### Execução e Codificação (Claude Opus via Antigravity no VS Code)
- Atua como o agente autônomo de implementação integrado diretamente ao ambiente de desenvolvimento (VS Code).
- O agente consome o arquivo `CONTEXTO.md` como fonte central de verdade do sistema, operando sob uma diretriz estrita de escopo restrito a cada etapa definida pelo prompt gerado.
- Executa scripts SQL, cria componentes React, integra clientes de API e valida idempotência sem realizar alterações destrutivas em implementações já funcionais.

---

## 4. Estrutura do Banco de Dados

### Tabela `itens`
Armazena os dados dos suprimentos de cada usuário:
- `id` (UUID): Identificador único do item.
- `nome` (Text): Nome ou descrição do suprimento.
- `quantidade` (Integer / Numeric): Quantidade atual em posse.
- `duracao_dias_unidade` (Integer): Média de dias que uma unidade dura em uso.
- `data_compra` (Date / Timestamptz): Registro da data de aquisição.
- `data_estimada_termino` (Date / Timestamptz): Previsão gerada para o término do item.
- `user_id` (UUID): Chave estrangeira referenciando `auth.users(id)` com integridade referencial em cascata.

### Políticas de Segurança (Row Level Security)
O acesso à tabela `itens` é blindado por RLS, onde operações de `SELECT`, `INSERT`, `UPDATE` e `DELETE` dependem exclusivamente da condição `auth.uid() = user_id`.

---

## 5. Autenticação e Segurança

- **Credenciais:** Login com e-mail e senha.
- **Política de Senhas:** Validação obrigatória de no mínimo 6 caracteres, contendo pelo menos uma letra maiúscula, um dígito numérico e um caractere especial (`!@#$%`).
- **Recuperação de Acesso:** Fluxo de redefinição por código OTP (One-Time Password) de 6 dígitos enviado por e-mail, dispensando links mágicos diretos.
- **Controle de Sessão:** Gerenciamento de rotas protegidas no front-end por verificação contínua do estado da sessão via `onAuthStateChange`.

---

## 6. Configuração do Ambiente

1. Clone o repositório:
```bash
git clone [https://github.com/seu-usuario/seu-repositorio.git](https://github.com/seu-usuario/seu-repositorio.git)
cd seu-repositorio