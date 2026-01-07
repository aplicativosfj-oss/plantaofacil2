-- Add INSERT policy for user_roles to allow users to create their own role during signup
CREATE POLICY "Users can create their own role during signup" 
ON public.user_roles 
FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());