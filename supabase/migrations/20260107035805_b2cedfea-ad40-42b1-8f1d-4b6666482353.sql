-- Remove the insecure anon INSERT policy 
DROP POLICY "Allow signup insert for agents" ON public.agents;