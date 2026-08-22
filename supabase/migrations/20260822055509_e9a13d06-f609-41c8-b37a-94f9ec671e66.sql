
CREATE TABLE IF NOT EXISTS public.app_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.app_config TO service_role;
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

INSERT INTO public.app_config(key, value)
VALUES ('cron_token', encode(gen_random_bytes(24), 'hex'))
ON CONFLICT (key) DO NOTHING;

-- retire per-source weekly jobs
SELECT cron.unschedule(jobname) FROM cron.job
WHERE jobname LIKE 'moodverse-harvest-%';

SELECT cron.schedule(
  'moodverse-harvest-plan',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url:='https://nphlgleqcefivgnsufub.supabase.co/functions/v1/harvest-libraries?action=plan&langs=ru,en,hy,fr,de,es&limit=200',
    headers:=jsonb_build_object(
      'Content-Type','application/json',
      'x-cron-token',(SELECT value FROM public.app_config WHERE key='cron_token')),
    body:='{}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'moodverse-harvest-work',
  '*/10 * * * *',
  $$
  SELECT net.http_post(
    url:='https://nphlgleqcefivgnsufub.supabase.co/functions/v1/harvest-libraries?action=work',
    headers:=jsonb_build_object(
      'Content-Type','application/json',
      'x-cron-token',(SELECT value FROM public.app_config WHERE key='cron_token')),
    body:='{}'::jsonb
  );
  $$
);
