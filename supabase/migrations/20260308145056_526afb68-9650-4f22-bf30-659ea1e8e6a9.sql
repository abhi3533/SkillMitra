
-- FIX 1: Restrict trainer enrollment updates to operational fields only
DROP POLICY IF EXISTS "Trainers update enrollments" ON public.enrollments;

CREATE POLICY "Trainers update enrollments"
ON public.enrollments
FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM trainers WHERE trainers.id = enrollments.trainer_id AND trainers.user_id = auth.uid())
)
WITH CHECK (
  EXISTS (SELECT 1 FROM trainers WHERE trainers.id = enrollments.trainer_id AND trainers.user_id = auth.uid())
  AND amount_paid IS NOT DISTINCT FROM (SELECT e.amount_paid FROM enrollments e WHERE e.id = enrollments.id)
  AND trainer_payout IS NOT DISTINCT FROM (SELECT e.trainer_payout FROM enrollments e WHERE e.id = enrollments.id)
  AND platform_commission IS NOT DISTINCT FROM (SELECT e.platform_commission FROM enrollments e WHERE e.id = enrollments.id)
);

-- FIX 2: Restrict student session updates to student-specific fields
DROP POLICY IF EXISTS "Students update sessions" ON public.course_sessions;

CREATE POLICY "Students update sessions"
ON public.course_sessions
FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM enrollments e JOIN students s ON e.student_id = s.id WHERE e.id = course_sessions.enrollment_id AND s.user_id = auth.uid())
)
WITH CHECK (
  EXISTS (SELECT 1 FROM enrollments e JOIN students s ON e.student_id = s.id WHERE e.id = course_sessions.enrollment_id AND s.user_id = auth.uid())
  AND status IS NOT DISTINCT FROM (SELECT cs.status FROM course_sessions cs WHERE cs.id = course_sessions.id)
  AND joined_by_trainer IS NOT DISTINCT FROM (SELECT cs.joined_by_trainer FROM course_sessions cs WHERE cs.id = course_sessions.id)
  AND trainer_join_time IS NOT DISTINCT FROM (SELECT cs.trainer_join_time FROM course_sessions cs WHERE cs.id = course_sessions.id)
  AND no_show_by IS NOT DISTINCT FROM (SELECT cs.no_show_by FROM course_sessions cs WHERE cs.id = course_sessions.id)
  AND notes IS NOT DISTINCT FROM (SELECT cs.notes FROM course_sessions cs WHERE cs.id = course_sessions.id)
  AND recording_url IS NOT DISTINCT FROM (SELECT cs.recording_url FROM course_sessions cs WHERE cs.id = course_sessions.id)
);
