-- Tabela para notas do calendário/agenda
CREATE TABLE public.calendar_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  note_date DATE NOT NULL,
  title VARCHAR(100) NOT NULL,
  content TEXT,
  color VARCHAR(20) DEFAULT 'blue',
  is_reminder BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índice para busca por agente e data
CREATE INDEX idx_calendar_notes_agent_date ON public.calendar_notes(agent_id, note_date);

-- Enable RLS
ALTER TABLE public.calendar_notes ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Agents can view their own notes"
  ON public.calendar_notes FOR SELECT
  USING (agent_id = public.get_current_agent_id());

CREATE POLICY "Agents can create their own notes"
  ON public.calendar_notes FOR INSERT
  WITH CHECK (agent_id = public.get_current_agent_id());

CREATE POLICY "Agents can update their own notes"
  ON public.calendar_notes FOR UPDATE
  USING (agent_id = public.get_current_agent_id());

CREATE POLICY "Agents can delete their own notes"
  ON public.calendar_notes FOR DELETE
  USING (agent_id = public.get_current_agent_id());

-- Tabela para mensagens do chat
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  channel_type VARCHAR(20) NOT NULL CHECK (channel_type IN ('general', 'team')),
  team_channel team_type, -- null para chat geral
  content TEXT NOT NULL,
  is_edited BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  reply_to UUID REFERENCES public.chat_messages(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_chat_messages_channel ON public.chat_messages(channel_type, team_channel, created_at DESC);
CREATE INDEX idx_chat_messages_sender ON public.chat_messages(sender_id);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS: todos podem ver mensagens do chat geral
CREATE POLICY "Everyone can view general chat"
  ON public.chat_messages FOR SELECT
  USING (
    channel_type = 'general' 
    OR (
      channel_type = 'team' 
      AND team_channel = (SELECT current_team FROM public.agents WHERE id = public.get_current_agent_id())
    )
  );

CREATE POLICY "Agents can send messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (sender_id = public.get_current_agent_id());

CREATE POLICY "Agents can edit own messages"
  ON public.chat_messages FOR UPDATE
  USING (sender_id = public.get_current_agent_id());

-- Tabela para configuração de escala do agente
CREATE TABLE public.shift_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE UNIQUE,
  first_shift_date DATE NOT NULL,
  shift_pattern VARCHAR(20) NOT NULL DEFAULT '24x72',
  is_locked BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.shift_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view own schedule"
  ON public.shift_schedules FOR SELECT
  USING (agent_id = public.get_current_agent_id());

CREATE POLICY "Agents can create schedule if not exists"
  ON public.shift_schedules FOR INSERT
  WITH CHECK (
    agent_id = public.get_current_agent_id() 
    AND NOT EXISTS (SELECT 1 FROM public.shift_schedules WHERE agent_id = public.get_current_agent_id())
  );

-- Não permitir update após criado (locked)
CREATE POLICY "Agents cannot update locked schedule"
  ON public.shift_schedules FOR UPDATE
  USING (agent_id = public.get_current_agent_id() AND is_locked = false);

-- Tabela para status online dos agentes
CREATE TABLE public.agent_presence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE UNIQUE,
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
  device_info TEXT
);

ALTER TABLE public.agent_presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view presence"
  ON public.agent_presence FOR SELECT
  USING (true);

CREATE POLICY "Agents can update own presence"
  ON public.agent_presence FOR UPDATE
  USING (agent_id = public.get_current_agent_id());

CREATE POLICY "Agents can insert own presence"
  ON public.agent_presence FOR INSERT
  WITH CHECK (agent_id = public.get_current_agent_id());

-- Função para gerar datas de plantão baseado no primeiro
CREATE OR REPLACE FUNCTION public.generate_shift_dates(
  p_first_date DATE,
  p_pattern VARCHAR DEFAULT '24x72',
  p_months_ahead INTEGER DEFAULT 3
)
RETURNS TABLE(shift_date DATE, is_working BOOLEAN)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_current_date DATE := p_first_date;
  v_end_date DATE := p_first_date + (p_months_ahead * 30);
  v_cycle_days INTEGER := 4; -- 24x72 = trabalha 1, folga 3 = ciclo de 4 dias
BEGIN
  WHILE v_current_date <= v_end_date LOOP
    RETURN QUERY SELECT v_current_date, true;
    v_current_date := v_current_date + v_cycle_days;
  END LOOP;
END;
$$;

-- Enable realtime para chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_presence;

-- Trigger para updated_at
CREATE TRIGGER update_calendar_notes_updated_at
  BEFORE UPDATE ON public.calendar_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_messages_updated_at
  BEFORE UPDATE ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shift_schedules_updated_at
  BEFORE UPDATE ON public.shift_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();