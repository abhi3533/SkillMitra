-- =============================================================================
-- Fix 1: Break infinite RLS recursion on students UPDATE policy.
--
-- The WITH CHECK clause in the previous migration did:
--   SELECT s.referral_credits FROM students s WHERE s.id = students.id
-- That subquery runs with RLS active, which re-evaluates the same UPDATE policy
-- → infinite recursion.  Fix: read the protected fields via a SECURITY DEFINER
-- function that bypasses RLS.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_student_protected_fields(_student_id uuid)
RETURNS TABLE(
  referral_credits      numeric,
  total_spent           numeric,
  total_sessions_attended integer
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT referral_credits, total_spent, total_sessions_attended
  FROM public.students
  WHERE id = _student_id;
$$;

DROP POLICY IF EXISTS "Students update own" ON public.students;

CREATE POLICY "Students update own" ON public.students
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND referral_credits IS NOT DISTINCT FROM (
    SELECT f.referral_credits FROM public.get_student_protected_fields(id) f
  )
  AND total_spent IS NOT DISTINCT FROM (
    SELECT f.total_spent FROM public.get_student_protected_fields(id) f
  )
  AND total_sessions_attended IS NOT DISTINCT FROM (
    SELECT f.total_sessions_attended FROM public.get_student_protected_fields(id) f
  )
);

-- =============================================================================
-- Fix 2: Ensure admin can read all students.
--
-- Re-create the admin policy explicitly so it is definitely present and
-- not shadowed by any other policy that may cause query errors.
-- =============================================================================

DROP POLICY IF EXISTS "Admins manage students" ON public.students;

CREATE POLICY "Admins manage students" ON public.students
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- =============================================================================
-- Fix 3: Backfill referral codes for any students that are still missing one
-- (covers students who signed up before complete-signup was called correctly).
-- =============================================================================

UPDATE public.students
SET referral_code = 'SM-' || upper(substr(md5(gen_random_uuid()::text), 1, 6))
WHERE referral_code IS NULL OR referral_code = '';
