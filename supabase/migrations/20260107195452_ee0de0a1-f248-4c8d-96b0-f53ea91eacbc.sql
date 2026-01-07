-- Update RLS policies for chat_messages to be more permissive
DROP POLICY IF EXISTS "Everyone can view general chat" ON public.chat_messages;
DROP POLICY IF EXISTS "Agents can send messages" ON public.chat_messages;

-- Allow any authenticated user to view chat messages
CREATE POLICY "Authenticated users can view chat messages" 
ON public.chat_messages 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Allow agents to insert messages
CREATE POLICY "Agents can insert chat messages" 
ON public.chat_messages 
FOR INSERT 
WITH CHECK (
  sender_id IN (
    SELECT id FROM public.agents WHERE user_id = auth.uid()
  )
);

-- Update RLS policies for agent_messages to be more permissive
DROP POLICY IF EXISTS "Agents can view team and broadcast messages" ON public.agent_messages;
DROP POLICY IF EXISTS "Agents can send messages" ON public.agent_messages;

-- Allow any authenticated user to view agent messages  
CREATE POLICY "Authenticated users can view agent messages" 
ON public.agent_messages 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Allow agents to insert messages
CREATE POLICY "Agents can insert agent messages" 
ON public.agent_messages 
FOR INSERT 
WITH CHECK (
  sender_id IN (
    SELECT id FROM public.agents WHERE user_id = auth.uid()
  )
);

-- Enable REPLICA IDENTITY FULL for better realtime
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER TABLE public.agent_messages REPLICA IDENTITY FULL;