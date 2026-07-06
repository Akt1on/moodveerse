
CREATE TABLE IF NOT EXISTS public.harvest_cursors (
  source text NOT NULL,
  key text NOT NULL,
  cursor text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (source, key)
);

GRANT ALL ON public.harvest_cursors TO service_role;

ALTER TABLE public.harvest_cursors ENABLE ROW LEVEL SECURITY;

-- No policies for anon/authenticated: table is service-only.
