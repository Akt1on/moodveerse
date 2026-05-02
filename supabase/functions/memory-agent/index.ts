import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `Ты — внимательный психолог-литератор, ведущий «эмоциональный профиль» человека по его записям состояний в MoodVerse.

Твоя задача: прочитать последние записи пользователя и обновить его профиль так, чтобы будущие подборки литературы стали глубже и точнее.

ПРИНЦИПЫ:
- Никаких диагнозов и клинической лексики. Только тёплый, бережный тон.
- Ищи повторяющиеся темы (одиночество, выгорание, поиск смысла, тоска по дому, отношения, утрата и т.д.).
- Замечай динамику: «движется от тревоги к принятию», «возвращается к теме отца», «нарастает усталость».
- summary — 2–4 предложения от второго лица («вы»). Это будет показано пользователю и подмешиваться в промпт подбора.
- recurring_themes — 3–7 кратких тем (1–3 слова каждая, в нижнем регистре).
- dominant_emotions — 3–6 повторяющихся эмоциональных состояний.
- agent_notes — внутренняя записка для куратора-литератора (что избегать, к чему мягко вести). 1–3 предложения.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;
    const admin = createClient(SUPABASE_URL, SERVICE);

    // Pull last 30 entries
    const { data: entries, error: entErr } = await admin
      .from("mood_entries")
      .select("input_text, emotions, intensity, context, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30);
    if (entErr) throw entErr;

    if (!entries || entries.length < 2) {
      return new Response(JSON.stringify({
        memory: null,
        message: "Недостаточно записей для построения профиля (нужно минимум 2).",
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const condensed = entries.map((e: any, i: number) => ({
      n: i + 1,
      date: new Date(e.created_at).toISOString().slice(0, 10),
      text: (e.input_text || "").slice(0, 400),
      emotions: e.emotions || [],
      intensity: e.intensity ?? null,
      context: (e.context || "").slice(0, 200),
    }));

    const userPrompt = `ПОСЛЕДНИЕ ${entries.length} ЗАПИСЕЙ (от свежих к старым):
${JSON.stringify(condensed, null, 0)}

Обнови эмоциональный профиль этого человека.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "update_memory",
            description: "Обновить эмоциональный профиль пользователя",
            parameters: {
              type: "object",
              properties: {
                summary: { type: "string" },
                recurring_themes: { type: "array", items: { type: "string" } },
                dominant_emotions: { type: "array", items: { type: "string" } },
                agent_notes: { type: "string" },
              },
              required: ["summary", "recurring_themes", "dominant_emotions", "agent_notes"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "update_memory" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Слишком много запросов." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiResp.status === 402) return new Response(JSON.stringify({ error: "Нужно пополнить кредиты." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await aiResp.text();
      console.error("AI error", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI недоступен" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await aiResp.json();
    const tc = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!tc) throw new Error("No tool call");
    const args = JSON.parse(tc.function.arguments);

    const memory = {
      user_id: userId,
      summary: args.summary,
      recurring_themes: (args.recurring_themes || []).slice(0, 10),
      dominant_emotions: (args.dominant_emotions || []).slice(0, 8),
      agent_notes: args.agent_notes,
      entries_analyzed: entries.length,
      updated_at: new Date().toISOString(),
    };

    const { error: upErr } = await admin
      .from("user_memory")
      .upsert(memory, { onConflict: "user_id" });
    if (upErr) throw upErr;

    return new Response(JSON.stringify({ memory }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("memory-agent error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});