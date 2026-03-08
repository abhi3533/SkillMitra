
-- CRITICAL: Fix wallet self-update vulnerability - users can set their own balance
DROP POLICY IF EXISTS "Users update own wallet" ON public.wallets;
CREATE POLICY "Users update own wallet"
ON public.wallets
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND balance = (SELECT w.balance FROM public.wallets w WHERE w.user_id = auth.uid())
  AND total_earned = (SELECT w.total_earned FROM public.wallets w WHERE w.user_id = auth.uid())
  AND total_withdrawn = (SELECT w.total_withdrawn FROM public.wallets w WHERE w.user_id = auth.uid())
);

-- Fix ratings: replace the old public read (which was already replaced but scanner still sees old one)
DROP POLICY IF EXISTS "Public read ratings safe" ON public.ratings;
CREATE POLICY "Public read ratings safe"
ON public.ratings
FOR SELECT
TO anon, authenticated
USING (
  student_to_trainer_rating IS NOT NULL
  AND student_rated_at IS NOT NULL
);
