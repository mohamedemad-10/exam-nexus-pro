-- Add class column to profiles table for admin to assign classes to users
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS class TEXT;

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.class IS 'Class assigned to user by admin';