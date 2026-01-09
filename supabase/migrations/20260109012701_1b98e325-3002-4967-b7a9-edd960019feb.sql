-- Adicionar constraint de CPF único na tabela agents
ALTER TABLE public.agents ADD CONSTRAINT agents_cpf_unique UNIQUE (cpf);

-- Criar índice para performance de busca por CPF
CREATE INDEX IF NOT EXISTS idx_agents_cpf ON public.agents(cpf);

-- Criar tabela para solicitações de transferência de unidade
CREATE TABLE IF NOT EXISTS public.unit_transfer_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  current_unit TEXT NOT NULL,
  requested_unit TEXT NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES public.agents(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.unit_transfer_requests ENABLE ROW LEVEL SECURITY;

-- Políticas públicas (sistema usa autenticação por CPF)
CREATE POLICY "Anyone can view transfer requests" ON public.unit_transfer_requests FOR SELECT USING (true);
CREATE POLICY "Anyone can insert transfer requests" ON public.unit_transfer_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update transfer requests" ON public.unit_transfer_requests FOR UPDATE USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_unit_transfer_requests_updated_at
  BEFORE UPDATE ON public.unit_transfer_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();