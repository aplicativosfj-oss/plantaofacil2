-- Add missing UPDATE and DELETE policies for overtime_bank table
CREATE POLICY "Agents can update own overtime"
ON public.overtime_bank
FOR UPDATE
USING (agent_id = get_current_agent_id());

CREATE POLICY "Agents can delete own overtime"
ON public.overtime_bank
FOR DELETE
USING (agent_id = get_current_agent_id());