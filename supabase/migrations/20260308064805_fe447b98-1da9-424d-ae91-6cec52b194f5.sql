
-- Create attendance table
CREATE TABLE public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.course_sessions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  enrollment_id uuid NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'absent' CHECK (status IN ('present', 'absent', 'excused')),
  marked_by uuid NOT NULL REFERENCES public.trainers(id),
  marked_at timestamptz DEFAULT now(),
  notes text,
  UNIQUE(session_id, student_id)
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Trainers can manage attendance for their sessions
CREATE POLICY "Trainers manage attendance" ON public.attendance
FOR ALL USING (
  EXISTS (SELECT 1 FROM trainers WHERE trainers.id = attendance.marked_by AND trainers.user_id = auth.uid())
);

-- Students can read their own attendance
CREATE POLICY "Students read own attendance" ON public.attendance
FOR SELECT USING (
  EXISTS (SELECT 1 FROM students WHERE students.id = attendance.student_id AND students.user_id = auth.uid())
);

-- Admins manage all
CREATE POLICY "Admins manage attendance" ON public.attendance
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
