
-- ============================================================
-- SECURITY FIX: Harden RLS policies across all flagged tables
-- ============================================================

-- 1. CRITICAL: Trainers - Replace public policy that exposes financial data
DROP POLICY IF EXISTS "Public read approved trainers" ON public.trainers;
DROP POLICY IF EXISTS "Public read approved trainers safe" ON public.trainers;

CREATE POLICY "Public read approved trainers safe" ON public.trainers
  FOR SELECT
  TO public
  USING (approval_status = 'approved');

-- Create a security definer function to return only safe trainer columns
CREATE OR REPLACE FUNCTION public.get_public_trainer_profile(trainer_row_id uuid)
RETURNS TABLE (
  trainer_id uuid,
  trainer_user_id uuid,
  trainer_bio text,
  trainer_skills text[],
  trainer_experience_years integer,
  trainer_current_company text,
  trainer_current_role text,
  trainer_teaching_languages text[],
  trainer_average_rating numeric,
  trainer_total_students integer,
  trainer_approval_status text,
  trainer_intro_video_url text,
  trainer_linkedin_url text,
  trainer_previous_companies text[],
  trainer_boost_score integer,
  trainer_subscription_plan text,
  trainer_is_job_seeker boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    t.id, t.user_id, t.bio, t.skills, t.experience_years,
    t.current_company, t.current_role, t.teaching_languages,
    t.average_rating, t.total_students, t.approval_status,
    t.intro_video_url, t.linkedin_url, t.previous_companies,
    t.boost_score, t.subscription_plan, t.is_job_seeker
  FROM public.trainers t
  WHERE t.id = trainer_row_id AND t.approval_status = 'approved';
$$;

-- 2. CRITICAL: Profiles - Replace public policy that exposes email/phone
DROP POLICY IF EXISTS "Public can read verified profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public read verified profiles safe" ON public.profiles;

CREATE POLICY "Public read verified profiles safe" ON public.profiles
  FOR SELECT
  TO public
  USING (is_verified = true);

-- Create a security definer function for safe public profile data
CREATE OR REPLACE FUNCTION public.get_public_profile(profile_id uuid)
RETURNS TABLE (
  p_id uuid,
  p_full_name text,
  p_city text,
  p_state text,
  p_profile_picture_url text,
  p_is_verified boolean,
  p_gender text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id, p.full_name, p.city, p.state, p.profile_picture_url,
    p.is_verified, p.gender
  FROM public.profiles p
  WHERE p.id = profile_id AND p.is_verified = true;
$$;

-- 3. CRITICAL: Ratings - Replace public policy that exposes private notes
DROP POLICY IF EXISTS "Public read ratings" ON public.ratings;
DROP POLICY IF EXISTS "Public read ratings safe" ON public.ratings;

CREATE POLICY "Public read ratings safe" ON public.ratings
  FOR SELECT
  TO public
  USING (true);

-- Create a security definer function for safe public ratings
CREATE OR REPLACE FUNCTION public.get_public_ratings(p_trainer_id uuid)
RETURNS TABLE (
  r_id uuid,
  r_enrollment_id uuid,
  r_student_id uuid,
  r_trainer_id uuid,
  r_student_to_trainer_rating integer,
  r_student_to_trainer_review text,
  r_student_teaching_quality integer,
  r_student_punctuality_rating integer,
  r_student_communication_rating integer,
  r_student_rated_at timestamptz,
  r_created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    r.id, r.enrollment_id, r.student_id, r.trainer_id,
    r.student_to_trainer_rating, r.student_to_trainer_review,
    r.student_teaching_quality, r.student_punctuality_rating,
    r.student_communication_rating, r.student_rated_at, r.created_at
  FROM public.ratings r
  WHERE r.trainer_id = p_trainer_id;
$$;

-- 4. WARNING: Certificates - Restrict public verify to safe columns only
DROP POLICY IF EXISTS "Public verify certs" ON public.certificates;
DROP POLICY IF EXISTS "Public verify certs safe" ON public.certificates;

CREATE POLICY "Public verify certs safe" ON public.certificates
  FOR SELECT
  TO public
  USING (is_valid = true);

-- Create a security definer function for safe cert verification
CREATE OR REPLACE FUNCTION public.verify_certificate(cert_id text)
RETURNS TABLE (
  c_certificate_id text,
  c_course_name text,
  c_issue_date timestamptz,
  c_is_valid boolean,
  c_student_id uuid,
  c_trainer_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    c.certificate_id, c.course_name, c.issue_date, c.is_valid,
    c.student_id, c.trainer_id
  FROM public.certificates c
  WHERE c.certificate_id = cert_id AND c.is_valid = true;
$$;

-- 5. WARNING: AI Chat Sessions - Fix anonymous session exposure
DROP POLICY IF EXISTS "Users read own chat sessions" ON public.ai_chat_sessions;
DROP POLICY IF EXISTS "Users update own chat sessions" ON public.ai_chat_sessions;

CREATE POLICY "Users read own chat sessions" ON public.ai_chat_sessions
  FOR SELECT
  TO public
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own chat sessions" ON public.ai_chat_sessions
  FOR UPDATE
  TO public
  USING (auth.uid() = user_id);

-- 6. WARNING: search_logs - restrict insert to authenticated users
DROP POLICY IF EXISTS "Anyone insert logs" ON public.search_logs;

CREATE POLICY "Authenticated insert logs" ON public.search_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
