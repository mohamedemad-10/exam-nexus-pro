-- Add subject/material column to exams table
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS subject text DEFAULT 'general';

-- Create login_history table for tracking user logins
CREATE TABLE IF NOT EXISTS public.login_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  login_at timestamp with time zone NOT NULL DEFAULT now(),
  device_fingerprint text,
  ip_address text
);

-- Enable RLS on login_history
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all login history
CREATE POLICY "Admins can view all login history" 
ON public.login_history 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

-- Policy: Users can insert their own login history
CREATE POLICY "Users can insert own login history" 
ON public.login_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own login history
CREATE POLICY "Users can view own login history" 
ON public.login_history 
FOR SELECT 
USING (auth.uid() = user_id);

-- Add INSERT policy for device_registrations (missing - fixes security issue)
CREATE POLICY "Users can register their own device"
ON public.device_registrations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);