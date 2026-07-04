
-- Rate limit table + helper for edge functions
CREATE TABLE IF NOT EXISTS public.rate_limits (
  identifier text NOT NULL,
  endpoint text NOT NULL,
  window_start timestamptz NOT NULL DEFAULT now(),
  count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (identifier, endpoint)
);

GRANT ALL ON public.rate_limits TO service_role;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
-- No policies: only service_role (edge functions) accesses this table.

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier text,
  p_endpoint text,
  p_max integer,
  p_window_seconds integer
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec public.rate_limits%ROWTYPE;
BEGIN
  SELECT * INTO rec FROM public.rate_limits
  WHERE identifier = p_identifier AND endpoint = p_endpoint FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.rate_limits(identifier, endpoint, window_start, count)
    VALUES (p_identifier, p_endpoint, now(), 1);
    RETURN true;
  END IF;

  IF rec.window_start < now() - make_interval(secs => p_window_seconds) THEN
    UPDATE public.rate_limits SET window_start = now(), count = 1
      WHERE identifier = p_identifier AND endpoint = p_endpoint;
    RETURN true;
  END IF;

  IF rec.count >= p_max THEN
    RETURN false;
  END IF;

  UPDATE public.rate_limits SET count = count + 1
    WHERE identifier = p_identifier AND endpoint = p_endpoint;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.check_rate_limit(text, text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, text, integer, integer) TO service_role;

-- Periodic cleanup of stale rows (call from a cron later if needed)
CREATE INDEX IF NOT EXISTS rate_limits_window_idx ON public.rate_limits (window_start);
