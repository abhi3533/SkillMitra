
-- 1. Add columns to courses
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS course_start_date DATE,
  ADD COLUMN IF NOT EXISTS available_slot_bands TEXT[] DEFAULT '{}'::text[];

-- 2. Add default slot bands to trainers
ALTER TABLE public.trainers
  ADD COLUMN IF NOT EXISTS default_slot_bands TEXT[] DEFAULT '{}'::text[];

-- 3. Add explicit date+hour to trial bookings
ALTER TABLE public.trial_bookings
  ADD COLUMN IF NOT EXISTS selected_date DATE,
  ADD COLUMN IF NOT EXISTS selected_hour INTEGER;

-- 4. Create trainer_booked_slots table
CREATE TABLE IF NOT EXISTS public.trainer_booked_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id UUID NOT NULL REFERENCES public.trainers(id) ON DELETE CASCADE,
  slot_date DATE NOT NULL,
  slot_hour INTEGER NOT NULL CHECK (slot_hour >= 0 AND slot_hour <= 23),
  session_id UUID REFERENCES public.course_sessions(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE CASCADE,
  trial_booking_id UUID REFERENCES public.trial_bookings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT trainer_booked_slots_unique UNIQUE (trainer_id, slot_date, slot_hour)
);

CREATE INDEX IF NOT EXISTS idx_trainer_booked_slots_trainer_date
  ON public.trainer_booked_slots (trainer_id, slot_date);

ALTER TABLE public.trainer_booked_slots ENABLE ROW LEVEL SECURITY;

-- Public can read (needed by booking calendar to mark taken slots)
CREATE POLICY "Public read booked slots"
ON public.trainer_booked_slots
FOR SELECT
TO anon, authenticated
USING (true);

-- Trainers see their own
CREATE POLICY "Trainers read own booked slots"
ON public.trainer_booked_slots
FOR SELECT
TO authenticated
USING (public.is_trainer_owner(trainer_id, auth.uid()));

-- Service role full control
CREATE POLICY "Service role manages booked slots"
ON public.trainer_booked_slots
FOR ALL
TO public
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Admins manage
CREATE POLICY "Admins manage booked slots"
ON public.trainer_booked_slots
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
