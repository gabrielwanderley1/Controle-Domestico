import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não estão definidas. ' +
    'Verifique o arquivo .env na raiz do projeto.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,      // Persiste sessão no localStorage (padrão, explícito por clareza)
    autoRefreshToken: true,     // Renova o JWT automaticamente antes de expirar
    detectSessionInUrl: true,   // Necessário para fluxos de recuperação de senha via link/OTP
  },
});
