
-- ============================================================
-- SECURITY FIX 1: Restrict anonymous ratings read to exclude private notes
-- Drop the old policy and create a view for public ratings
-- ============================================================

DROP POLICY IF EXISTS "Public read published ratings" ON public.ratings;

-- Create a secure view that exposes only public rating fields
CREATE OR REPLACE VIEW public.public_ratings AS
SELECT 
  id, enrollment_id, student_id, trainer_id,
  student_to_trainer_rating, student_to_trainer_review,
  student_teaching_quality, student_punctuality_rating,
  student_communication_rating, student_rated_at, created_at
FROM public.ratings
WHERE student_to_trainer_rating IS NOT NULL AND student_rated_at IS NOT NULL;

-- Re-add the anon SELECT policy but ONLY for non-sensitive columns
-- Since we can't restrict columns in RLS, use the policy on the base table
-- but ensure the view is used for anonymous access
CREATE POLICY "Public read published ratings safe"
ON public.ratings
FOR SELECT
TO anon
USING (
  student_to_trainer_rating IS NOT NULL 
  AND student_rated_at IS NOT NULL
  -- Block access to private columns by making them null in application code
  -- The real fix is using the get_public_ratings RPC function which already filters columns
);

-- Actually, the better fix: just drop anon access entirely since we have get_public_ratings RPC
DROP POLICY IF EXISTS "Public read published ratings safe" ON public.ratings;

-- ============================================================
-- SECURITY FIX 2: Restrict enrollment INSERT to only allow via verified payment
-- ============================================================

DROP POLICY IF EXISTS "Students insert enrollments" ON public.enrollments;

-- Create a secure function for enrollment creation that validates payment
CREATE OR REPLACE FUNCTION public.create_verified_enrollment(
  p_course_id uuid,
  p_student_id uuid,
  p_trainer_id uuid,
  p_payment_id uuid,
  p_amount_paid numeric,
  p_sessions_total integer DEFAULT NULL,
  p_is_trial boolean DEFAULT false
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enrollment_id uuid;
  v_student_user_id uuid;
  v_payment_status text;
  v_commission numeric;
BEGIN
  -- Verify the calling user owns this student record
  SELECT user_id INTO v_student_user_id FROM public.students WHERE id = p_student_id;
  IF v_student_user_id IS NULL OR v_student_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: student does not belong to current user';
  END IF;

  -- For paid enrollments, verify payment exists and is verified
  IF NOT p_is_trial AND p_amount_paid > 0 THEN
    SELECT status INTO v_payment_status FROM public.payments 
    WHERE id = p_payment_id AND student_id = p_student_id AND status = 'paid';
    
    IF v_payment_status IS NULL THEN
      RAISE EXCEPTION 'Payment not verified';
    END IF;
  END IF;

  -- Calculate commission (10% default)
  v_commission := p_amount_paid * 0.10;

  INSERT INTO public.enrollments (
    course_id, student_id, trainer_id, amount_paid, 
    platform_commission, trainer_payout, sessions_total, status
  ) VALUES (
    p_course_id, p_student_id, p_trainer_id, p_amount_paid,
    v_commission, p_amount_paid - v_commission, p_sessions_total,
    CASE WHEN p_is_trial THEN 'trial' ELSE 'active' END
  )
  RETURNING id INTO v_enrollment_id;

  RETURN v_enrollment_id;
END;
$$;

-- ============================================================
-- SECURITY FIX 3: Restrict payments INSERT - only allow via edge function
-- ============================================================

DROP POLICY IF EXISTS "Students insert payments" ON public.payments;

-- Students can only read their payments, not insert (edge function handles inserts)
-- The verify-razorpay-payment edge function uses service_role to insert

-- ============================================================  
-- SECURITY FIX 4: Remove direct wallet_transactions INSERT for users
-- ============================================================

DROP POLICY IF EXISTS "System insert transactions" ON public.wallet_transactions;

-- Wallet transactions should only be created by service_role (edge functions/triggers)
-- Users can still read their own transactions via the existing SELECT policy
