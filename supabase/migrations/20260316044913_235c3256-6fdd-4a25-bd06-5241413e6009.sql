
-- SECURITY FIX: Restrict trainer self-update to non-system fields
DROP POLICY IF EXISTS "Trainers update own" ON public.trainers;
CREATE POLICY "Trainers update own" ON public.trainers
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND approval_status IS NOT DISTINCT FROM (SELECT t.approval_status FROM trainers t WHERE t.id = trainers.id)
  AND available_balance IS NOT DISTINCT FROM (SELECT t.available_balance FROM trainers t WHERE t.id = trainers.id)
  AND total_earnings IS NOT DISTINCT FROM (SELECT t.total_earnings FROM trainers t WHERE t.id = trainers.id)
  AND total_withdrawn IS NOT DISTINCT FROM (SELECT t.total_withdrawn FROM trainers t WHERE t.id = trainers.id)
  AND average_rating IS NOT DISTINCT FROM (SELECT t.average_rating FROM trainers t WHERE t.id = trainers.id)
  AND boost_score IS NOT DISTINCT FROM (SELECT t.boost_score FROM trainers t WHERE t.id = trainers.id)
  AND total_students IS NOT DISTINCT FROM (SELECT t.total_students FROM trainers t WHERE t.id = trainers.id)
  AND referral_credits IS NOT DISTINCT FROM (SELECT t.referral_credits FROM trainers t WHERE t.id = trainers.id)
  AND subscription_plan IS NOT DISTINCT FROM (SELECT t.subscription_plan FROM trainers t WHERE t.id = trainers.id)
);

-- SECURITY FIX: Restrict student self-update to non-system fields
DROP POLICY IF EXISTS "Students update own" ON public.students;
CREATE POLICY "Students update own" ON public.students
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND referral_credits IS NOT DISTINCT FROM (SELECT s.referral_credits FROM students s WHERE s.id = students.id)
  AND total_spent IS NOT DISTINCT FROM (SELECT s.total_spent FROM students s WHERE s.id = students.id)
  AND total_sessions_attended IS NOT DISTINCT FROM (SELECT s.total_sessions_attended FROM students s WHERE s.id = students.id)
);

-- SECURITY FIX: Restrict trainer rating updates to trainer-authored fields only
DROP POLICY IF EXISTS "Trainers update ratings" ON public.ratings;
CREATE POLICY "Trainers update ratings" ON public.ratings
FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM trainers WHERE trainers.id = ratings.trainer_id AND trainers.user_id = auth.uid()))
WITH CHECK (
  EXISTS (SELECT 1 FROM trainers WHERE trainers.id = ratings.trainer_id AND trainers.user_id = auth.uid())
  AND student_to_trainer_rating IS NOT DISTINCT FROM (SELECT r.student_to_trainer_rating FROM ratings r WHERE r.id = ratings.id)
  AND student_to_trainer_review IS NOT DISTINCT FROM (SELECT r.student_to_trainer_review FROM ratings r WHERE r.id = ratings.id)
  AND student_review_text IS NOT DISTINCT FROM (SELECT r.student_review_text FROM ratings r WHERE r.id = ratings.id)
  AND student_teaching_quality IS NOT DISTINCT FROM (SELECT r.student_teaching_quality FROM ratings r WHERE r.id = ratings.id)
  AND student_punctuality_rating IS NOT DISTINCT FROM (SELECT r.student_punctuality_rating FROM ratings r WHERE r.id = ratings.id)
  AND student_communication_rating IS NOT DISTINCT FROM (SELECT r.student_communication_rating FROM ratings r WHERE r.id = ratings.id)
  AND student_rated_at IS NOT DISTINCT FROM (SELECT r.student_rated_at FROM ratings r WHERE r.id = ratings.id)
);

-- SECURITY FIX: Restrict student rating inserts to valid enrollments
DROP POLICY IF EXISTS "Students manage ratings" ON public.ratings;
CREATE POLICY "Students read ratings" ON public.ratings
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM students WHERE students.id = ratings.student_id AND students.user_id = auth.uid()));

CREATE POLICY "Students insert ratings" ON public.ratings
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM students WHERE students.id = ratings.student_id AND students.user_id = auth.uid())
  AND EXISTS (SELECT 1 FROM enrollments e WHERE e.id = ratings.enrollment_id AND e.student_id = ratings.student_id AND e.trainer_id = ratings.trainer_id)
);

CREATE POLICY "Students update own ratings" ON public.ratings
FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM students WHERE students.id = ratings.student_id AND students.user_id = auth.uid()))
WITH CHECK (
  EXISTS (SELECT 1 FROM students WHERE students.id = ratings.student_id AND students.user_id = auth.uid())
  AND trainer_private_notes IS NOT DISTINCT FROM (SELECT r.trainer_private_notes FROM ratings r WHERE r.id = ratings.id)
);
