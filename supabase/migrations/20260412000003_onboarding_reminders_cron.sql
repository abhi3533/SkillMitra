-- Schedule onboarding-reminders edge function via pg_cron + pg_net.
-- Auth token is read from vault at job execution time so no secret is
-- stored in plain SQL.
--
-- Job 1: daily at 9:00 AM IST (3:30 AM UTC) — dropout reminders + admin digest
-- Job 2: every 6 hours — dropout reminders only

-- Idempotent: unschedule any existing versions before recreating.
DO $$ BEGIN
  PERFORM cron.unschedule('onboarding-reminders-daily');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  PERFORM cron.unschedule('onboarding-reminders-6h');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Daily at 9:00 AM IST = 3:30 AM UTC (triggers admin digest + dropout reminders)
SELECT cron.schedule(
  'onboarding-reminders-daily',
  '30 3 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://elxjvidacewshkltstdd.supabase.co/functions/v1/onboarding-reminders',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret
        FROM   vault.decrypted_secrets
        WHERE  name = 'email_queue_service_role_key'
        LIMIT  1
      )
    ),
    body    := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Every 6 hours for additional dropout reminder touchpoints
SELECT cron.schedule(
  'onboarding-reminders-6h',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://elxjvidacewshkltstdd.supabase.co/functions/v1/onboarding-reminders',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret
        FROM   vault.decrypted_secrets
        WHERE  name = 'email_queue_service_role_key'
        LIMIT  1
      )
    ),
    body    := '{}'::jsonb
  ) AS request_id;
  $$
);
