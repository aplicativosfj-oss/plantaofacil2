
-- Criar trigger para gerar licença automática no cadastro de agente
CREATE OR REPLACE FUNCTION public.create_agent_license()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.agent_licenses (
    agent_id, 
    license_type, 
    status, 
    expires_at, 
    next_reminder_at,
    license_key,
    is_trial,
    trial_started_at,
    activated_at,
    monthly_fee
  )
  VALUES (
    NEW.id, 
    'trial', 
    'active', 
    now() + interval '30 days',
    now() + interval '15 days',
    'TRIAL-' || upper(substr(md5(random()::text), 1, 8)),
    true,
    now(),
    now(),
    20.00
  );
  RETURN NEW;
END;
$$;

-- Criar o trigger na tabela agents
DROP TRIGGER IF EXISTS trigger_create_agent_license ON public.agents;

CREATE TRIGGER trigger_create_agent_license
AFTER INSERT ON public.agents
FOR EACH ROW
EXECUTE FUNCTION public.create_agent_license();
