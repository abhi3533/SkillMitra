
CREATE OR REPLACE FUNCTION public.credit_wallet_atomic(
  p_user_id uuid,
  p_amount numeric,
  p_description text,
  p_reference_id text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Prevent double-crediting if reference_id provided
  IF p_reference_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.wallet_transactions
      WHERE reference_id = p_reference_id
    ) THEN
      RETURN;
    END IF;
  END IF;

  -- Credit the wallet
  UPDATE public.wallets
  SET balance = balance + p_amount,
      total_earned = total_earned + p_amount,
      updated_at = now()
  WHERE user_id = p_user_id;

  -- Log the transaction
  INSERT INTO public.wallet_transactions (user_id, amount, type, description, reference_id)
  VALUES (p_user_id, p_amount, 'credit', p_description, p_reference_id);
END;
$$;
