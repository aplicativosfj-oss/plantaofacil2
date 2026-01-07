-- Make agent license creation idempotent to avoid duplicate trigger executions
CREATE OR REPLACE FUNCTION public.create_agent_license()
RETURNS trigger
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
  )
  ON CONFLICT (agent_id) DO NOTHING;

  RETURN NEW;
END;
$$;