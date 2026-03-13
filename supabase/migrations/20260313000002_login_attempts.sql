-- Server-side login attempt tracking for brute force protection.
-- Complements (and enforces) the client-side localStorage check in loginProtection.ts.
CREATE TABLE IF NOT EXISTS login_attempts (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  email       text        NOT NULL,
  ip_address  text,
  attempted_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX login_attempts_email_idx ON login_attempts (email, attempted_at);
CREATE INDEX login_attempts_ip_idx    ON login_attempts (ip_address, attempted_at);

-- No RLS needed — this table is only written by the service-role key in the edge function.
-- Auto-cleanup: a scheduled job (or the edge function itself) can delete rows older than 1 hour.
