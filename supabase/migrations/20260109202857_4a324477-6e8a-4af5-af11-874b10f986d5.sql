-- Tabela para lideranças de equipes (Alfa, Bravo, Charlie, Delta)
CREATE TABLE IF NOT EXISTS public.team_leadership (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_name TEXT NOT NULL CHECK (team_name IN ('alfa', 'bravo', 'charlie', 'delta')),
  position_type TEXT NOT NULL CHECK (position_type IN ('chefe_equipe', 'apoio')),
  full_name TEXT,
  phone TEXT,
  email TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(team_name, position_type)
);

-- Índice para buscas por equipe
CREATE INDEX IF NOT EXISTS idx_team_leadership_team ON public.team_leadership(team_name);

-- Enable RLS
ALTER TABLE public.team_leadership ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: leitura pública, escrita para usuários autenticados (masters)
CREATE POLICY "team_leadership_select" ON public.team_leadership FOR SELECT USING (true);
CREATE POLICY "team_leadership_insert" ON public.team_leadership FOR INSERT WITH CHECK (true);
CREATE POLICY "team_leadership_update" ON public.team_leadership FOR UPDATE USING (true);
CREATE POLICY "team_leadership_delete" ON public.team_leadership FOR DELETE USING (true);

-- Inserir registros iniciais para cada equipe e posição
INSERT INTO public.team_leadership (team_name, position_type) VALUES
  ('alfa', 'chefe_equipe'),
  ('alfa', 'apoio'),
  ('bravo', 'chefe_equipe'),
  ('bravo', 'apoio'),
  ('charlie', 'chefe_equipe'),
  ('charlie', 'apoio'),
  ('delta', 'chefe_equipe'),
  ('delta', 'apoio')
ON CONFLICT (team_name, position_type) DO NOTHING;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_team_leadership_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_team_leadership_updated_at
  BEFORE UPDATE ON public.team_leadership
  FOR EACH ROW
  EXECUTE FUNCTION public.update_team_leadership_updated_at();