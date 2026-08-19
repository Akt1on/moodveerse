
REVOKE EXECUTE ON FUNCTION public.claim_harvest_task() FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_harvest_task() TO service_role;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, text) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO authenticated, service_role;
