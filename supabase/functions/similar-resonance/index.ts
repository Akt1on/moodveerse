import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Ты — литературный куратор. На вход даётся ОПОРНОЕ произведение и список КАНДИДАТОВ. Выбери ровно 3 кандидата, наиболее близких по настроению, теме и интонации к опорному, и напиши по одному короткому объяснению связи (1 предложение, по-русски, тёпло, без пафоса).

ЖЕЛЕЗНЫЕ ПРАВИЛА:
- Используй ТОЛЬКО реальные работы из списка кандидатов.
- Сохраняй текст отрывка ТОЧНО как в кандидате.
- Не повторяй опорное произведение.
- Разнообразь: если возможно, разные авторы и типы.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { text, author, title, source_type, language_pref } = await req.json();
    if (!text || typeof text !== "string" || text.trim().length < 5) {
      return new Response(JSON.stringify({ error: "Нет опорного текста" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    const lang = (language_pref && ["ru", "hy", "en"].includes(language_pref)) ? language_pref : null;
    const queryText = `${text}\n${author ?? ""} ${title ?? ""}`.slice(0, 1200);

    const { data: rows, error } = await supabase.rpc("match_literary_lexical", {
      query_text: queryText,
      query_emotions: null,
      preferred_language: lang,
      match_count: 16,
    });
    if (error) throw error;

    const candidates = (rows ?? [])
      .filter((r: any) => r.text && r.author)
      .filter((r: any) => !(r.author === author && r.title === title))
      .slice(0, 12);

    if (!candidates.length) {
      return new Response(JSON.stringify({ pieces: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userPayload = {
      seed: { text: text.slice(0, 800), author, title, source_type },
      candidates: candidates.map((c: any, i: number) => ({
        i,
        text: (c.text as string).slice(0, 900),
        author: c.author,
        title: c.title,
        source_type: c.source_type,
        year: c.year,
        language: c.language,
      })),
    };

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: JSON.stringify(userPayload) },
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_similar",
            description: "Вернуть 3 похожих произведения",
            parameters: {
              type: "object",
              properties: {
                picks: {
                  type: "array",
                  minItems: 1,
                  maxItems: 3,
                  items: {
                    type: "object",
                    properties: {
                      i: { type: "integer" },
                      explanation: { type: "string" },
                      relevance_score: { type: "integer", minimum: 60, maximum: 99 },
                    },
                    required: ["i", "explanation", "relevance_score"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["picks"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_similar" } },
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI error", aiResp.status, t);
      throw new Error(`AI ${aiResp.status}`);
    }
    const aiJson = await aiResp.json();
    const toolCall = aiJson?.choices?.[0]?.message?.tool_calls?.[0];
    const args = toolCall ? JSON.parse(toolCall.function.arguments) : { picks: [] };

    const pieces = (args.picks ?? [])
      .map((p: any) => {
        const c = candidates[p.i];
        if (!c) return null;
        return {
          text: c.text,
          author: c.author,
          title: c.title ?? "",
          source_type: c.source_type,
          year: c.year ? String(c.year) : undefined,
          explanation: p.explanation,
          relevance_score: p.relevance_score,
        };
      })
      .filter(Boolean)
      .slice(0, 3);

    return new Response(JSON.stringify({ pieces }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("similar-resonance error", e);
    return new Response(JSON.stringify({ error: e?.message || "error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});