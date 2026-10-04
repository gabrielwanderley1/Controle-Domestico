import { config } from './config.js';
import { supabaseAdmin } from './supabaseClient.js';

/**
 * Varredura diária de validade.
 *
 * Usa o cliente administrativo (service_role), que ignora o RLS,
 * para consultar itens de TODOS os usuários sem precisar de sessão.
 */
export interface ItemAlerta {
  id: string;
  nome: string;
  quantidade: number;
  data_estimada_termino: string;
  user_id: string;
}

/** Resultado da varredura: um registro por usuário afetado. */
export interface AlertaUsuario {
  userId: string;
  itens: ItemAlerta[];
  tokens: string[];
}

/** Retorna data no formato YYYY-MM-DD (fuso local). */
function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * 1. Busca itens com término até hoje + ALERT_DAYS_THRESHOLD (inclui vencidos)
 * 2. Agrupa por user_id
 * 3. Busca os tokens FCM desses usuários
 */
export async function varrerItensVencendo(): Promise<AlertaUsuario[]> {
  const limite = new Date();
  limite.setDate(limite.getDate() + config.alertDaysThreshold);
  const limiteISO = toISODate(limite);

  console.log(`  🔎 Buscando itens com término ≤ ${limiteISO} e quantidade > 0...`);

  // ── 1. Itens no critério de alerta ──────────────────────────
  const { data: itens, error: itensError } = await supabaseAdmin
    .from('itens')
    .select('id, nome, quantidade, data_estimada_termino, user_id')
    .not('data_estimada_termino', 'is', null)
    .lte('data_estimada_termino', limiteISO)
    .gt('quantidade', 0)
    .order('data_estimada_termino', { ascending: true });

  if (itensError) {
    throw new Error(`Erro ao consultar itens: ${itensError.message}`);
  }

  const lista = (itens ?? []) as ItemAlerta[];
  console.log(`  📦 Itens encontrados: ${lista.length}`);

  if (lista.length === 0) {
    return [];
  }

  // ── 2. Agrupamento por usuário ──────────────────────────────
  const porUsuario = new Map<string, ItemAlerta[]>();
  for (const item of lista) {
    const grupo = porUsuario.get(item.user_id) ?? [];
    grupo.push(item);
    porUsuario.set(item.user_id, grupo);
  }

  const userIds = [...porUsuario.keys()];
  console.log(`  👤 Usuários mapeados: ${userIds.length}`);

  // ── 3. Tokens FCM dos usuários afetados ─────────────────────
  const { data: tokens, error: tokensError } = await supabaseAdmin
    .from('fcm_tokens')
    .select('user_id, token')
    .in('user_id', userIds);

  if (tokensError) {
    throw new Error(`Erro ao consultar fcm_tokens: ${tokensError.message}`);
  }

  const tokensPorUsuario = new Map<string, string[]>();
  for (const row of (tokens ?? []) as { user_id: string; token: string }[]) {
    const grupo = tokensPorUsuario.get(row.user_id) ?? [];
    grupo.push(row.token);
    tokensPorUsuario.set(row.user_id, grupo);
  }

  console.log(`  📱 Tokens identificados: ${tokens?.length ?? 0}`);

  // ── Resultado consolidado ───────────────────────────────────
  const resultado: AlertaUsuario[] = userIds.map((userId) => ({
    userId,
    itens: porUsuario.get(userId) ?? [],
    tokens: tokensPorUsuario.get(userId) ?? [],
  }));

  for (const r of resultado) {
    const nomes = r.itens.map((i) => `${i.nome} (${i.data_estimada_termino})`).join(', ');
    const status = r.tokens.length > 0
      ? `${r.tokens.length} token(s) pronto(s) para envio`
      : 'sem token FCM registrado';
    console.log(`    • ${r.userId}: ${r.itens.length} item(ns) [${nomes}] → ${status}`);
  }

  return resultado;
}
