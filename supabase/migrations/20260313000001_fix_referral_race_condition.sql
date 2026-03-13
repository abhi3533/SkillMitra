-- Fix referral race condition:
-- A student can only ever be referred once. Enforce this at the database level
-- so concurrent requests cannot bypass the application-level duplicate check.
ALTER TABLE referrals
  ADD CONSTRAINT referrals_referred_id_unique UNIQUE (referred_id);
