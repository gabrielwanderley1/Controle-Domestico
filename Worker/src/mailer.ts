import nodemailer from 'nodemailer';
import { config } from './config.js';

/**
 * Transporter SMTP configurado para envio de e-mails via Gmail / SMTP.
 * Utiliza App Password (não a senha normal da conta).
 */
const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: false, // STARTTLS na porta 587
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass.replace(/\s+/g, ''), // Remove espaços do App Password
  },
});

/**
 * Envia um e-mail de notificação.
 *
 * @param to Endereço de e-mail do destinatário.
 * @param subject Assunto do e-mail.
 * @param html Corpo HTML do e-mail.
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<void> {
  try {
    await transporter.sendMail({
      from: `"${config.smtp.fromName}" <${config.smtp.fromEmail}>`,
      to,
      subject,
      html,
    });
    console.log(`  📧 E-mail enviado para ${to}`);
  } catch (error) {
    console.error(`  ❌ Falha ao enviar e-mail para ${to}:`, error);
  }
}

/**
 * Verifica a conexão SMTP na inicialização.
 * Loga sucesso ou erro sem interromper o worker.
 */
export async function verifySmtpConnection(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log('✅ Conexão SMTP verificada com sucesso.');
    return true;
  } catch (error) {
    console.error('⚠️  Falha na verificação SMTP:', error);
    console.error('   Os e-mails de notificação podem não ser entregues.');
    return false;
  }
}

