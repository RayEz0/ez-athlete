-- EZ Athlete: send the daily cumulative archive at 08:00 India time (02:30 UTC).
-- Run this AFTER deploying the send-daily-report Edge Function and storing
-- the project URL + publishable key in Supabase Vault as recommended by Supabase.
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule('ez-athlete-daily-email')
where exists (select 1 from cron.job where jobname = 'ez-athlete-daily-email');

select cron.schedule(
  'ez-athlete-daily-email',
  '30 2 * * *',
  $$
  select net.http_post(
    url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-daily-report',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', current_setting('app.settings.supabase_publishable_key', true)
    ),
    body := '{}'::jsonb
  );
  $$
);

-- If your project does not use app.settings values, create the cron job from
-- Dashboard > Integrations > Cron and choose the Edge Function instead.
