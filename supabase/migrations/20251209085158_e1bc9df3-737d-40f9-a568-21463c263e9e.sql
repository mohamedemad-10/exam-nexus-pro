-- Add grade column to exams table
ALTER TABLE public.exams ADD COLUMN grade TEXT DEFAULT 'general';

-- Update RLS policy to allow users to see exams for their grade or general exams
DROP POLICY IF EXISTS "Anyone can view active exams" ON public.exams;

CREATE POLICY "Users can view exams for their grade" 
ON public.exams 
FOR SELECT 
USING (
  is_active = true AND (
    grade = 'general' OR 
    grade = (SELECT class FROM public.profiles WHERE id = auth.uid()) OR
    has_role(auth.uid(), 'admin'::app_role)
  )
);