ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS refund_eligible_until timestamptz,
  ADD COLUMN IF NOT EXISTS refund_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS refund_requested_at timestamptz;

UPDATE public.platform_settings SET commission_percent = 0 WHERE commission_percent <> 0;