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

### [ID da Tarefa] - [Nome da Tarefa]
- **Data da Revisão:** YYYY-MM-DD
- **Veredito:** [APROVADO | AJUSTES NECESSÁRIOS]
- **Arquivos Auditados:**
  - `caminho/do/arquivo.ext`
- **Validações Realizadas:**
  - [x] Conformidade de escopo com CONTEXTO.md
  - [x] Inexistência de segredos no código
  - [x] Verificação de integridade da tipagem e build
- **Observações / Correções Aplicadas:**
  - Descrição breve de eventuais ajustes finos executados pelo revisor.

---