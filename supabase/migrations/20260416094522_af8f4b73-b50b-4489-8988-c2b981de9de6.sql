
-- Drop the problematic policy
DROP POLICY IF EXISTS "Trainers read referred by them" ON public.trainers;

-- Create a security definer function to avoid recursive RLS
CREATE OR REPLACE FUNCTION public.get_trainer_id_for_user(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.trainers WHERE user_id = _user_id LIMIT 1
$$;

-- Recreate the policy using the function
CREATE POLICY "Trainers read referred by them"
  ON public.trainers
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT referred_id
      FROM public.trainer_referrals
      WHERE referrer_id = public.get_trainer_id_for_user(auth.uid())
        AND referred_id IS NOT NULL
    )
  );
