-- Fix credit_wallet_atomic: migration 20260411072120 introduced a regression —
-- it omitted wallet_id from the wallet_transactions INSERT even though that
-- column is NOT NULL. This migration corrects it by explicitly SELECTing the
-- wallet id first, then supplying it in the INSERT.
--
-- Also restores the idempotency guard (reference_id uniqueness check) and
-- keeps the updated_at column name used by the wallets table.

CREATE OR REPLACE FUNCTION public.credit_wallet_atomic(
  p_user_id      uuid,
  p_amount       numeric,
  p_description  text,
  p_reference_id text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet_id uuid;
BEGIN
  -- Idempotency: skip if this reference has already been credited
  IF p_reference_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.wallet_transactions
      WHERE reference_id = p_reference_id
    ) THEN
      RETURN;
    END IF;
  END IF;

  -- Resolve wallet id for this user
  SELECT id INTO v_wallet_id
  FROM public.wallets
  WHERE user_id = p_user_id;

  IF v_wallet_id IS NULL THEN
    RAISE EXCEPTION 'No wallet found for user %', p_user_id;
  END IF;

  -- Update balance atomically
  UPDATE public.wallets
  SET
    balance      = balance + p_amount,
    total_earned = total_earned + p_amount,
    updated_at   = now()
  WHERE id = v_wallet_id;

  -- Insert transaction — wallet_id is NOT NULL so it must be supplied
  INSERT INTO public.wallet_transactions (wallet_id, user_id, type, amount, description, reference_id)
  VALUES (v_wallet_id, p_user_id, 'credit', p_amount, p_description, p_reference_id);
END;
$$;
