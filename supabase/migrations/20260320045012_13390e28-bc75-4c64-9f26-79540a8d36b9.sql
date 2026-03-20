ALTER TABLE public.trainers
  ADD COLUMN IF NOT EXISTS profile_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS course_status text NOT NULL DEFAULT 'not_created',
  ADD COLUMN IF NOT EXISTS trainer_status text NOT NULL DEFAULT 'inactive';