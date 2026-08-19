import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export function serviceClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

/**
 * Returns null when the caller is an admin, otherwise a ready-to-return 403/401 Response.
 * Cron jobs authenticate with the service-role key directly.
 */
export async function requireAdmin(req: Request): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const header = req.headers.get("Authorization") ?? "";
  const token = header.replace(/^Bearer\s+/i, "").trim();

  if (!token) return { ok: false, status: 401, error: "Требуется авторизация" };
  if (token === SERVICE_ROLE) return { ok: true };
  if (token === ANON) return { ok: false, status: 403, error: "Доступ только для администратора" };

  try {
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: ud } = await userClient.auth.getUser();
    if (!ud?.user) return { ok: false, status: 401, error: "Требуется авторизация" };
    const svc = serviceClient();
    const { data: isAdmin } = await svc.rpc("has_role", { _user_id: ud.user.id, _role: "admin" });
    if (isAdmin === true) return { ok: true };
    return { ok: false, status: 403, error: "Доступ только для администратора" };
  } catch (_e) {
    return { ok: false, status: 403, error: "Доступ только для администратора" };
  }
}