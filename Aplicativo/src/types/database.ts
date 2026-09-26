/**
 * Tipagens da tabela `itens` do Supabase.
 * Espelha a estrutura definida em supabase/schema.sql.
 */

/** Registro completo retornado pelo Supabase (SELECT). */
export interface Item {
  id: string;
  nome: string;
  quantidade: number;
  duracao_dias_unidade: number | null;
  data_compra: string | null;           // ISO date string (YYYY-MM-DD)
  data_estimada_termino: string | null;  // ISO date string (YYYY-MM-DD)
  user_id: string;
}

/** Payload para inserção de um novo item (INSERT). */
export interface ItemInsert {
  nome: string;
  quantidade: number;
  duracao_dias_unidade?: number | null;
  data_compra?: string | null;
  data_estimada_termino?: string | null;
  // user_id é preenchido automaticamente pelo DEFAULT auth.uid()
}

/** Payload para atualização parcial de um item (UPDATE). */
export interface ItemUpdate {
  nome?: string;
  quantidade?: number;
  duracao_dias_unidade?: number | null;
  data_compra?: string | null;
  data_estimada_termino?: string | null;
}
