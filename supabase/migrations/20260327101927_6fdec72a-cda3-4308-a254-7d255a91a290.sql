-- Fix infinite recursion: enrollments <-> students circular RLS dependency
-- Create SECURITY DEFINER helper functions to bypass RLS in cross-table checks

CREATE OR REPLACE FUNCTION public.is_student_owner(_student_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.students WHERE id = _student_id AND user_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.is_trainer_owner(_trainer_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.trainers WHERE id = _trainer_id AND user_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.trainer_has_enrollment_for_student(_student_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.enrollments e
    JOIN public.trainers t ON e.trainer_id = t.id
    WHERE e.student_id = _student_id AND t.user_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.student_has_enrollment(_enrollment_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.enrollments e
    JOIN public.students s ON e.student_id = s.id
    WHERE e.id = _enrollment_id AND s.user_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.trainer_has_enrollment(_enrollment_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.enrollments e
    JOIN public.trainers t ON e.trainer_id = t.id
    WHERE e.id = _enrollment_id AND t.user_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.get_enrollment_financials(_enrollment_id uuid)
RETURNS TABLE(amount_paid numeric, trainer_payout numeric, platform_commission numeric)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.amount_paid, e.trainer_payout, e.platform_commission
  FROM public.enrollments e WHERE e.id = _enrollment_id
$$;

-- Fix ENROLLMENTS policies
DROP POLICY IF EXISTS "Students read enrollments" ON enrollments;
CREATE POLICY "Students read enrollments" ON enrollments
  FOR SELECT TO authenticated
  USING (is_student_owner(student_id, auth.uid()));

DROP POLICY IF EXISTS "Trainers read enrollments" ON enrollments;
CREATE POLICY "Trainers read enrollments" ON enrollments
  FOR SELECT TO authenticated
  USING (is_trainer_owner(trainer_id, auth.uid()));

DROP POLICY IF EXISTS "Trainers update enrollments" ON enrollments;
CREATE POLICY "Trainers update enrollments" ON enrollments
  FOR UPDATE TO authenticated
  USING (is_trainer_owner(trainer_id, auth.uid()))
  WITH CHECK (
    is_trainer_owner(trainer_id, auth.uid())
    AND amount_paid = (SELECT f.amount_paid FROM get_enrollment_financials(id) f)
    AND trainer_payout = (SELECT f.trainer_payout FROM get_enrollment_financials(id) f)
    AND platform_commission = (SELECT f.platform_commission FROM get_enrollment_financials(id) f)
  );

-- Fix STUDENTS policies
DROP POLICY IF EXISTS "Trainers read enrolled students" ON students;
CREATE POLICY "Trainers read enrolled students" ON students
  FOR SELECT TO authenticated
  USING (trainer_has_enrollment_for_student(id, auth.uid()));

-- Fix COURSE_SESSIONS policies
DROP POLICY IF EXISTS "Students read sessions" ON course_sessions;
CREATE POLICY "Students read sessions" ON course_sessions
  FOR SELECT TO authenticated
  USING (student_has_enrollment(enrollment_id, auth.uid()));

DROP POLICY IF EXISTS "Students update sessions" ON course_sessions;
CREATE POLICY "Students update sessions" ON course_sessions
  FOR UPDATE TO authenticated
  USING (student_has_enrollment(enrollment_id, auth.uid()))
  WITH CHECK (
    student_has_enrollment(enrollment_id, auth.uid())
    AND status IS NOT DISTINCT FROM (SELECT cs.status FROM course_sessions cs WHERE cs.id = course_sessions.id)
    AND joined_by_trainer IS NOT DISTINCT FROM (SELECT cs.joined_by_trainer FROM course_sessions cs WHERE cs.id = course_sessions.id)
    AND trainer_join_time IS NOT DISTINCT FROM (SELECT cs.trainer_join_time FROM course_sessions cs WHERE cs.id = course_sessions.id)
    AND no_show_by IS NOT DISTINCT FROM (SELECT cs.no_show_by FROM course_sessions cs WHERE cs.id = course_sessions.id)
    AND notes IS NOT DISTINCT FROM (SELECT cs.notes FROM course_sessions cs WHERE cs.id = course_sessions.id)
    AND recording_url IS NOT DISTINCT FROM (SELECT cs.recording_url FROM course_sessions cs WHERE cs.id = course_sessions.id)
  );

-- Fix PAYMENTS policies
DROP POLICY IF EXISTS "Trainers read payments" ON payments;
CREATE POLICY "Trainers read payments" ON payments
  FOR SELECT TO authenticated
  USING (trainer_has_enrollment(enrollment_id, auth.uid()));

-- Fix RATINGS policies
DROP POLICY IF EXISTS "Students read ratings" ON ratings;
CREATE POLICY "Students read ratings" ON ratings
  FOR SELECT TO authenticated
  USING (is_student_owner(student_id, auth.uid()));

DROP POLICY IF EXISTS "Trainers read ratings" ON ratings;
CREATE POLICY "Trainers read ratings" ON ratings
  FOR SELECT TO authenticated
  USING (is_trainer_owner(trainer_id, auth.uid()));

DROP POLICY IF EXISTS "Students insert ratings" ON ratings;
CREATE POLICY "Students insert ratings" ON ratings
  FOR INSERT TO authenticated
  WITH CHECK (
    is_student_owner(student_id, auth.uid())
    AND student_has_enrollment(enrollment_id, auth.uid())
  );

DROP POLICY IF EXISTS "Students update own ratings" ON ratings;
CREATE POLICY "Students update own ratings" ON ratings
  FOR UPDATE TO authenticated
  USING (is_student_owner(student_id, auth.uid()))
  WITH CHECK (
    is_student_owner(student_id, auth.uid())
    AND trainer_private_notes IS NOT DISTINCT FROM (SELECT r.trainer_private_notes FROM ratings r WHERE r.id = ratings.id)
  );

DROP POLICY IF EXISTS "Trainers update ratings" ON ratings;
CREATE POLICY "Trainers update ratings" ON ratings
  FOR UPDATE TO authenticated
  USING (is_trainer_owner(trainer_id, auth.uid()))
  WITH CHECK (
    is_trainer_owner(trainer_id, auth.uid())
    AND student_to_trainer_rating IS NOT DISTINCT FROM (SELECT r.student_to_trainer_rating FROM ratings r WHERE r.id = ratings.id)
    AND student_to_trainer_review IS NOT DISTINCT FROM (SELECT r.student_to_trainer_review FROM ratings r WHERE r.id = ratings.id)
    AND student_review_text IS NOT DISTINCT FROM (SELECT r.student_review_text FROM ratings r WHERE r.id = ratings.id)
    AND student_teaching_quality IS NOT DISTINCT FROM (SELECT r.student_teaching_quality FROM ratings r WHERE r.id = ratings.id)
    AND student_punctuality_rating IS NOT DISTINCT FROM (SELECT r.student_punctuality_rating FROM ratings r WHERE r.id = ratings.id)
    AND student_communication_rating IS NOT DISTINCT FROM (SELECT r.student_communication_rating FROM ratings r WHERE r.id = ratings.id)
    AND student_rated_at IS NOT DISTINCT FROM (SELECT r.student_rated_at FROM ratings r WHERE r.id = ratings.id)
  );

-- Fix CERTIFICATES policies
DROP POLICY IF EXISTS "Students read certs" ON certificates;
CREATE POLICY "Students read certs" ON certificates
  FOR SELECT TO authenticated
  USING (is_student_owner(student_id, auth.uid()));

DROP POLICY IF EXISTS "Trainers manage certs" ON certificates;
CREATE POLICY "Trainers manage certs" ON certificates
  FOR ALL TO authenticated
  USING (is_trainer_owner(trainer_id, auth.uid()));

-- Fix REFERRALS policies
DROP POLICY IF EXISTS "Students read referrals" ON referrals;
CREATE POLICY "Students read referrals" ON referrals
  FOR SELECT TO authenticated
  USING (is_student_owner(referrer_id, auth.uid()));