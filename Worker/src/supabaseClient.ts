import { createClient } from '@supabase/supabase-js';
import { config } from './config.js';

/**
 * Cliente Supabase do worker usando a service_role key.
 *
 * A service_role key bypassa o RLS, permitindo que o worker
 * leia itens de TODOS os usuários para verificar vencimentos.
 *
 * ⚠️ Esta chave NUNCA deve ser exposta no front-end.
 */
export const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

/** Alias mantido para compatibilidade com imports existentes. */
export const supabase = supabaseAdmin;

