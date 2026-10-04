import cron from 'node-cron';
import { config } from './config.js';
import { supabaseAdmin } from './supabaseClient.js';
import { sendEmail, verifySmtpConnection } from './mailer.js';
import { varrerItensVencendo, type ItemAlerta } from './varredura.js';

type ExpiringItem = ItemAlerta;

/**
 * Worker de Notificações — Controle Doméstico
 *
 * Serviço autônomo de background que roda uma rotina diária (cron job)
 * para verificar itens próximos do vencimento, mapear os tokens FCM
 * dos usuários afetados e disparar alertas.
 *
 * NÃO expõe rotas HTTP — o front-end consome o Supabase diretamente via RLS.
 *
 * Uso: `npm start` (agendado) ou `npm run scan` (executa uma vez e sai).
 */
console.log('══════════════════════════════════════════');
console.log('  🏠 Controle Doméstico — Worker');
console.log('══════════════════════════════════════════');
console.log(`  📅 Cron schedule: ${config.cronSchedule}`);
console.log(`  ⏰ Alerta: itens vencendo em ≤ ${config.alertDaysThreshold} dias`);
console.log(`  🔗 Supabase: ${config.supabase.url}`);
console.log('──────────────────────────────────────────');

const runOnce = process.argv.includes('--once');

if (runOnce) {
  // Execução única: o processo encerra sozinho ao fim (sem process.exit,
  // que dispara uma assertion do libuv no Windows).
  await executarRotinaDiaria();
} else {
  await iniciarAgendador();
}

async function iniciarAgendador(): Promise<void> {
  // ── Verificação SMTP na inicialização ────────────────────
  await verifySmtpConnection();

  // ── Validação do cron schedule ───────────────────────────
  if (!cron.validate(config.cronSchedule)) {
    console.error(`❌ Expressão cron inválida: "${config.cronSchedule}"`);
    process.exit(1);
  }

  // ── Agendamento do job (diário, horário de Brasília) ─────
  cron.schedule(config.cronSchedule, executarRotinaDiaria, {
    timezone: 'America/Sao_Paulo',
  });

  console.log('\n✅ Worker iniciado. Aguardando próxima execução do cron...\n');
}

// ── Rotina diária ──────────────────────────────────────────

async function executarRotinaDiaria(): Promise<void> {
  const timestamp = new Date().toISOString();
  console.log(`\n🔔 [${timestamp}] Executando verificação diária de validade...`);

  try {
    const alertas = await varrerItensVencendo();

    if (alertas.length === 0) {
      console.log('  ℹ️  Nenhum item próximo do vencimento encontrado.');
    } else {
      const totalTokens = alertas.reduce((n, a) => n + a.tokens.length, 0);
      console.log(`  📋 Resumo: ${alertas.length} usuário(s), ${totalTokens} token(s) FCM prontos para envio.`);
      // O disparo push via FCM será implementado na próxima tarefa.

      // Canal de fallback já existente: e-mail
      for (const alerta of alertas) {
        await notificarPorEmail(alerta.userId, alerta.itens);
      }
    }

    console.log(`✅ [${timestamp}] Verificação concluída.`);
  } catch (error) {
    console.error(`❌ [${timestamp}] Erro na verificação:`, error);
  }
}

/** Busca o e-mail do usuário (Auth Admin) e envia o alerta. */
async function notificarPorEmail(userId: string, userItens: ExpiringItem[]): Promise<void> {
  const { data: userData, error: userError } = await supabaseAdmin
    .auth.admin.getUserById(userId);

  if (userError || !userData?.user?.email) {
    console.warn(`  ⚠️  Não foi possível obter e-mail do usuário ${userId}`);
    return;
  }

  const subject = `⚠️ ${userItens.length} item(ns) do estoque prestes a acabar`;
  await sendEmail(userData.user.email, subject, buildAlertEmailHtml(userItens));
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
 * Formata data ISO (YYYY-MM-DD) para DD/MM/YYYY.
 */
function formatDateBR(date: string): string {
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
}

