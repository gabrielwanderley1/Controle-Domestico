-- ==============================================================================
-- SCHEMA & TABELAS: Controle Doméstico
-- Módulo: Notificações Push (Worker & Mobile)
-- Tabela: fcm_tokens
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.fcm_tokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    token text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fcm_tokens_user_token_key UNIQUE (user_id, token)
);

-- Índice para consultas rápidas por user_id
CREATE INDEX IF NOT EXISTS fcm_tokens_user_id_idx ON public.fcm_tokens(user_id);

-- Habilitação do Row Level Security (RLS)
ALTER TABLE public.fcm_tokens ENABLE ROW LEVEL SECURITY;

-- Policies de Acesso (CRUD) para usuários autenticados
DROP POLICY IF EXISTS "Users can view own tokens" ON public.fcm_tokens;
CREATE POLICY "Users can view own tokens" 
ON public.fcm_tokens FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own tokens" ON public.fcm_tokens;
CREATE POLICY "Users can insert own tokens" 
ON public.fcm_tokens FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own tokens" ON public.fcm_tokens;
CREATE POLICY "Users can update own tokens" 
ON public.fcm_tokens FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own tokens" ON public.fcm_tokens;
CREATE POLICY "Users can delete own tokens" 
ON public.fcm_tokens FOR DELETE 
USING (auth.uid() = user_id);
