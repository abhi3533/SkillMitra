-- Refund requests table for admin approval workflow
CREATE TABLE IF NOT EXISTS public.refund_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL,
  student_user_id UUID NOT NULL,
  trainer_user_id UUID,
  course_id UUID,
  course_title TEXT,
  amount NUMERIC NOT NULL,
  trainer_payout NUMERIC NOT NULL DEFAULT 0,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  admin_notes TEXT,
  processed_by UUID,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_refund_requests_status ON public.refund_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_refund_requests_enrollment ON public.refund_requests(enrollment_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_refund_pending_per_enrollment ON public.refund_requests(enrollment_id) WHERE status = 'pending';

ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage refund requests" ON public.refund_requests
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students read own refund requests" ON public.refund_requests
  FOR SELECT USING (auth.uid() = student_user_id);

CREATE POLICY "Trainers read own refund requests" ON public.refund_requests
  FOR SELECT USING (auth.uid() = trainer_user_id);

CREATE POLICY "Service role manages refund requests" ON public.refund_requests
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Add 'pending_admin' as a valid refund_status on enrollments (already TEXT, no enum change needed)
COMMENT ON COLUMN public.enrollments.refund_status IS 'none | pending_admin | refunded | rejected';