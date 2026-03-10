-- Fix #2: get_public_profile - remove is_verified filter so new users' names show
CREATE OR REPLACE FUNCTION public.get_public_profile(profile_id uuid)
 RETURNS TABLE(p_id uuid, p_full_name text, p_city text, p_state text, p_profile_picture_url text, p_is_verified boolean, p_gender text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT 
    p.id, p.full_name, p.city, p.state, p.profile_picture_url,
    p.is_verified, p.gender
  FROM public.profiles p
  WHERE p.id = profile_id;
$$;

-- Fix #11: Allow anonymous read of published ratings for homepage
CREATE POLICY "Public read published ratings"
  ON public.ratings FOR SELECT
  TO anon
  USING (student_to_trainer_rating IS NOT NULL AND student_rated_at IS NOT NULL);

-- Fix #10: Allow authenticated users to read platform settings (needed for referral rewards display)
CREATE POLICY "Authenticated read settings"
  ON public.platform_settings FOR SELECT
  TO authenticated
  USING (true);