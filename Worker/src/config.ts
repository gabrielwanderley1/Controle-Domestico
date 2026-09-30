import 'dotenv/config';

/**
 * Configuração centralizada do worker.
 * Carrega e valida todas as variáveis de ambiente necessárias.
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`❌ Variável de ambiente obrigatória não definida: ${name}`);
    console.error('   Verifique o arquivo .env na raiz do Worker.');
    process.exit(1);
  }
  return value;
}

export const config = {
  // ── Supabase ──────────────────────────
  supabase: {
    url: requireEnv('SUPABASE_URL'),
    serviceRoleKey: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  },

  // ── SMTP / E-mail ─────────────────────
  smtp: {
    host: requireEnv('SMTP_HOST'),
    port: parseInt(process.env['SMTP_PORT'] ?? '587', 10),
    user: requireEnv('SMTP_USER'),
    pass: requireEnv('SMTP_PASS'),
    fromName: process.env['SMTP_FROM_NAME'] ?? 'Controle Doméstico',
    fromEmail: requireEnv('SMTP_FROM_EMAIL'),
  },

  // ── Agendamento ───────────────────────
  cronSchedule: process.env['CRON_SCHEDULE'] ?? '0 8 * * *',

  // ── Limiar de alerta (dias) ───────────
  alertDaysThreshold: parseInt(process.env['ALERT_DAYS_THRESHOLD'] ?? '3', 10),
} as const;

