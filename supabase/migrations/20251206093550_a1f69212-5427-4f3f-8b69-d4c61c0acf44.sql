-- Add user_id field to profiles for login (random generated ID)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_id TEXT UNIQUE;

-- Create index for faster lookup
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);