
-- FIX 1: Ratings - restrict public SELECT to only student-facing fields
-- Drop the overly permissive public policy
DROP POLICY IF EXISTS "Public read ratings safe" ON public.ratings;

-- The get_public_ratings() RPC already returns only safe fields, 
-- so we don't need a public SELECT policy at all.
-- Public ratings access goes through the RPC function.

-- FIX 2: Students - restrict trainer reads to only their enrolled students
DROP POLICY IF EXISTS "Trainers read students" ON public.students;

CREATE POLICY "Trainers read enrolled students"
ON public.students
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM enrollments e
    JOIN trainers t ON e.trainer_id = t.id
    WHERE e.student_id = students.id
    AND t.user_id = auth.uid()
  )
);

-- FIX 3: Certificates - restrict public verify to only verification fields
DROP POLICY IF EXISTS "Public verify certs safe" ON public.certificates;
-- Public certificate verification goes through the verify_certificate() RPC function.
-- No public SELECT policy needed.
