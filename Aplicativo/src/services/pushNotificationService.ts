import { Capacitor } from '@capacitor/core';
import {
  PushNotifications,
  type ActionPerformed,
  type PushNotificationSchema,
  type Token,
} from '@capacitor/push-notifications';
import { supabase } from '../lib/supabaseClient';

/**
 * Serviço de notificações push (Android via Capacitor + FCM).
 *
 * Fluxo: pede permissão → registra no FCM → recebe o token no listener
 * `registration` → salva em `fcm_tokens` (upsert, vinculado ao auth.uid()).
 *
 * No navegador (vite dev) não faz nada: push só existe na plataforma nativa.
 */

let initialized = false;

/** Persiste o token do aparelho no Supabase. O RLS garante user_id = auth.uid(). */
async function saveToken(token: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('fcm_tokens')
    .upsert(
      { token, user_id: userId, updated_at: new Date().toISOString() },
      { onConflict: 'token' },
    );

  if (error) {
    console.error('[push] Falha ao salvar token FCM:', error.message);
  }
}

/**
 * Inicializa o push para o usuário logado. Idempotente: os listeners
 * são registrados uma única vez por execução do app.
 */
export async function initPushNotifications(userId: string): Promise<void> {
  if (!Capacitor.isNativePlatform() || initialized) return;
  initialized = true;

  // ── Listeners ─────────────────────────────────────────────
  await PushNotifications.addListener('registration', (token: Token) => {
    void saveToken(token.value, userId);
  });

  await PushNotifications.addListener('registrationError', (err) => {
    console.error('[push] Erro no registro FCM:', err.error);
  });

  // Notificação recebida com o app aberto (foreground)
  await PushNotifications.addListener(
    'pushNotificationReceived',
    (notification: PushNotificationSchema) => {
      console.log('[push] Recebida em foreground:', notification.title);
    },
  );

  // Usuário tocou na notificação
  await PushNotifications.addListener(
    'pushNotificationActionPerformed',
    (action: ActionPerformed) => {
      console.log('[push] Notificação aberta:', action.notification.title);
    },
  );

  // ── Permissão + registro ──────────────────────────────────
  let perm = await PushNotifications.checkPermissions();
  if (perm.receive === 'prompt' || perm.receive === 'prompt-with-rationale') {
    perm = await PushNotifications.requestPermissions();
  }

  if (perm.receive !== 'granted') {
    console.warn('[push] Permissão de notificação negada.');
    return;
  }

  await PushNotifications.register();
}

/** Remove listeners (ex.: no logout), permitindo nova inicialização. */
export async function teardownPushNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform() || !initialized) return;
  await PushNotifications.removeAllListeners();
  initialized = false;
}
