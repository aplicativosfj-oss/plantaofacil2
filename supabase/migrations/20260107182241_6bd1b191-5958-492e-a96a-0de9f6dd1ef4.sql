-- Add trial tracking fields to agent_licenses table
ALTER TABLE public.agent_licenses
ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trial_password_used VARCHAR(50);

-- Create a table to track app usage/analytics
CREATE TABLE IF NOT EXISTS public.app_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL,
  action_details JSONB,
  device_info VARCHAR(255),
  ip_address VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_usage_logs ENABLE ROW LEVEL SECURITY;

-- Policies for app_usage_logs
CREATE POLICY "Agents can insert their own logs"
ON public.app_usage_logs
FOR INSERT
WITH CHECK (agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid()));

CREATE POLICY "Master users can view all logs"
ON public.app_usage_logs
FOR SELECT
USING (true);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_app_usage_logs_agent_id ON public.app_usage_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_app_usage_logs_created_at ON public.app_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_usage_logs_action_type ON public.app_usage_logs(action_type);

-- Enable realtime for app_usage_logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_usage_logs;