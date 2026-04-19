-- Seed test course for end-to-end booking validation
UPDATE public.courses
SET 
  approval_status = 'approved',
  course_start_date = (CURRENT_DATE + INTERVAL '2 days')::date,
  available_slot_bands = ARRAY['morning','evening'],
  has_free_trial = true,
  total_sessions = 4,
  session_duration_mins = 60
WHERE id = 'da578040-45c0-446d-b0b9-56c605043dfc';