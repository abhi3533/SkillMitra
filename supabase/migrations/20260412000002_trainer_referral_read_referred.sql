-- Allow a trainer to read the basic row of any trainer they've referred.
-- This is needed so the Referrals page can fetch the referred trainer's
-- user_id (to look up their profile name/photo) even when the referred
-- trainer is still pending approval and not yet publicly visible.
CREATE POLICY "Trainers read referred by them"
  ON public.trainers
  FOR SELECT
  USING (
    id IN (
      SELECT referred_id
      FROM public.trainer_referrals
      WHERE referrer_id IN (
        SELECT id FROM public.trainers WHERE user_id = auth.uid()
      )
      AND referred_id IS NOT NULL
    )
  );
