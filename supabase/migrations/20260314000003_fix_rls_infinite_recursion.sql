-- Fix RLS infinite recursion on students table.
--
-- "Trainers read enrolled students" policy queries enrollments,
-- and enrollments' "Students read enrollments" policy queries students back → cycle.
-- Solution: wrap the check in a SECURITY DEFINER function so it runs without RLS.

CREATE OR REPLACE FUNCTION public.trainer_has_enrolled_student(
  _trainer_user_id uuid,
  _student_id uuid
)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.enrollments e
    JOIN public.trainers t ON e.trainer_id = t.id
    WHERE e.student_id = _student_id
      AND t.user_id = _trainer_user_id
  )
$$;

-- Replace the policy with one that uses the SECURITY DEFINER function
DROP POLICY IF EXISTS "Trainers read enrolled students" ON public.students;

CREATE POLICY "Trainers read enrolled students"
ON public.students
FOR SELECT
TO authenticated
USING (public.trainer_has_enrolled_student(auth.uid(), id));

-- Also ensure every student row has a referral_code (backfill any nulls
-- that may exist from OTP/phone signups where the trigger metadata was missing).
UPDATE public.students
SET referral_code = 'SM-' || upper(substr(md5(gen_random_uuid()::text), 1, 6))
WHERE referral_code IS NULL;
