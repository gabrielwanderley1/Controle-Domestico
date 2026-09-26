import { supabase } from '../lib/supabaseClient';
import type { Item, ItemInsert, ItemUpdate } from '../types/database';

/**
 * Camada de serviço para operações CRUD diretas na tabela `itens` via Supabase.
 *
 * Todas as operações são protegidas por Row Level Security (RLS):
 * o client Supabase envia automaticamente o JWT da sessão ativa,
 * e o Supabase filtra os dados com `auth.uid() = user_id`.
 *
 * Isso dispensa um intermediário Node.js para rotinas básicas de CRUD.
 */

// ─── READ ────────────────────────────────────────────────────────────────────

/**
 * Lista todos os itens do usuário autenticado.
 * O RLS garante que apenas os itens do próprio usuário são retornados.
 *
 * @example
 * ```tsx
 * const itens = await fetchItens();
 * // itens: Item[] — somente do usuário logado
 * ```
 */
export async function fetchItens(): Promise<Item[]> {
  const { data, error } = await supabase
    .from('itens')
    .select('*')
    .order('nome', { ascending: true });

  if (error) throw error;
  return data as Item[];
}

/**
 * Busca um item específico pelo ID.
 * O RLS impede acesso a itens de outros usuários.
 *
 * @param id UUID do item.
 * @returns O item encontrado ou `null`.
 */
export async function fetchItemById(id: string): Promise<Item | null> {
  const { data, error } = await supabase
    .from('itens')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    // PGRST116 = "no rows returned" — item não existe ou não pertence ao usuário
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data as Item;
}

// ─── CREATE ──────────────────────────────────────────────────────────────────

/**
 * Insere um novo item para o usuário autenticado.
 * O campo `user_id` é preenchido automaticamente pelo DEFAULT `auth.uid()` no banco.
 *
 * @param item Dados do novo item (sem `id` e sem `user_id`).
 * @returns O item criado com todos os campos preenchidos.
 *
 * @example
 * ```tsx
 * const novoItem = await insertItem({
 *   nome: 'Arroz',
 *   quantidade: 5,
 *   duracao_dias_unidade: 30,
 *   data_compra: '2026-09-26',
 * });
 * ```
 */
export async function insertItem(item: ItemInsert): Promise<Item> {
  const { data, error } = await supabase
    .from('itens')
    .insert(item)
    .select()
    .single();

  if (error) throw error;
  return data as Item;
}

// ─── UPDATE ──────────────────────────────────────────────────────────────────

/**
 * Atualiza parcialmente um item existente.
 * O RLS garante que apenas itens do próprio usuário podem ser modificados.
 *
 * @param id UUID do item a ser atualizado.
 * @param changes Campos a atualizar (parcial).
 * @returns O item atualizado.
 *
 * @example
 * ```tsx
 * const atualizado = await updateItem('uuid-do-item', {
 *   quantidade: 3,
 * });
 * ```
 */
export async function updateItem(id: string, changes: ItemUpdate): Promise<Item> {
  const { data, error } = await supabase
    .from('itens')
    .update(changes)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Item;
}

// ─── DELETE ──────────────────────────────────────────────────────────────────

/**
 * Remove um item pelo ID.
 * O RLS impede exclusão de itens que não pertençam ao usuário autenticado.
 *
 * @param id UUID do item a ser removido.
 */
export async function deleteItem(id: string): Promise<void> {
  const { error } = await supabase
    .from('itens')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
