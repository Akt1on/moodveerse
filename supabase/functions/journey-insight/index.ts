import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `Ты — поэтичный наблюдатель внутреннего пути человека. По его записям состояний за последние недели напиши короткий тёплый инсайт (3–5 предложений), который покажет ему его собственное движение: от чего к чему он шёл, какие темы возвращались, где была опора.

Тон: бережный, литературный, без диагнозов и шаблонов вроде "вы молодец". Обращайся на «вы». Можно мягкую метафору погоды/времени года/дороги. Никаких советов — только зеркало.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeader } } });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const admin = createClient(SUPABASE_URL, SERVICE);

    const { data: entries } = await admin
      .from("mood_entries")
      .select("input_text, emotions, intensity, created_at")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (!entries || entries.length < 3) {
      return new Response(JSON.stringify({ insight: null, message: "Нужно хотя бы 3 записи." }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const condensed = entries.map((e: any) => ({
      d: new Date(e.created_at).toISOString().slice(0, 10),
      t: (e.input_text || "").slice(0, 250),
      em: e.emotions || [],
      i: e.intensity,
    }));

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: `Записи (свежие первыми):\n${JSON.stringify(condensed)}` },
        ],
      }),
    });
    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error(aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI недоступен" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const data = await aiResp.json();
    const insight = data.choices?.[0]?.message?.content || "";
    return new Response(JSON.stringify({ insight }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("journey-insight error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});