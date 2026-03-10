
ALTER TABLE public.trainers 
  ADD COLUMN IF NOT EXISTS onboarding_step integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS onboarding_data jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS onboarding_status text DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS last_saved_at timestamptz DEFAULT now();
