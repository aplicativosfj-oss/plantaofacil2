-- Create table for agent team chat messages
CREATE TABLE public.agent_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
  recipient_team public.team_type,
  is_broadcast BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agent_messages ENABLE ROW LEVEL SECURITY;

-- Agents can view messages from their team or broadcast messages
CREATE POLICY "Agents can view team and broadcast messages"
ON public.agent_messages
FOR SELECT
USING (
  is_broadcast = true OR 
  recipient_team = (SELECT current_team FROM agents WHERE user_id = auth.uid())
);

-- Agents can insert their own messages
CREATE POLICY "Agents can send messages"
ON public.agent_messages
FOR INSERT
WITH CHECK (
  sender_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_messages;

-- Create index for performance
CREATE INDEX idx_agent_messages_team ON public.agent_messages(recipient_team);
CREATE INDEX idx_agent_messages_created ON public.agent_messages(created_at DESC);

-- Add first_login field to agents table to track if user should change password
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS is_first_login BOOLEAN DEFAULT true;