-- Performance indexes for high-traffic queries
-- enrollments
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id  ON public.enrollments (student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_trainer_id  ON public.enrollments (trainer_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id   ON public.enrollments (course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status      ON public.enrollments (status);

-- course_sessions
CREATE INDEX IF NOT EXISTS idx_sessions_enrollment_id  ON public.course_sessions (enrollment_id);
CREATE INDEX IF NOT EXISTS idx_sessions_trainer_id     ON public.course_sessions (trainer_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status         ON public.course_sessions (status);
CREATE INDEX IF NOT EXISTS idx_sessions_scheduled_at   ON public.course_sessions (scheduled_at);

-- trainers
CREATE INDEX IF NOT EXISTS idx_trainers_approval_status ON public.trainers (approval_status);
CREATE INDEX IF NOT EXISTS idx_trainers_boost_score     ON public.trainers (boost_score DESC);

-- payments
CREATE INDEX IF NOT EXISTS idx_payments_student_id      ON public.payments (student_id);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_order  ON public.payments (razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status          ON public.payments (status);

-- ratings
CREATE INDEX IF NOT EXISTS idx_ratings_trainer_id  ON public.ratings (trainer_id);
CREATE INDEX IF NOT EXISTS idx_ratings_student_id  ON public.ratings (student_id);
CREATE INDEX IF NOT EXISTS idx_ratings_session_id  ON public.ratings (session_id) WHERE session_id IS NOT NULL;

-- attendance
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON public.attendance (student_id);

-- notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id  ON public.notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread   ON public.notifications (user_id, is_read) WHERE is_read = false;

-- referrals
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.referrals (referrer_id);

-- Atomic course enrollment counter — prevents read-then-write race condition
CREATE OR REPLACE FUNCTION public.increment_course_enrolled(course_id_param uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.courses
  SET total_enrolled = COALESCE(total_enrolled, 0) + 1
  WHERE id = course_id_param;
$$;
