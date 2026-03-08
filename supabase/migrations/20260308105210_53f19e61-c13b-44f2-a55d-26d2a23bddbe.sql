
-- Create session_reflections table
CREATE TABLE public.session_reflections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.course_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  learned_today TEXT NOT NULL DEFAULT '',
  confidence_level INTEGER NOT NULL DEFAULT 3,
  questions_for_next TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT confidence_range CHECK (confidence_level >= 1 AND confidence_level <= 5),
  UNIQUE(session_id, student_id)
);

-- Enable RLS
ALTER TABLE public.session_reflections ENABLE ROW LEVEL SECURITY;

-- Students can manage their own reflections
CREATE POLICY "Students manage own reflections" ON public.session_reflections
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.students WHERE students.id = session_reflections.student_id AND students.user_id = auth.uid()));

-- Trainers can read reflections for their sessions
CREATE POLICY "Trainers read reflections" ON public.session_reflections
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.course_sessions cs
    JOIN public.trainers t ON cs.trainer_id = t.id
    WHERE cs.id = session_reflections.session_id AND t.user_id = auth.uid()
  ));

-- Admins manage all
CREATE POLICY "Admins manage reflections" ON public.session_reflections
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
