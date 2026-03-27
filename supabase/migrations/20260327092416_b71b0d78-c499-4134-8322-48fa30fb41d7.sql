
CREATE TABLE public.trainer_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  status text NOT NULL DEFAULT 'invited',
  invited_at timestamp with time zone NOT NULL DEFAULT now(),
  reminder_sent_at timestamp with time zone,
  signed_up_at timestamp with time zone,
  invited_by uuid NOT NULL,
  emails_sent integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (email)
);

ALTER TABLE public.trainer_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage trainer invitations"
ON public.trainer_invitations
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
