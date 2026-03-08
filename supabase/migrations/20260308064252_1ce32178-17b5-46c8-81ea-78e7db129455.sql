
-- Add referral columns to trainers table
ALTER TABLE public.trainers
  ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by text,
  ADD COLUMN IF NOT EXISTS referral_credits numeric DEFAULT 0;

-- Create trainer_referrals table
CREATE TABLE public.trainer_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES public.trainers(id) ON DELETE CASCADE,
  referred_id uuid REFERENCES public.trainers(id) ON DELETE SET NULL,
  referral_code text,
  reward_amount numeric DEFAULT 500,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.trainer_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trainers read own referrals" ON public.trainer_referrals
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM trainers WHERE trainers.id = trainer_referrals.referrer_id AND trainers.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM trainers WHERE trainers.id = trainer_referrals.referred_id AND trainers.user_id = auth.uid())
  );

CREATE POLICY "Admins manage trainer referrals" ON public.trainer_referrals
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Generate referral codes for existing trainers
UPDATE public.trainers
SET referral_code = 'TM-' || upper(substr(md5(random()::text), 1, 6))
WHERE referral_code IS NULL;

-- Update handle_new_user to generate trainer referral code
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _role app_role;
  _referral_code text;
BEGIN
  _role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'student'::app_role);
  INSERT INTO public.profiles (id, full_name, email, phone, city, state, gender, language_preference) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    NEW.raw_user_meta_data->>'city',
    NEW.raw_user_meta_data->>'state',
    NEW.raw_user_meta_data->>'gender',
    CASE 
      WHEN NEW.raw_user_meta_data->'language_preference' IS NOT NULL 
        AND jsonb_typeof(NEW.raw_user_meta_data->'language_preference') = 'array'
      THEN ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'language_preference'))
      ELSE '{}'::text[]
    END
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);
  IF _role = 'student'::app_role THEN
    _referral_code := 'SM-' || upper(substr(md5(random()::text), 1, 6));
    INSERT INTO public.students (user_id, referral_code, trainer_gender_preference) VALUES (
      NEW.id, 
      _referral_code,
      COALESCE(NEW.raw_user_meta_data->>'trainer_gender_preference', 'no_preference')
    );
  END IF;
  IF _role = 'trainer'::app_role THEN
    _referral_code := 'TM-' || upper(substr(md5(random()::text), 1, 6));
    INSERT INTO public.trainers (user_id, referral_code) VALUES (NEW.id, _referral_code);
  END IF;
  RETURN NEW;
END;
$$;
