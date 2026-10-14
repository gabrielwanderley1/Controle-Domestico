import './config.js'; // carrega o .env antes de inicializar o Firebase Admin
import { supabaseAdmin } from './supabaseClient.js';
import { enviarPush } from './push.js';

/**
 * Teste manual de push — NÃO envia e-mail e não depende do cron.
 *
 * Uso:
 *   npm run test-push                 → envia para todos os tokens cadastrados
 *   npm run test-push -- <user_id>    → envia só para os aparelhos desse usuário
 */
const userIdFiltro = process.argv[2];

let query = supabaseAdmin.from('fcm_tokens').select('user_id, token');
if (userIdFiltro) query = query.eq('user_id', userIdFiltro);

const { data, error } = await query;

if (error) {
  console.error('❌ Erro ao consultar fcm_tokens:', error.message);
} else if (!data || data.length === 0) {
  console.warn('⚠️  Nenhum token em fcm_tokens. Abra o app no celular, faça login e aceite a permissão de notificações.');
} else {
  const porUsuario = new Map<string, string[]>();
  for (const row of data as { user_id: string; token: string }[]) {
    porUsuario.set(row.user_id, [...(porUsuario.get(row.user_id) ?? []), row.token]);
  }

  const hoje = new Date().toISOString().slice(0, 10);
  for (const [userId, tokens] of porUsuario) {
    await enviarPush({
      userId,
      tokens,
      itens: [{ id: 'teste', nome: 'Teste de notificação', quantidade: 1, data_estimada_termino: hoje, user_id: userId }],
    });
  }
}

