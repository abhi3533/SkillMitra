ALTER TABLE public.trainers
  ADD COLUMN IF NOT EXISTS trainer_type text,
  ADD COLUMN IF NOT EXISTS session_duration_per_day text,
  ADD COLUMN IF NOT EXISTS available_time_bands text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS weekend_availability text;