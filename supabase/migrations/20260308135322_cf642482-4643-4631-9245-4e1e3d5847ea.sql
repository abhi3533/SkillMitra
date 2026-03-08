
-- Performance indexes for commonly queried fields
CREATE INDEX IF NOT EXISTS idx_courses_trainer_id ON public.courses(trainer_id);
CREATE INDEX IF NOT EXISTS idx_courses_approval_status ON public.courses(approval_status);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON public.enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_trainer_id ON public.enrollments(trainer_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON public.enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON public.enrollments(status);
CREATE INDEX IF NOT EXISTS idx_course_sessions_trainer_id ON public.course_sessions(trainer_id);
CREATE INDEX IF NOT EXISTS idx_course_sessions_enrollment_id ON public.course_sessions(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_course_sessions_status ON public.course_sessions(status);
CREATE INDEX IF NOT EXISTS idx_course_sessions_scheduled_at ON public.course_sessions(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_ratings_trainer_id ON public.ratings(trainer_id);
CREATE INDEX IF NOT EXISTS idx_ratings_student_id ON public.ratings(student_id);
CREATE INDEX IF NOT EXISTS idx_ratings_session_id ON public.ratings(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_session_id ON public.attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_trainer_availability_trainer_id ON public.trainer_availability(trainer_id);
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON public.payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_enrollment_id ON public.payments(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_trainers_approval_status ON public.trainers(approval_status);
