
-- Create a bulk public profile fetcher for approved trainer user_ids
CREATE OR REPLACE FUNCTION public.get_public_profiles_bulk(profile_ids uuid[])
RETURNS TABLE(
  p_id uuid, p_full_name text, p_city text, p_state text,
  p_profile_picture_url text, p_is_verified boolean, p_gender text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT p.id, p.full_name, p.city, p.state, p.profile_picture_url, p.is_verified, p.gender
  FROM public.profiles p
  WHERE p.id = ANY(profile_ids);
$$;
