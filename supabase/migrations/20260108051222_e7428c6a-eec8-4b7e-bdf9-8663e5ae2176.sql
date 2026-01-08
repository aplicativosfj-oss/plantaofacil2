-- Corrigir política de visualização de agentes para ser PERMISSIVE
-- Remover a política restritiva antiga
DROP POLICY IF EXISTS "Agents can view all agents" ON public.agents;

-- Criar política PERMISSIVA que permite visualização pública
CREATE POLICY "Anyone can view agents"
ON public.agents
FOR SELECT
USING (true);

-- Garantir que masters podem gerenciar todos os dados sem autenticação Supabase
-- Adicionar política permissiva para agent_licenses
DROP POLICY IF EXISTS "Anyone can view licenses" ON public.agent_licenses;
CREATE POLICY "Anyone can view licenses"
ON public.agent_licenses
FOR SELECT
USING (true);

-- Adicionar política permissiva para overtime_bank
DROP POLICY IF EXISTS "Anyone can view overtime" ON public.overtime_bank;
CREATE POLICY "Anyone can view overtime"
ON public.overtime_bank
FOR SELECT
USING (true);

-- Adicionar política permissiva para license_payments
DROP POLICY IF EXISTS "Anyone can view license_payments" ON public.license_payments;
CREATE POLICY "Anyone can view license_payments"
ON public.license_payments
FOR SELECT
USING (true);

-- Adicionar política permissiva para shifts
DROP POLICY IF EXISTS "Anyone can view shifts" ON public.shifts;
CREATE POLICY "Anyone can view shifts"
ON public.shifts
FOR SELECT
USING (true);

-- Adicionar política permissiva para shift_schedules
DROP POLICY IF EXISTS "Anyone can view shift_schedules" ON public.shift_schedules;
CREATE POLICY "Anyone can view shift_schedules"
ON public.shift_schedules
FOR SELECT
USING (true);

-- Adicionar política permissiva para agent_presence
DROP POLICY IF EXISTS "Anyone can view agent_presence" ON public.agent_presence;
CREATE POLICY "Anyone can view agent_presence"
ON public.agent_presence
FOR SELECT
USING (true);

-- Adicionar política permissiva para unit_leadership
DROP POLICY IF EXISTS "Anyone can view unit_leadership" ON public.unit_leadership;
CREATE POLICY "Anyone can view unit_leadership"
ON public.unit_leadership
FOR SELECT
USING (true);