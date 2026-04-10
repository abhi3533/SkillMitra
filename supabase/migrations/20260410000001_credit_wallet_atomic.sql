-- Atomic wallet credit function — eliminates read-modify-write race condition.
-- Both the balance UPDATE and the transaction INSERT run in a single statement,
-- so concurrent calls for the same user cannot produce duplicate credits.
CREATE OR REPLACE FUNCTION public.credit_wallet_atomic(
  p_user_id    uuid,
  p_amount     numeric,
  p_description text,
  p_reference_id text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet_id      uuid;
  v_transaction_id uuid;
BEGIN
  -- Single UPDATE avoids the read-then-write race; RETURNING captures the id
  UPDATE wallets
  SET
    balance      = balance + p_amount,
    total_earned = total_earned + p_amount,
    last_updated = now()
  WHERE user_id = p_user_id
  RETURNING id INTO v_wallet_id;

  IF v_wallet_id IS NULL THEN
    RAISE EXCEPTION 'No wallet found for user %', p_user_id;
  END IF;

  INSERT INTO wallet_transactions (wallet_id, user_id, type, amount, description, reference_id)
  VALUES (v_wallet_id, p_user_id, 'credit', p_amount, p_description, p_reference_id)
  RETURNING id INTO v_transaction_id;

  RETURN v_transaction_id;
END;
$$;
