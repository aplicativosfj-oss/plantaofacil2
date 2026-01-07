-- Fix overly-permissive RLS policy on unit_leadership (replace with admin-only management)
DROP POLICY IF EXISTS "Service role can manage unit leadership" ON public.unit_leadership;
DROP POLICY IF EXISTS "Admins can manage unit leadership" ON public.unit_leadership;

CREATE POLICY "Admins can manage unit leadership"
ON public.unit_leadership
FOR ALL
USING (public.is_admin_or_higher(auth.uid()))
WITH CHECK (public.is_admin_or_higher(auth.uid()));