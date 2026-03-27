
-- Trial bookings table (approval flow)
CREATE TABLE public.trial_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  trainer_id uuid NOT NULL REFERENCES public.trainers(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'auto_rejected')),
  selected_day integer,
  selected_slot text,
  scheduled_at timestamptz,
  meet_link text,
  rejection_reason text,
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id, trainer_id)
);

-- Trainer trial settings
CREATE TABLE public.trainer_trial_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id uuid NOT NULL REFERENCES public.trainers(id) ON DELETE CASCADE UNIQUE,
  max_trials_per_month integer NOT NULL DEFAULT 5,
  trial_availability jsonb DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Admin activity log
CREATE TABLE public.admin_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  title text NOT NULL,
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_trial_bookings_student ON public.trial_bookings(student_id);
CREATE INDEX idx_trial_bookings_trainer ON public.trial_bookings(trainer_id);
CREATE INDEX idx_trial_bookings_status ON public.trial_bookings(status);
CREATE INDEX idx_admin_activity_log_created ON public.admin_activity_log(created_at DESC);
CREATE INDEX idx_admin_activity_log_type ON public.admin_activity_log(event_type);

-- RLS
ALTER TABLE public.trial_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainer_trial_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;

-- Trial bookings policies
CREATE POLICY "Students see own trial bookings"
  ON public.trial_bookings FOR SELECT TO authenticated
  USING (public.is_student_owner(student_id, auth.uid()));

CREATE POLICY "Trainers see their trial bookings"
  ON public.trial_bookings FOR SELECT TO authenticated
  USING (public.is_trainer_owner(trainer_id, auth.uid()));

CREATE POLICY "Students insert own trial bookings"
  ON public.trial_bookings FOR INSERT TO authenticated
  WITH CHECK (public.is_student_owner(student_id, auth.uid()));

CREATE POLICY "Trainers update their trial bookings"
  ON public.trial_bookings FOR UPDATE TO authenticated
  USING (public.is_trainer_owner(trainer_id, auth.uid()));

CREATE POLICY "Admins manage trial bookings"
  ON public.trial_bookings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role manages trial bookings"
  ON public.trial_bookings FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Trainer trial settings policies
CREATE POLICY "Trainers read own trial settings"
  ON public.trainer_trial_settings FOR SELECT TO authenticated
  USING (public.is_trainer_owner(trainer_id, auth.uid()));

CREATE POLICY "Trainers manage own trial settings"
  ON public.trainer_trial_settings FOR ALL TO authenticated
  USING (public.is_trainer_owner(trainer_id, auth.uid()))
  WITH CHECK (public.is_trainer_owner(trainer_id, auth.uid()));

CREATE POLICY "Service role manages trial settings"
  ON public.trainer_trial_settings FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Authenticated read trial settings"
  ON public.trainer_trial_settings FOR SELECT TO authenticated
  USING (true);

-- Admin activity log policies
CREATE POLICY "Admins read activity log"
  ON public.admin_activity_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role manages activity log"
  ON public.admin_activity_log FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Function to count trainer's trials this month
CREATE OR REPLACE FUNCTION public.get_trainer_trial_count_this_month(p_trainer_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(*)::integer
  FROM public.trial_bookings
  WHERE trainer_id = p_trainer_id
    AND status IN ('pending', 'approved')
    AND created_at >= date_trunc('month', now())
$$;
