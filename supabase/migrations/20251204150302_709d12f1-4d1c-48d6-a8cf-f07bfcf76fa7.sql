-- Allow admins to delete user exam attempts (for Allow Retake feature)
CREATE POLICY "Admins can delete attempts"
ON public.user_exam_attempts
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));