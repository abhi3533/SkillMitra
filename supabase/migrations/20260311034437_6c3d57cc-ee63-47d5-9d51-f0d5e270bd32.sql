CREATE OR REPLACE FUNCTION public.get_student_user_ids(student_ids uuid[])
RETURNS TABLE(student_id uuid, user_id uuid)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT s.id, s.user_id
  FROM public.students s
  WHERE s.id = ANY(student_ids);
$$;