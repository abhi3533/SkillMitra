-- Create the missing increment_course_enrolled RPC used by verify-razorpay-payment
CREATE OR REPLACE FUNCTION public.increment_course_enrolled(course_id_param uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.courses
  SET total_enrolled = COALESCE(total_enrolled, 0) + 1
  WHERE id = course_id_param;
$$;

-- Atomic wallet debit RPC for paying with wallet during enrollment
CREATE OR REPLACE FUNCTION public.debit_wallet_atomic(
  p_user_id uuid,
  p_amount numeric,
  p_description text,
  p_reference_id text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance numeric;
  v_wallet_id uuid;
BEGIN
  IF p_amount <= 0 THEN
    RETURN false;
  END IF;

  -- Idempotency: if already debited with same reference, treat as success
  IF p_reference_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.wallet_transactions
      WHERE reference_id = p_reference_id AND type = 'debit'
    ) THEN
      RETURN true;
    END IF;
  END IF;

  SELECT id, balance INTO v_wallet_id, v_balance
  FROM public.wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_wallet_id IS NULL OR v_balance < p_amount THEN
    RETURN false;
  END IF;

  UPDATE public.wallets
  SET balance = balance - p_amount,
      total_withdrawn = total_withdrawn + p_amount,
      last_updated = now()
  WHERE id = v_wallet_id;

  INSERT INTO public.wallet_transactions (wallet_id, user_id, amount, type, description, reference_id)
  VALUES (v_wallet_id, p_user_id, p_amount, 'debit', p_description, p_reference_id);

  RETURN true;
END;
$$;