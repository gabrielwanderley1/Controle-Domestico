import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { cert, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

/** Retorna data no formato YYYY-MM-DD no fuso horário local. */
function toLocalISODate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

console.log('══════════════════════════════════════════════════════════');
console.log('  🔬 TESTE E AUDITORIA DE PUSH NOTIFICATION (E2E)');
console.log('══════════════════════════════════════════════════════════');

// 1. Inicializar Firebase Admin SDK lendo firebase-service-account.json
const serviceAccountPath = path.resolve(
  process.cwd(),
  process.env.GOOGLE_APPLICATION_CREDENTIALS || './firebase-service-account.json',
);
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));

initializeApp({
  credential: cert(serviceAccount),
});
console.log(`✅ Firebase Admin inicializado (project_id: ${serviceAccount.project_id})`);

// 2. Inicializar cliente Supabase (service_role)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

// 3. Buscar todos os tokens na tabela fcm_tokens
const { data: tokens, error: tokensError } = await supabase
  .from('fcm_tokens')
  .select('id, user_id, token, created_at, updated_at')
  .order('updated_at', { ascending: false });

if (tokensError) {
  console.error('❌ Erro ao consultar fcm_tokens:', tokensError.message);
  process.exit(1);
}

console.log(`\n📱 Tabela fcm_tokens: ${tokens.length} registro(s) encontrado(s)`);
for (const t of tokens) {
  console.log(
    `   • id=${t.id} | user_id=${t.user_id} | updated_at=${t.updated_at} | token=${t.token.slice(0, 28)}...`,
  );
}

// 4. Buscar itens na tabela itens e auditar o filtro de data_estimada_termino
const threshold = parseInt(process.env.ALERT_DAYS_THRESHOLD ?? '3', 10);
const hojeISO = toLocalISODate(new Date());
const limiteDate = new Date();
limiteDate.setDate(limiteDate.getDate() + threshold);
const limiteISO = toLocalISODate(limiteDate);

const { data: todosItens, error: itensError } = await supabase
  .from('itens')
  .select('id, nome, quantidade, duracao_dias_unidade, data_compra, data_estimada_termino, user_id')
  .order('data_estimada_termino', { ascending: true });

if (itensError) {
  console.error('❌ Erro ao consultar itens:', itensError.message);
  process.exit(1);
}

console.log(`\n📦 Tabela itens: ${todosItens.length} item(ns) no total`);
console.log(`   Data local (hoje): ${hojeISO} | Limite de alerta (≤ +${threshold}d): ${limiteISO}`);
for (const item of todosItens) {
  const elegivel =
    item.data_estimada_termino !== null &&
    item.data_estimada_termino <= limiteISO &&
    item.quantidade > 0;
  console.log(
    `   • "${item.nome}" | qtd=${item.quantidade} | término=${item.data_estimada_termino} | entra no alerta diário (≤ ${limiteISO})? ${elegivel ? 'SIM ✅' : 'NÃO (ainda longe do vencimento)'}`,
  );
}

// 5. Disparar notificação de teste imediata para cada token via admin.messaging().send(...)
if (tokens.length === 0) {
  console.warn('\n⚠️  Nenhum token encontrado em fcm_tokens para disparo.');
} else {
  console.log('\n🚀 Disparando Push Notification de teste via admin.messaging().send(...)...');
  const tokensInvalidos = [];

  for (const t of tokens) {
    try {
      const response = await getMessaging().send({
        token: t.token,
        notification: {
          title: '🔔 Teste Controle Doméstico',
          body: `Push FCM ativo! (${todosItens.length} itens monitorados no seu estoque)`,
        },
        android: {
          priority: 'high',
          notification: {
            channelId: 'default',
            sound: 'default',
          },
        },
      });
      console.log(`   ✅ SUCESSO [token id=${t.id}]: messageId = ${response}`);
    } catch (err) {
      console.error(
        `   ❌ FALHA [token id=${t.id}]: code = ${err.code} | message = ${err.message}`,
      );
      if (
        err.code === 'messaging/registration-token-not-registered' ||
        err.code === 'messaging/invalid-registration-token' ||
        err.code === 'messaging/invalid-argument'
      ) {
        tokensInvalidos.push(t.token);
      }
    }
  }

  if (tokensInvalidos.length > 0) {
    const { error: delError } = await supabase
      .from('fcm_tokens')
      .delete()
      .in('token', tokensInvalidos);
    if (!delError) {
      console.log(`   🧹 ${tokensInvalidos.length} token(s) órfão(s)/desregistrado(s) removido(s) de fcm_tokens.`);
    }
  }
}

console.log('\n══════════════════════════════════════════════════════════\n');
