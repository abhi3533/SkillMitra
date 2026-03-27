
-- Table to track match emails sent per day (rate limiting: 1 per person per day)
CREATE TABLE public.match_email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email text NOT NULL,
  email_type text NOT NULL,
  sent_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for fast lookup of recent emails
CREATE INDEX idx_match_email_log_recipient_date ON public.match_email_log (recipient_email, sent_at DESC);

-- Enable RLS
ALTER TABLE public.match_email_log ENABLE ROW LEVEL SECURITY;

-- Only service role can manage
CREATE POLICY "Service role manages match email log"
  ON public.match_email_log FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Table for email preferences (unsubscribe)
CREATE TABLE public.email_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  match_emails_enabled boolean NOT NULL DEFAULT true,
  digest_emails_enabled boolean NOT NULL DEFAULT true,
  profile_view_emails_enabled boolean NOT NULL DEFAULT true,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.email_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own email prefs"
  ON public.email_preferences FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own email prefs"
  ON public.email_preferences FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users insert own email prefs"
  ON public.email_preferences FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role manages email prefs"
  ON public.email_preferences FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
