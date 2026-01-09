
-- Remover políticas existentes que usam auth.uid() para chat_messages
DROP POLICY IF EXISTS "Authenticated users can view chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Agents can insert chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Agents can edit own messages" ON public.chat_messages;

-- Criar novas políticas públicas para chat_messages (sistema usa autenticação por CPF, não Supabase Auth)
CREATE POLICY "Anyone can view chat messages" 
ON public.chat_messages 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert chat messages" 
ON public.chat_messages 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update own messages" 
ON public.chat_messages 
FOR UPDATE 
USING (true);

-- Fazer o mesmo para agent_messages se existir
DROP POLICY IF EXISTS "Agents can view team messages" ON public.agent_messages;
DROP POLICY IF EXISTS "Agents can insert messages" ON public.agent_messages;

CREATE POLICY "Anyone can view agent messages" 
ON public.agent_messages 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert agent messages" 
ON public.agent_messages 
FOR INSERT 
WITH CHECK (true);

-- Verificar se há tabela de unidades, se não existir, criar
CREATE TABLE IF NOT EXISTS public.units (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  city TEXT,
  state TEXT DEFAULT 'AC',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS e criar política pública
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view units" ON public.units FOR SELECT USING (true);
CREATE POLICY "Anyone can manage units" ON public.units FOR ALL USING (true);

-- Inserir algumas unidades padrão
INSERT INTO public.units (name, city) VALUES 
  ('CS Feijó', 'Feijó'),
  ('CS Tarauacá', 'Tarauacá'),
  ('CS Cruzeiro do Sul', 'Cruzeiro do Sul'),
  ('CS Sena Madureira', 'Sena Madureira'),
  ('CS Rio Branco', 'Rio Branco')
ON CONFLICT (name) DO NOTHING;

-- Garantir que system_settings tenha valores padrão
INSERT INTO public.system_settings (setting_key, setting_value, description) VALUES 
  ('overtime_hour_value', 15.75, 'Valor da hora extra em R$'),
  ('overtime_monthly_limit', 70, 'Limite mensal de horas extras'),
  ('trial_days', 30, 'Dias de teste gratuito')
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;
