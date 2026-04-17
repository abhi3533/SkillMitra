-- Fix credit_wallet_atomic: column is `last_updated` not `updated_at`,
-- ensure wallet exists, and include required wallet_id in transaction insert.
CREATE OR REPLACE FUNCTION public.credit_wallet_atomic(
  p_user_id uuid,
  p_amount numeric,
  p_description text,
  p_reference_id text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_wallet_id uuid;
BEGIN
  IF p_amount <= 0 THEN
    RETURN;
  END IF;

  -- Idempotency: skip if a transaction with this reference_id already exists
  IF p_reference_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.wallet_transactions
      WHERE reference_id = p_reference_id
    ) THEN
      RETURN;
    END IF;
  END IF;

  -- Ensure wallet exists for this user (auto-create if missing)
  SELECT id INTO v_wallet_id FROM public.wallets WHERE user_id = p_user_id FOR UPDATE;
  IF v_wallet_id IS NULL THEN
    INSERT INTO public.wallets (user_id, balance, total_earned, total_withdrawn)
    VALUES (p_user_id, 0, 0, 0)
    RETURNING id INTO v_wallet_id;
  END IF;

  -- Credit balance
  UPDATE public.wallets
  SET balance = balance + p_amount,
      total_earned = total_earned + p_amount,
      last_updated = now()
  WHERE id = v_wallet_id;

  -- Log transaction (wallet_id is NOT NULL)
  INSERT INTO public.wallet_transactions (wallet_id, user_id, amount, type, description, reference_id)
  VALUES (v_wallet_id, p_user_id, p_amount, 'credit', p_description, p_reference_id);
END;
$function$;