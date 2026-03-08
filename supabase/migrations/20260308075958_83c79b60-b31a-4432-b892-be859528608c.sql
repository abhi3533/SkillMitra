
-- Platform settings singleton table
CREATE TABLE public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_percent numeric NOT NULL DEFAULT 10,
  min_payout_amount numeric NOT NULL DEFAULT 500,
  student_referral_reward numeric NOT NULL DEFAULT 200,
  trainer_referral_reward numeric NOT NULL DEFAULT 500,
  session_reminder_hours integer NOT NULL DEFAULT 24,
  maintenance_mode boolean NOT NULL DEFAULT false,
  homepage_stats_override boolean NOT NULL DEFAULT false,
  custom_student_count integer,
  custom_trainer_count integer,
  custom_rating numeric,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid
);

-- Insert default row
INSERT INTO public.platform_settings (id) VALUES (gen_random_uuid());

-- Enable RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage settings
CREATE POLICY "Admins manage settings" ON public.platform_settings
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Communications/announcements log table
CREATE TABLE public.admin_communications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  body text NOT NULL,
  target_audience text NOT NULL DEFAULT 'all',
  sent_by uuid NOT NULL,
  sent_at timestamp with time zone DEFAULT now(),
  recipient_count integer DEFAULT 0,
  channel text DEFAULT 'email'
);

ALTER TABLE public.admin_communications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage communications" ON public.admin_communications
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
