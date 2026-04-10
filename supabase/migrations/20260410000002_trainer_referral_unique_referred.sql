-- Prevent duplicate trainer referrals at the database level.
-- A referred trainer (referred_id) should only appear once in trainer_referrals,
-- ensuring they cannot receive referral benefits from multiple referrers.
ALTER TABLE public.trainer_referrals
  ADD CONSTRAINT trainer_referrals_referred_id_key UNIQUE (referred_id);
