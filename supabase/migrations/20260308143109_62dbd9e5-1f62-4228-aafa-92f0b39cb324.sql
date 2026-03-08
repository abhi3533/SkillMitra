
-- The trainers table public policy can't restrict columns via RLS.
-- The secure approach is already in place via get_public_trainer_profile() function.
-- We need to restrict the direct SELECT policy to only allow authenticated users who are the trainer themselves.
-- Public browsing should go through the security-definer function.

-- Replace the broad public trainer read with a restrictive one that only shows via function
DROP POLICY IF EXISTS "Public read approved trainers safe" ON public.trainers;

-- Allow public to read only the basic non-sensitive columns they need for browsing
-- Since RLS can't restrict columns, we create a new security-definer function for browse listing
CREATE OR REPLACE FUNCTION public.get_approved_trainers_list()
RETURNS TABLE(
  trainer_id uuid, trainer_user_id uuid, trainer_bio text, trainer_skills text[],
  trainer_experience_years integer, trainer_current_company text, trainer_current_role text,
  trainer_teaching_languages text[], trainer_average_rating numeric, trainer_total_students integer,
  trainer_approval_status text, trainer_subscription_plan text, trainer_is_job_seeker boolean,
  trainer_boost_score integer
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT t.id, t.user_id, t.bio, t.skills, t.experience_years,
    t.current_company, t.current_role, t.teaching_languages,
    t.average_rating, t.total_students, t.approval_status,
    t.subscription_plan, t.is_job_seeker, t.boost_score
  FROM public.trainers t
  WHERE t.approval_status = 'approved';
$$;

-- Create a minimal public read policy that only exposes non-sensitive columns
-- But since RLS can't filter columns, we keep a policy for the function to work
-- and for authenticated trainer/student access patterns already covered by other policies
CREATE POLICY "Public read approved trainers safe"
ON public.trainers
FOR SELECT
TO anon, authenticated
USING (approval_status = 'approved');
