CREATE OR REPLACE FUNCTION public.can_view_referred_trainer(_trainer_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.trainer_referrals tr
    WHERE tr.referrer_id = public.get_trainer_id_for_user(_user_id)
      AND tr.referred_id = _trainer_id
  );
$$;

CREATE OR REPLACE FUNCTION public.can_view_trainer_referral(_referrer_id uuid, _referred_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH current_trainer AS (
    SELECT public.get_trainer_id_for_user(_user_id) AS trainer_id
  )
  SELECT EXISTS (
    SELECT 1
    FROM current_trainer ct
    WHERE ct.trainer_id IS NOT NULL
      AND (
        _referrer_id = ct.trainer_id
        OR _referred_id = ct.trainer_id
      )
  );
$$;

DROP POLICY IF EXISTS "Trainers read referred by them" ON public.trainers;
CREATE POLICY "Trainers read referred by them"
ON public.trainers
FOR SELECT
TO authenticated
USING (public.can_view_referred_trainer(id, auth.uid()));

DROP POLICY IF EXISTS "Trainers read own referrals" ON public.trainer_referrals;
CREATE POLICY "Trainers read own referrals"
ON public.trainer_referrals
FOR SELECT
TO public
USING (public.can_view_trainer_referral(referrer_id, referred_id, auth.uid()));