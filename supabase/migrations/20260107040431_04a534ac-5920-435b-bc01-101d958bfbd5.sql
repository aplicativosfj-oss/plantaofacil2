-- Create agent_licenses table for license management
CREATE TABLE public.agent_licenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  license_key VARCHAR(20) NOT NULL UNIQUE DEFAULT upper(substring(md5(random()::text) from 1 for 12)),
  license_type VARCHAR(20) NOT NULL DEFAULT 'trial' CHECK (license_type IN ('trial', 'monthly', 'annual', 'permanent')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'suspended', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  activated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 days'),
  last_payment_at TIMESTAMP WITH TIME ZONE,
  next_reminder_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '15 days'),
  monthly_fee NUMERIC(10,2) NOT NULL DEFAULT 20.00,
  notes TEXT,
  UNIQUE(agent_id)
);

-- Create license_payments table for payment tracking
CREATE TABLE public.license_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  license_id UUID NOT NULL REFERENCES public.agent_licenses(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL DEFAULT 20.00,
  payment_month VARCHAR(7) NOT NULL, -- Format: YYYY-MM
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  payment_method VARCHAR(50),
  receipt_url TEXT,
  receipt_filename VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
  confirmed_by UUID REFERENCES public.agents(id),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_agent_licenses_agent_id ON public.agent_licenses(agent_id);
CREATE INDEX idx_agent_licenses_status ON public.agent_licenses(status);
CREATE INDEX idx_agent_licenses_expires_at ON public.agent_licenses(expires_at);
CREATE INDEX idx_license_payments_license_id ON public.license_payments(license_id);
CREATE INDEX idx_license_payments_status ON public.license_payments(status);
CREATE INDEX idx_license_payments_payment_month ON public.license_payments(payment_month);

-- Enable RLS
ALTER TABLE public.agent_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agent_licenses
CREATE POLICY "Agents can view own license"
ON public.agent_licenses FOR SELECT
TO authenticated
USING (agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid()));

CREATE POLICY "Agents can update own license"
ON public.agent_licenses FOR UPDATE
TO authenticated
USING (agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all licenses"
ON public.agent_licenses FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for license_payments
CREATE POLICY "Agents can view own payments"
ON public.license_payments FOR SELECT
TO authenticated
USING (agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid()));

CREATE POLICY "Agents can insert own payments"
ON public.license_payments FOR INSERT
TO authenticated
WITH CHECK (agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all payments"
ON public.license_payments FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to create license on agent signup
CREATE OR REPLACE FUNCTION public.create_agent_license()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.agent_licenses (agent_id, license_type, status, expires_at, next_reminder_at)
  VALUES (
    NEW.id, 
    'trial', 
    'active', 
    now() + interval '30 days',
    now() + interval '15 days'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-create license on agent creation
CREATE TRIGGER on_agent_created_create_license
AFTER INSERT ON public.agents
FOR EACH ROW
EXECUTE FUNCTION public.create_agent_license();

-- Function to check and update expired licenses
CREATE OR REPLACE FUNCTION public.check_expired_licenses()
RETURNS void AS $$
BEGIN
  UPDATE public.agent_licenses
  SET status = 'expired'
  WHERE expires_at < now() 
    AND status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to extend license after payment confirmation
CREATE OR REPLACE FUNCTION public.extend_license(p_license_id UUID, p_months INTEGER DEFAULT 1)
RETURNS void AS $$
BEGIN
  UPDATE public.agent_licenses
  SET 
    expires_at = CASE 
      WHEN expires_at < now() THEN now() + (p_months * interval '1 month')
      ELSE expires_at + (p_months * interval '1 month')
    END,
    status = 'active',
    license_type = 'monthly',
    last_payment_at = now(),
    next_reminder_at = CASE 
      WHEN expires_at < now() THEN now() + interval '15 days'
      ELSE expires_at + (p_months * interval '1 month') - interval '15 days'
    END
  WHERE id = p_license_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function for admin to get all license stats
CREATE OR REPLACE FUNCTION public.get_license_stats()
RETURNS TABLE (
  total_agents BIGINT,
  active_licenses BIGINT,
  expired_licenses BIGINT,
  trial_licenses BIGINT,
  monthly_revenue NUMERIC,
  pending_payments BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM agents WHERE is_active = true),
    (SELECT COUNT(*) FROM agent_licenses WHERE status = 'active'),
    (SELECT COUNT(*) FROM agent_licenses WHERE status = 'expired'),
    (SELECT COUNT(*) FROM agent_licenses WHERE license_type = 'trial' AND status = 'active'),
    (SELECT COALESCE(SUM(amount), 0) FROM license_payments 
     WHERE status = 'confirmed' 
     AND payment_month = to_char(now(), 'YYYY-MM')),
    (SELECT COUNT(*) FROM license_payments WHERE status = 'pending');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Enable realtime for license updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_licenses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.license_payments;