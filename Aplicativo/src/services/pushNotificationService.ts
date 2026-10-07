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
 * `registration` → valida sessão do Supabase → salva em `fcm_tokens`.
 *
 * No navegador (vite dev) não faz nada: push só existe na plataforma nativa.
 */

let initialized = false;

/** Persiste o token do aparelho no Supabase com validação defensiva e autenticação ativa. */
async function saveToken(token: string, userId?: string): Promise<void> {
  try {
    if (!token || typeof token !== 'string') {
      console.warn('[push] Token FCM inválido ou ausente.');
      return;
    }

    // Valida explicitamente se o usuário está realmente autenticado no Supabase
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      console.warn('[push] Usuário não está autenticado no Supabase ao tentar salvar token FCM.');
      return;
    }

    const currentUserId = session.user.id;

    if (userId && currentUserId !== userId) {
      console.warn('[push] Discrepância entre userId fornecido e sessão ativa:', {
        userId,
        currentUserId,
      });
    }

    const { error: upsertError } = await supabase
      .from('fcm_tokens')
      .upsert(
        {
          token,
          user_id: currentUserId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'token' },
      );

    if (upsertError) {
      console.error('[push] Falha ao salvar token FCM:', upsertError.message);
    } else {
      console.log('[push] Token FCM registrado com sucesso para o usuário.');
    }
  } catch (err) {
    // Captura qualquer falha inesperada (ex.: rede, timeout) sem deixar a Promise estourar
    console.error('[push] Erro inesperado ao persistir token FCM:', err);
  }
}

/**
 * Inicializa o push para o usuário logado. Idempotente: os listeners
 * são registrados uma única vez por execução do app.
 */
export async function initPushNotifications(userId: string): Promise<void> {
  if (!Capacitor.isNativePlatform() || initialized) return;
  initialized = true;

  try {
    // ── Listeners ─────────────────────────────────────────────
    await PushNotifications.addListener('registration', (token: Token) => {
      saveToken(token?.value, userId).catch((err) => {
        console.error('[push] Erro no listener registration:', err);
      });
    });

    await PushNotifications.addListener('registrationError', (error) => {
      console.error('Erro no registro push:', error);
    });

    // Notificação recebida com o app aberto (foreground)
    await PushNotifications.addListener(
      'pushNotificationReceived',
      (notification: PushNotificationSchema) => {
        try {
          console.log('[push] Recebida em foreground:', notification.title);
        } catch (err) {
          console.error('[push] Erro ao processar notificação em foreground:', err);
        }
      },
    );

    // Usuário tocou na notificação
    await PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (action: ActionPerformed) => {
        try {
          console.log('[push] Notificação aberta:', action.notification.title);
        } catch (err) {
          console.error('[push] Erro ao processar abertura de notificação:', err);
        }
      },
    );

    // ── Permissão + registro ──────────────────────────────────
    let perm = await PushNotifications.checkPermissions();
    if (perm.receive === 'prompt' || perm.receive === 'prompt-with-rationale') {
      perm = await PushNotifications.requestPermissions();
    }

    if (perm.receive !== 'granted') {
      console.warn('[push] Permissão de notificação negada ou não concedida:', perm.receive);
      return;
    }

    await PushNotifications.register();
  } catch (err) {
    // Blindagem completa contra crash nativo ou unhandled rejection no runtime
    console.error('[push] Erro durante inicialização de notificações push:', err);
  }
}

/** Remove listeners (ex.: no logout), permitindo nova inicialização. */
export async function teardownPushNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform() || !initialized) return;
  try {
    await PushNotifications.removeAllListeners();
  } catch (err) {
    console.error('[push] Falha ao remover listeners de push:', err);
  } finally {
    initialized = false;
  }
}
