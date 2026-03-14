-- Monitoring logs table for health-monitor edge function
CREATE TABLE IF NOT EXISTS public.monitoring_logs (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  status       text        NOT NULL CHECK (status IN ('healthy', 'degraded', 'critical')),
  checks       jsonb       NOT NULL DEFAULT '[]',
  pass_count   integer     NOT NULL DEFAULT 0,
  fail_count   integer     NOT NULL DEFAULT 0,
  checked_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_monitoring_logs_checked_at ON public.monitoring_logs (checked_at DESC);

-- Only admins can read monitoring logs; the function writes via service role
ALTER TABLE public.monitoring_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read monitoring" ON public.monitoring_logs
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Auto-cleanup: keep only the last 30 days of logs to avoid table bloat
CREATE OR REPLACE FUNCTION public.cleanup_monitoring_logs()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  DELETE FROM public.monitoring_logs WHERE checked_at < now() - interval '30 days';
$$;

COMMENT ON TABLE public.monitoring_logs IS
  'Health check results written by health-monitor edge function every 30 minutes.';
