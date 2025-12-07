-- Add policy to allow anyone to look up profiles by user_id for authentication
CREATE POLICY "Anyone can lookup profiles by user_id for auth"
ON public.profiles
FOR SELECT
USING (true);