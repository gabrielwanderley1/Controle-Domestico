import cron from 'node-cron';
import { config } from './config.js';
import { supabase } from './supabaseClient.js';
import { sendEmail, verifySmtpConnection } from './mailer.js';

interface ExpiringItem {
  id: string;
  nome: string;
  quantidade: number;
  data_estimada_termino: string | null;
  user_id: string;
}

/**
 * Worker de Notificações — Controle Doméstico
 *
 * Serviço autônomo de background que roda uma rotina periódica (cron job)
 * para verificar itens próximos do vencimento e enviar alertas por e-mail.
 *
 * NÃO expõe rotas HTTP — o front-end consome o Supabase diretamente via RLS.
 */
console.log('══════════════════════════════════════════');
console.log('  🏠 Controle Doméstico — Worker');
console.log('══════════════════════════════════════════');
console.log(`  📅 Cron schedule: ${config.cronSchedule}`);
console.log(`  ⏰ Alerta: itens vencendo em ≤ ${config.alertDaysThreshold} dias`);
console.log(`  🔗 Supabase: ${config.supabase.url}`);
console.log('──────────────────────────────────────────');

// ── Verificação SMTP na inicialização ──────────────────────
await verifySmtpConnection();

// ── Validação do cron schedule ─────────────────────────────
if (!cron.validate(config.cronSchedule)) {
  console.error(`❌ Expressão cron inválida: "${config.cronSchedule}"`);
  process.exit(1);
}

// ── Agendamento do job ─────────────────────────────────────
cron.schedule(config.cronSchedule, async () => {
  const timestamp = new Date().toISOString();
  console.log(`\n🔔 [${timestamp}] Executando verificação de estoque...`);

  try {
    await checkExpiringItems();
    console.log(`✅ [${timestamp}] Verificação concluída.`);
  } catch (error) {
    console.error(`❌ [${timestamp}] Erro na verificação:`, error);
  }
});

console.log('\n✅ Worker iniciado. Aguardando próxima execução do cron...\n');

// ── Lógica de verificação ──────────────────────────────────

/**
 * Busca itens de todos os usuários cuja `data_estimada_termino`
 * está dentro do limiar de alerta e envia e-mails de notificação.
 *
 * Usa a service_role key, que bypassa o RLS, permitindo leitura
 * global da tabela `itens` para verificar vencimentos.
 */
async function checkExpiringItems(): Promise<void> {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const limiar = new Date(hoje);
  limiar.setDate(limiar.getDate() + config.alertDaysThreshold);
  const limiarISO = formatToISO(limiar);

  // Busca itens com término ≤ limiar e quantidade > 0 (ainda em estoque)
  const { data: itens, error } = await supabase
    .from('itens')
    .select('id, nome, quantidade, data_estimada_termino, user_id')
    .lte('data_estimada_termino', limiarISO)
    .gt('quantidade', 0);

  if (error) {
    throw new Error(`Erro ao consultar itens: ${error.message}`);
  }

  if (!itens || itens.length === 0) {
    console.log('  ℹ️  Nenhum item próximo do vencimento encontrado.');
    return;
  }

  console.log(`  📦 ${itens.length} item(ns) próximo(s) do vencimento encontrado(s).`);

  // Agrupa itens por user_id para enviar um único e-mail por usuário
  const itensPorUsuario = new Map<string, ExpiringItem[]>();

  for (const item of (itens as ExpiringItem[])) {
    const lista = itensPorUsuario.get(item.user_id) ?? [];
    lista.push(item);
    itensPorUsuario.set(item.user_id, lista);
  }

  // Para cada usuário, busca o e-mail e envia a notificação
  for (const [userId, userItens] of itensPorUsuario) {
    const { data: userData, error: userError } = await supabase
      .auth.admin.getUserById(userId);

    if (userError || !userData?.user?.email) {
      console.warn(`  ⚠️  Não foi possível obter e-mail do usuário ${userId}`);
      continue;
    }

    const email = userData.user.email;
    const subject = `⚠️ ${userItens.length} item(ns) do estoque prestes a acabar`;
    const html = buildAlertEmailHtml(userItens);

    await sendEmail(email, subject, html);
  }
}

/**
 * Monta o corpo HTML do e-mail de alerta com a lista de itens.
 */
function buildAlertEmailHtml(itens: ExpiringItem[]): string {
  const rows = itens
    .map((item) => {
      const termino = item.data_estimada_termino
        ? formatDateBR(item.data_estimada_termino)
        : '—';

      return `<tr>
      <td style="padding: 8px; border-bottom: 1px solid #333;">${item.nome}</td>
      <td style="padding: 8px; border-bottom: 1px solid #333; text-align: center;">${item.quantidade}</td>
      <td style="padding: 8px; border-bottom: 1px solid #333; text-align: center;">${termino}</td>
    </tr>`;
    })
    .join('');

  return `
    <div style="font-family: -apple-system, sans-serif; background: #121220; color: #e0e0e0; padding: 24px; border-radius: 12px;">
      <h2 style="color: #e0a830; margin: 0 0 16px;">⚠️ Itens prestes a acabar</h2>
      <p style="color: #999; margin: 0 0 16px;">
        Os seguintes itens do seu estoque doméstico estão próximos da data de término:
      </p>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <thead>
          <tr style="border-bottom: 2px solid #333;">
            <th style="padding: 8px; text-align: left; color: #7c8aff;">Item</th>
            <th style="padding: 8px; text-align: center; color: #7c8aff;">Qtd</th>
            <th style="padding: 8px; text-align: center; color: #7c8aff;">Término</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      <p style="color: #666; font-size: 12px; margin: 16px 0 0;">
        Enviado automaticamente pelo Controle Doméstico.
      </p>
    </div>
  `;
}

/**
 * Formata data local para YYYY-MM-DD.
 */
function formatToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formata data ISO (YYYY-MM-DD) para DD/MM/YYYY.
 */
function formatDateBR(date: string): string {
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
}
