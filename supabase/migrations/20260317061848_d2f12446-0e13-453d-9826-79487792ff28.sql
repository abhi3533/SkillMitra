ALTER TABLE public.students 
  ADD COLUMN IF NOT EXISTS education_level text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS skill_experience text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS student_status text DEFAULT NULL;