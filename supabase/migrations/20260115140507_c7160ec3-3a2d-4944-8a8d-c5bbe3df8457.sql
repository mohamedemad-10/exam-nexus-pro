-- Add policy for public profile lookup by user_id (for login)
CREATE POLICY "Public can lookup profiles by user_id for login" ON public.profiles
  FOR SELECT USING (true);