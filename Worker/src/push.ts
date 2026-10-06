import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { supabaseAdmin } from './supabaseClient.js';
import type { AlertaUsuario } from './varredura.js';

/**
 * Envio de push via Firebase Admin SDK (FCM HTTP v1).
 *
 * Credenciais: lidas de GOOGLE_APPLICATION_CREDENTIALS
 * (./firebase-service-account.json), carregada do .env pelo config.ts.
 */
initializeApp({
  credential: applicationDefault(),
});

/** Códigos que indicam token inválido/desregistrado → remover do banco. */
const TOKEN_INVALIDO = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/invalid-argument',
]);

/** Monta o corpo curto da notificação. */
function montarCorpo(alerta: AlertaUsuario): string {
  const [primeiro, ...resto] = alerta.itens;
  const hoje = new Date().toISOString().slice(0, 10);
  const quando = primeiro.data_estimada_termino <= hoje
    ? 'já acabou ou acaba hoje'
    : `deve acabar em ${primeiro.data_estimada_termino.split('-').reverse().join('/')}`;

  const extra = resto.length > 0 ? ` (+${resto.length} outro(s) item(ns))` : '';
  return `${primeiro.nome} ${quando}${extra}.`;
}

/**
 * Envia a notificação para todos os tokens do usuário e remove
 * da tabela `fcm_tokens` os tokens que o Firebase rejeitar como inválidos.
 */
export async function enviarPush(alerta: AlertaUsuario): Promise<void> {
  if (alerta.tokens.length === 0) return;

  const response = await getMessaging().sendEachForMulticast({
    tokens: alerta.tokens,
    notification: {
      title: 'Aviso de Validade / Estoque',
      body: montarCorpo(alerta),
    },
    android: { priority: 'high' },
  });

  console.log(`  📲 Push ${alerta.userId}: ${response.successCount} enviado(s), ${response.failureCount} falha(s)`);

  // ── Limpeza de tokens inválidos ───────────────────────────
  const invalidos: string[] = [];
  response.responses.forEach((r, i) => {
    if (!r.success && r.error && TOKEN_INVALIDO.has(r.error.code)) {
      invalidos.push(alerta.tokens[i]);
    } else if (!r.success) {
      console.warn(`  ⚠️  Falha de envio (${r.error?.code}): ${r.error?.message}`);
    }
  });

  if (invalidos.length > 0) {
    const { error } = await supabaseAdmin.from('fcm_tokens').delete().in('token', invalidos);
    if (error) {
      console.error('  ❌ Erro ao remover tokens inválidos:', error.message);
    } else {
      console.log(`  🧹 ${invalidos.length} token(s) inválido(s) removido(s).`);
    }
  }
}
