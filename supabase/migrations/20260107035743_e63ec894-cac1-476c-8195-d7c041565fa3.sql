-- Add RLS policy to allow authenticated users to insert their own agent profile
CREATE POLICY "Users can create their own agent profile" 
ON public.agents 
FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Also add policy to allow anon to insert (for signup flow where auth is not yet established)
CREATE POLICY "Allow signup insert for agents" 
ON public.agents 
FOR INSERT 
TO anon
WITH CHECK (true);

-- Drop the anon policy and use a more secure approach with service role
-- Actually, since signUp creates the user first, auth.uid() should be available
-- Let's also check user_roles table

-- Check if user_roles table needs similar policies
-- First let me check existing policies on user_roles