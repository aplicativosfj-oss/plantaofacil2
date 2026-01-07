-- Create agent_days_off table for managing agent time off
CREATE TABLE public.agent_days_off (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  off_date DATE NOT NULL,
  off_type VARCHAR(10) NOT NULL DEFAULT '24h' CHECK (off_type IN ('24h', '12h')),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(agent_id, off_date)
);

-- Enable RLS
ALTER TABLE public.agent_days_off ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Agents can view their own days off"
  ON public.agent_days_off FOR SELECT
  USING (agent_id = public.get_current_agent_id());

CREATE POLICY "Agents can insert their own days off"
  ON public.agent_days_off FOR INSERT
  WITH CHECK (agent_id = public.get_current_agent_id());

CREATE POLICY "Agents can update their own days off"
  ON public.agent_days_off FOR UPDATE
  USING (agent_id = public.get_current_agent_id());

CREATE POLICY "Agents can delete their own days off"
  ON public.agent_days_off FOR DELETE
  USING (agent_id = public.get_current_agent_id());

-- Create trigger for updated_at
CREATE TRIGGER update_agent_days_off_updated_at
  BEFORE UPDATE ON public.agent_days_off
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();