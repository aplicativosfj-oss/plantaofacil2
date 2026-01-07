-- Corrigir política permissiva de alertas
DROP POLICY IF EXISTS "System can create alerts" ON public.agent_alerts;

CREATE POLICY "Agents can create alerts for others" 
  ON public.agent_alerts FOR INSERT 
  TO authenticated 
  WITH CHECK (
    -- Agentes podem criar alertas para si ou se forem admin
    agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
    -- Ou se estiverem envolvidos em uma permuta
    OR agent_id IN (
      SELECT requested_id FROM public.shift_swaps 
      WHERE requester_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid())
    )
  );

-- Permitir que agentes criem alertas ao fazer permutas
CREATE POLICY "Agents can delete own alerts" 
  ON public.agent_alerts FOR DELETE 
  TO authenticated 
  USING (
    agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );