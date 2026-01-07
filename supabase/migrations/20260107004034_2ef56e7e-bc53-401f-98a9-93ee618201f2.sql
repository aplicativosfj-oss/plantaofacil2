-- =============================================
-- PLANTÃOPRO - Sistema de Gestão de Plantões
-- =============================================

-- Enum para equipes
CREATE TYPE public.team_type AS ENUM ('alfa', 'bravo', 'charlie', 'delta');

-- Enum para status de permuta
CREATE TYPE public.swap_status AS ENUM ('pending', 'accepted', 'rejected', 'completed');

-- =============================================
-- Tabela de Agentes (substitui profiles antigo)
-- =============================================
CREATE TABLE public.agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  cpf VARCHAR(11) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  registration_number VARCHAR(50), -- Matrícula funcional
  phone VARCHAR(20),
  email VARCHAR(255),
  current_team team_type,
  team_joined_at TIMESTAMP WITH TIME ZONE,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para agents
CREATE POLICY "Agents can view all agents" 
  ON public.agents FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Agents can update own profile" 
  ON public.agents FOR UPDATE 
  TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all agents" 
  ON public.agents FOR ALL 
  TO authenticated 
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- Tabela de Histórico de Equipes
-- =============================================
CREATE TABLE public.team_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  team team_type NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  left_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.team_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view team history" 
  ON public.team_history FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "System can manage team history" 
  ON public.team_history FOR ALL 
  TO authenticated 
  USING (
    agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- =============================================
-- Tabela de Plantões
-- =============================================
CREATE TABLE public.shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  team team_type NOT NULL,
  shift_start TIMESTAMP WITH TIME ZONE NOT NULL,
  shift_end TIMESTAMP WITH TIME ZONE NOT NULL,
  rest_end TIMESTAMP WITH TIME ZONE NOT NULL, -- Fim da folga de 72h
  is_completed BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view own shifts" 
  ON public.shifts FOR SELECT 
  TO authenticated 
  USING (
    agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can manage shifts" 
  ON public.shifts FOR ALL 
  TO authenticated 
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- Tabela de Banco de Horas
-- =============================================
CREATE TABLE public.overtime_bank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  hours_worked DECIMAL(4,2) NOT NULL CHECK (hours_worked > 0 AND hours_worked <= 24),
  hour_value DECIMAL(10,2) DEFAULT 15.75,
  total_value DECIMAL(10,2) GENERATED ALWAYS AS (hours_worked * hour_value) STORED,
  description TEXT,
  month_year VARCHAR(7) NOT NULL, -- YYYY-MM para controle mensal
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES public.agents(id)
);

ALTER TABLE public.overtime_bank ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view own overtime" 
  ON public.overtime_bank FOR SELECT 
  TO authenticated 
  USING (
    agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Agents can insert own overtime" 
  ON public.overtime_bank FOR INSERT 
  TO authenticated 
  WITH CHECK (
    agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can manage overtime" 
  ON public.overtime_bank FOR ALL 
  TO authenticated 
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- Tabela de Permutas
-- =============================================
CREATE TABLE public.shift_swaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  requested_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  original_shift_date DATE NOT NULL,
  compensation_date DATE NOT NULL,
  status swap_status DEFAULT 'pending',
  requester_notes TEXT,
  response_notes TEXT,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.shift_swaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view own swaps" 
  ON public.shift_swaps FOR SELECT 
  TO authenticated 
  USING (
    requester_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid())
    OR requested_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Agents can create swaps" 
  ON public.shift_swaps FOR INSERT 
  TO authenticated 
  WITH CHECK (
    requester_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid())
  );

CREATE POLICY "Agents can update swaps they are involved in" 
  ON public.shift_swaps FOR UPDATE 
  TO authenticated 
  USING (
    requester_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid())
    OR requested_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- =============================================
-- Tabela de Alertas
-- =============================================
CREATE TABLE public.agent_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'shift_reminder', 'swap_request', 'swap_response', 'overtime_limit'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  related_shift_id UUID REFERENCES public.shifts(id),
  related_swap_id UUID REFERENCES public.shift_swaps(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.agent_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view own alerts" 
  ON public.agent_alerts FOR SELECT 
  TO authenticated 
  USING (
    agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid())
  );

CREATE POLICY "Agents can update own alerts" 
  ON public.agent_alerts FOR UPDATE 
  TO authenticated 
  USING (
    agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid())
  );

CREATE POLICY "System can create alerts" 
  ON public.agent_alerts FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

-- =============================================
-- Tabela de Configurações do Sistema
-- =============================================
CREATE TABLE public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value DECIMAL(10,2) NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES public.agents(id)
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view settings" 
  ON public.system_settings FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Admins can manage settings" 
  ON public.system_settings FOR ALL 
  TO authenticated 
  USING (public.has_role(auth.uid(), 'admin'));

-- Inserir configurações padrão
INSERT INTO public.system_settings (setting_key, setting_value, description) VALUES
  ('overtime_hour_value', 15.75, 'Valor da hora de banco de horas em R$'),
  ('overtime_monthly_limit', 70, 'Limite máximo de horas extras por mês'),
  ('shift_duration_hours', 24, 'Duração do plantão em horas'),
  ('rest_duration_hours', 72, 'Duração da folga em horas');

-- =============================================
-- Função para obter agente atual
-- =============================================
CREATE OR REPLACE FUNCTION public.get_current_agent_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.agents WHERE user_id = auth.uid() LIMIT 1
$$;

-- =============================================
-- Função para calcular total de horas no mês
-- =============================================
CREATE OR REPLACE FUNCTION public.get_monthly_overtime(p_agent_id UUID, p_month_year VARCHAR)
RETURNS TABLE(total_hours DECIMAL, total_value DECIMAL, remaining_hours DECIMAL)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_hours DECIMAL;
  v_hour_value DECIMAL;
  v_limit DECIMAL;
BEGIN
  SELECT COALESCE(SUM(hours_worked), 0) INTO v_total_hours
  FROM public.overtime_bank
  WHERE agent_id = p_agent_id AND month_year = p_month_year;
  
  SELECT setting_value INTO v_hour_value
  FROM public.system_settings WHERE setting_key = 'overtime_hour_value';
  
  SELECT setting_value INTO v_limit
  FROM public.system_settings WHERE setting_key = 'overtime_monthly_limit';
  
  RETURN QUERY SELECT 
    v_total_hours,
    v_total_hours * COALESCE(v_hour_value, 15.75),
    GREATEST(0, COALESCE(v_limit, 70) - v_total_hours);
END;
$$;

-- =============================================
-- Função para transferir agente de equipe
-- =============================================
CREATE OR REPLACE FUNCTION public.transfer_agent_team(p_agent_id UUID, p_new_team team_type)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_team team_type;
BEGIN
  -- Obter equipe atual
  SELECT current_team INTO v_current_team FROM public.agents WHERE id = p_agent_id;
  
  -- Se já está na mesma equipe, retornar
  IF v_current_team = p_new_team THEN
    RETURN false;
  END IF;
  
  -- Fechar histórico anterior
  IF v_current_team IS NOT NULL THEN
    UPDATE public.team_history 
    SET left_at = now() 
    WHERE agent_id = p_agent_id AND left_at IS NULL;
  END IF;
  
  -- Criar novo registro de histórico
  INSERT INTO public.team_history (agent_id, team, joined_at)
  VALUES (p_agent_id, p_new_team, now());
  
  -- Atualizar agente
  UPDATE public.agents 
  SET current_team = p_new_team, team_joined_at = now(), updated_at = now()
  WHERE id = p_agent_id;
  
  RETURN true;
END;
$$;

-- =============================================
-- Trigger para atualizar updated_at
-- =============================================
CREATE TRIGGER update_agents_updated_at
  BEFORE UPDATE ON public.agents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shifts_updated_at
  BEFORE UPDATE ON public.shifts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- Índices para performance
-- =============================================
CREATE INDEX idx_agents_cpf ON public.agents(cpf);
CREATE INDEX idx_agents_current_team ON public.agents(current_team);
CREATE INDEX idx_agents_user_id ON public.agents(user_id);
CREATE INDEX idx_shifts_agent_team ON public.shifts(agent_id, team);
CREATE INDEX idx_shifts_dates ON public.shifts(shift_start, shift_end);
CREATE INDEX idx_overtime_month ON public.overtime_bank(agent_id, month_year);
CREATE INDEX idx_swaps_agents ON public.shift_swaps(requester_id, requested_id);
CREATE INDEX idx_alerts_agent ON public.agent_alerts(agent_id, is_read);