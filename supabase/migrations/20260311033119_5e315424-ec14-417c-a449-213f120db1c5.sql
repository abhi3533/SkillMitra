-- Backfill referral codes for existing students who don't have one
UPDATE public.students
SET referral_code = 'SM-' || upper(substr(md5(random()::text), 1, 6))
WHERE referral_code IS NULL OR referral_code = '';