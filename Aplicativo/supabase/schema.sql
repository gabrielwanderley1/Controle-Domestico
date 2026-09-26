-- ==============================================================================
-- SCHEMA & TABELAS: Controle Doméstico
-- Módulo: Banco de Dados (Supabase)
-- Tabela: itens
-- ==============================================================================

-- 1. Criação da tabela itens (caso não exista)
CREATE TABLE IF NOT EXISTS public.itens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nome text NOT NULL,
    quantidade integer NOT NULL CHECK (quantidade >= 0),
    duracao_dias_unidade integer,
    data_compra date,
    data_estimada_termino date,
    user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 2. Ajustes incrementais e validações estruturais (idempotência)
DO $$
BEGIN
    -- Adicionar coluna user_id se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'itens' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.itens ADD COLUMN user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- Adicionar constraint de valor não-negativo para quantidade
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'public.itens'::regclass AND conname = 'itens_quantidade_check'
    ) THEN
        ALTER TABLE public.itens ADD CONSTRAINT itens_quantidade_check CHECK (quantidade >= 0);
    END IF;
END $$;

-- 3. Índice para performance em consultas filtradas por usuário (RLS)
CREATE INDEX IF NOT EXISTS itens_user_id_idx ON public.itens(user_id);

-- 4. Habilitação do Row Level Security (RLS)
ALTER TABLE public.itens ENABLE ROW LEVEL SECURITY;

-- 5. Policies de Acesso (CRUD)
DROP POLICY IF EXISTS "Users can view own items" ON public.itens;
CREATE POLICY "Users can view own items" 
ON public.itens FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own items" ON public.itens;
CREATE POLICY "Users can insert own items" 
ON public.itens FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own items" ON public.itens;
CREATE POLICY "Users can update own items" 
ON public.itens FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own items" ON public.itens;
CREATE POLICY "Users can delete own items" 
ON public.itens FOR DELETE 
USING (auth.uid() = user_id);
