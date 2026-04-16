CREATE POLICY "Trainers read referred by them"
  ON public.trainers
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT referred_id
      FROM public.trainer_referrals
      WHERE referrer_id IN (
        SELECT t.id FROM public.trainers t WHERE t.user_id = auth.uid()
      )
      AND referred_id IS NOT NULL
    )
  );