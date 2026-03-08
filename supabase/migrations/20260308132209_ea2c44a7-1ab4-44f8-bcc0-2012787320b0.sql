
-- Fix: Convert public-read RESTRICTIVE policies to PERMISSIVE so anonymous/public users can actually read data

-- 1. trainers: Public read approved trainers
DROP POLICY IF EXISTS "Public read approved trainers safe" ON public.trainers;
CREATE POLICY "Public read approved trainers safe" ON public.trainers
  FOR SELECT TO anon, authenticated
  USING (approval_status = 'approved');

-- 2. profiles: Public read verified profiles
DROP POLICY IF EXISTS "Public read verified profiles safe" ON public.profiles;
CREATE POLICY "Public read verified profiles safe" ON public.profiles
  FOR SELECT TO anon, authenticated
  USING (is_verified = true);

-- 3. courses: Public read approved courses
DROP POLICY IF EXISTS "Public read approved courses" ON public.courses;
CREATE POLICY "Public read approved courses" ON public.courses
  FOR SELECT TO anon, authenticated
  USING (approval_status = 'approved' AND is_active = true);

-- 4. trainer_availability: Public read availability
DROP POLICY IF EXISTS "Public read availability" ON public.trainer_availability;
CREATE POLICY "Public read availability" ON public.trainer_availability
  FOR SELECT TO anon, authenticated
  USING (true);

-- 5. ratings: Public read ratings
DROP POLICY IF EXISTS "Public read ratings safe" ON public.ratings;
CREATE POLICY "Public read ratings safe" ON public.ratings
  FOR SELECT TO anon, authenticated
  USING (true);

-- 6. course_curriculum: Public read curriculum for approved courses
DROP POLICY IF EXISTS "Public read curriculum" ON public.course_curriculum;
CREATE POLICY "Public read curriculum" ON public.course_curriculum
  FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM courses WHERE courses.id = course_curriculum.course_id AND courses.approval_status = 'approved'
  ));
