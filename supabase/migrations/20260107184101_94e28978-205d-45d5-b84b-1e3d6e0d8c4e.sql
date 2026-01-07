-- Tabela para armazenar lideranças das unidades socioeducativas
CREATE TABLE public.unit_leadership (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_name VARCHAR(100) NOT NULL,
  position_type VARCHAR(50) NOT NULL, -- 'diretor', 'coordenador_seguranca', 'presidente'
  full_name VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(255),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(unit_name, position_type)
);

-- Habilitar RLS
ALTER TABLE public.unit_leadership ENABLE ROW LEVEL SECURITY;

-- Política pública para leitura (todos podem ver)
CREATE POLICY "Anyone can view unit leadership"
ON public.unit_leadership
FOR SELECT
USING (true);

-- Política para inserção/atualização/exclusão (apenas via service role - painel master)
CREATE POLICY "Service role can manage unit leadership"
ON public.unit_leadership
FOR ALL
USING (true)
WITH CHECK (true);

-- Inserir registros iniciais para cada unidade e posição
INSERT INTO public.unit_leadership (unit_name, position_type) VALUES
  ('CS Feijó', 'diretor'),
  ('CS Feijó', 'coordenador_seguranca'),
  ('CS Juruá', 'diretor'),
  ('CS Juruá', 'coordenador_seguranca'),
  ('CS Rio Branco', 'diretor'),
  ('CS Rio Branco', 'coordenador_seguranca'),
  ('CS Purus', 'diretor'),
  ('CS Purus', 'coordenador_seguranca'),
  ('CS Alto Acre', 'diretor'),
  ('CS Alto Acre', 'coordenador_seguranca'),
  ('Sistema Socioeducativo', 'presidente');

-- Trigger para updated_at
CREATE TRIGGER update_unit_leadership_updated_at
BEFORE UPDATE ON public.unit_leadership
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();