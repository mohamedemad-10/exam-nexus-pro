-- Add phone to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;

-- Create device_registrations table for device locking
CREATE TABLE public.device_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  device_fingerprint text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.device_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own device" ON public.device_registrations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage devices" ON public.device_registrations
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create contact_messages table
CREATE TABLE public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert contact messages" ON public.contact_messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage contact messages" ON public.contact_messages
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create passages table for reading comprehension
CREATE TABLE public.passages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  image_url text,
  order_index integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.passages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage passages" ON public.passages
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view passages for active exams" ON public.passages
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM exams WHERE exams.id = passages.exam_id AND exams.is_active = true
  ));

-- Add passage_id and image_url to questions
ALTER TABLE public.questions 
  ADD COLUMN IF NOT EXISTS passage_id uuid REFERENCES public.passages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS image_url text;

-- Create storage bucket for exam images
INSERT INTO storage.buckets (id, name, public) VALUES ('exam-images', 'exam-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for exam images
CREATE POLICY "Anyone can view exam images" ON storage.objects
  FOR SELECT USING (bucket_id = 'exam-images');

CREATE POLICY "Admins can upload exam images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'exam-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update exam images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'exam-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete exam images" ON storage.objects
  FOR DELETE USING (bucket_id = 'exam-images' AND has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete users (profiles)
CREATE POLICY "Admins can delete profiles" ON public.profiles
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to insert profiles (for user creation)
CREATE POLICY "Admins can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR auth.uid() = id);