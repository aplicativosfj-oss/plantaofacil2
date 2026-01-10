-- =====================================================
-- SECURITY FIX: Drop duplicate policies and fix remaining
-- =====================================================

-- Drop the duplicate policies we tried to create if they exist
DROP POLICY IF EXISTS "Authenticated users can view agent messages" ON public.agent_messages;
DROP POLICY IF EXISTS "Authenticated users can view agents" ON public.agents;
DROP POLICY IF EXISTS "Authenticated users can view agent licenses" ON public.agent_licenses;
DROP POLICY IF EXISTS "Authenticated users can view overtime" ON public.overtime_bank;
DROP POLICY IF EXISTS "Authenticated users can view license payments" ON public.license_payments;
DROP POLICY IF EXISTS "Authenticated users can view agent presence" ON public.agent_presence;
DROP POLICY IF EXISTS "Authenticated users can view chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Authenticated users can view own logs" ON public.app_usage_logs;
DROP POLICY IF EXISTS "Authenticated users can view system settings" ON public.system_settings;

-- Now properly fix the overly permissive RLS policies

-- 1. agents table: Remove public access, require authentication
DROP POLICY IF EXISTS "Anyone can view agents" ON public.agents;
CREATE POLICY "Authenticated can view agents" ON public.agents
  FOR SELECT TO authenticated
  USING (true);

-- 2. agent_licenses: Remove public access, require authentication  
DROP POLICY IF EXISTS "Anyone can view licenses" ON public.agent_licenses;
CREATE POLICY "Authenticated can view licenses" ON public.agent_licenses
  FOR SELECT TO authenticated
  USING (true);

-- 3. overtime_bank: Remove public access, require authentication
DROP POLICY IF EXISTS "Anyone can view overtime" ON public.overtime_bank;
CREATE POLICY "Authenticated can view overtime" ON public.overtime_bank
  FOR SELECT TO authenticated
  USING (true);

-- 4. license_payments: Remove public access, require authentication
DROP POLICY IF EXISTS "Anyone can view license_payments" ON public.license_payments;
CREATE POLICY "Authenticated can view payments" ON public.license_payments
  FOR SELECT TO authenticated
  USING (true);

-- 5. agent_presence: Remove duplicate public access policies
DROP POLICY IF EXISTS "Anyone can view agent_presence" ON public.agent_presence;
DROP POLICY IF EXISTS "Everyone can view presence" ON public.agent_presence;
CREATE POLICY "Authenticated can view presence" ON public.agent_presence
  FOR SELECT TO authenticated
  USING (true);

-- 6. chat_messages: Remove public access and fix overly permissive update/delete
DROP POLICY IF EXISTS "Anyone can view chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Anyone can delete own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Anyone can update own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Anyone can insert chat messages" ON public.chat_messages;

CREATE POLICY "Authenticated can view chat" ON public.chat_messages
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert chat" ON public.chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (sender_id IN (SELECT id FROM agents WHERE user_id = auth.uid()));

CREATE POLICY "Agents can update own chat" ON public.chat_messages
  FOR UPDATE TO authenticated
  USING (sender_id IN (SELECT id FROM agents WHERE user_id = auth.uid()));

CREATE POLICY "Agents can delete own chat" ON public.chat_messages
  FOR DELETE TO authenticated
  USING (sender_id IN (SELECT id FROM agents WHERE user_id = auth.uid()));

-- 7. agent_messages: Remove duplicate public access
DROP POLICY IF EXISTS "Anyone can view agent messages" ON public.agent_messages;
DROP POLICY IF EXISTS "Anyone can insert agent messages" ON public.agent_messages;

CREATE POLICY "Authenticated can insert messages" ON public.agent_messages
  FOR INSERT TO authenticated
  WITH CHECK (sender_id IN (SELECT id FROM agents WHERE user_id = auth.uid()));

-- 8. app_usage_logs: Remove public access
DROP POLICY IF EXISTS "Master users can view all logs" ON public.app_usage_logs;
CREATE POLICY "Authenticated can view logs" ON public.app_usage_logs
  FOR SELECT TO authenticated
  USING (true);

-- 9. system_settings (if exists): Require authentication
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'system_settings') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can view system settings" ON public.system_settings';
    EXECUTE 'CREATE POLICY "Authenticated can view settings" ON public.system_settings FOR SELECT TO authenticated USING (true)';
  END IF;
END $$;

-- 10. team_leadership (if exists): Require authentication
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'team_leadership') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can view team leadership" ON public.team_leadership';
    EXECUTE 'CREATE POLICY "Authenticated can view leadership" ON public.team_leadership FOR SELECT TO authenticated USING (true)';
  END IF;
END $$;

-- 11. units (if exists): Require authentication for sensitive data
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'units') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can view units" ON public.units';
    EXECUTE 'CREATE POLICY "Authenticated can view units" ON public.units FOR SELECT TO authenticated USING (true)';
  END IF;
END $$;

-- 12. unit_leadership (if exists): Require authentication
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'unit_leadership') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can view unit leadership" ON public.unit_leadership';
    EXECUTE 'CREATE POLICY "Authenticated can view unit leadership" ON public.unit_leadership FOR SELECT TO authenticated USING (true)';
  END IF;
END $$;

-- 13. shift_schedules (if exists): Require authentication
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'shift_schedules') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can view shift schedules" ON public.shift_schedules';
    EXECUTE 'CREATE POLICY "Authenticated can view schedules" ON public.shift_schedules FOR SELECT TO authenticated USING (true)';
  END IF;
END $$;