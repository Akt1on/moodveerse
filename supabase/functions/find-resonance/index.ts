import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Ты — глубоко эмпатичный литературный собеседник, знаток мировой, русской и армянской поэзии, прозы и кино (Нарекаци, Туманян, Чаренц, Терьян, Севак, Исаакян, Капутикян, Сароян, Параджанов, Эгоян, Азнавур, Пушкин, Цветаева, Ахматова, Бродский, Рильке, Тарковский и др.).

Твоя задача — выбрать из списка КАНДИДАТЫ 6–8 произведений, которые точнее всего резонируют с состоянием человека, и для каждого написать тёплое личное объяснение на русском.

ЖЕЛЕЗНЫЕ ПРАВИЛА:
- Используй ТОЛЬКО реальные работы из списка кандидатов. Не выдумывай.
- Сохраняй текст отрывка ТОЧНО как в кандидате.
- Глубокий эмоциональный резонанс важнее ключевых слов.
- Баланс: что-то признающее боль, что-то утешающее, что-то с лучом надежды.
- Микс источников: поэзия + проза + кино/афоризм. Если есть армянские — включи хотя бы одно.
- explanation: тёплое, на «вы», 1–2 предложения.
- relevance_score: 70–99.`;

type Candidate = {
  id?: string;
  text: string;
  author: string;
  title?: string | null;
  source_type: string;
  year?: number | null;
  language?: string;
  score?: number;
  origin: "lexical" | "random";
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { input_text, emotions = [], intensity, context, language_pref } = await req.json();
    if (!input_text || typeof input_text !== "string" || input_text.trim().length < 3) {
      return new Response(JSON.stringify({ error: "Опишите чувство подробнее" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Optional: read user memory if user is authenticated
    let userMemory: { summary?: string; recurring_themes?: string[]; dominant_emotions?: string[]; agent_notes?: string } | null = null;
    const authHeader = req.headers.get("Authorization") || "";
    if (authHeader && authHeader !== `Bearer ${ANON}`) {
      try {
        const userClient = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeader } } });
        const { data: ud } = await userClient.auth.getUser();
        if (ud?.user) {
          const { data: mem } = await supabase
            .from("user_memory")
            .select("summary, recurring_themes, dominant_emotions, agent_notes")
            .eq("user_id", ud.user.id)
            .maybeSingle();
          if (mem) userMemory = mem as any;
        }
      } catch (e) { console.log("memory lookup skipped:", e); }
    }

    const lang = (language_pref && ["ru", "hy", "en"].includes(language_pref)) ? language_pref : null;
    const lowerEmotions = emotions.map((e: string) => e.toLowerCase());
    const queryText = [input_text, ...emotions, context].filter(Boolean).join(" ");

    // Lexical RPC + a small random batch in parallel for diversity.
    const [lexResp, randResp] = await Promise.all([
      supabase.rpc("match_literary_lexical", {
        query_text: queryText,
        query_emotions: lowerEmotions.length ? lowerEmotions : null,
        preferred_language: lang,
        match_count: 28,
      }),
      supabase
        .from("literary_works")
        .select("id,text,author,title,source_type,year,language")
        .limit(8),
    ]);

    const candidates: Candidate[] = [];
    const seen = new Set<string>();

    if (lexResp.data && Array.isArray(lexResp.data)) {
      for (const d of lexResp.data) {
        if (seen.has(d.id)) continue;
        seen.add(d.id);
        candidates.push({
          id: d.id, text: d.text, author: d.author, title: d.title,
          source_type: d.source_type, year: d.year, language: d.language,
          score: d.score, origin: "lexical",
        });
      }
    } else if (lexResp.error) {
      console.error("rpc error", lexResp.error);
    }

    if (randResp.data && Array.isArray(randResp.data)) {
      for (const d of randResp.data) {
        if (seen.has(d.id)) continue;
        seen.add(d.id);
        candidates.push({
          id: d.id, text: d.text, author: d.author, title: d.title,
          source_type: d.source_type, year: d.year, language: d.language,
          origin: "random",
        });
      }
    }

    if (candidates.length === 0) {
      return new Response(JSON.stringify({
        error: "Библиотека пуста. Подождите завершения первичной загрузки и попробуйте снова.",
      }), { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Trim payload for AI (max 24 candidates, ~800 char text each).
    const candidatesPayload = candidates.slice(0, 24).map((c, i) => ({
      idx: i, author: c.author, title: c.title || null, source_type: c.source_type,
      year: c.year ?? null, language: c.language ?? "ru",
      text: c.text.slice(0, 800),
    }));

    const userPrompt = `СОСТОЯНИЕ ПОЛЬЗОВАТЕЛЯ:
"${input_text}"
Эмоции: ${emotions.length ? emotions.join(", ") : "не указаны"}
Интенсивность: ${intensity ?? "—"} / 10
Контекст: ${context || "—"}
Предпочтение языка: ${language_pref || "любой"}
${userMemory ? `\nЭМОЦИОНАЛЬНЫЙ ПРОФИЛЬ ЭТОГО ЧЕЛОВЕКА (учти, но не цитируй вслух):
- Резюме: ${userMemory.summary || "—"}
- Возвращающиеся темы: ${(userMemory.recurring_themes || []).join(", ") || "—"}
- Доминирующие состояния: ${(userMemory.dominant_emotions || []).join(", ") || "—"}
- Заметки куратора: ${userMemory.agent_notes || "—"}
Используй это, чтобы избегать повторения уже знакомых ему произведений и мягко вести его дальше по эмоциональному пути.\n` : ""}
КАНДИДАТЫ (выбери 6–8 самых резонансных, верни их text ДОСЛОВНО):
${JSON.stringify(candidatesPayload)}`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_resonant_pieces",
            description: "Возвращает 6–8 резонансных произведений",
            parameters: {
              type: "object",
              properties: {
                pieces: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      author: { type: "string" },
                      year: { type: "string" },
                      source_type: { type: "string", enum: ["poem", "book", "film", "monologue", "quote"] },
                      text: { type: "string" },
                      explanation: { type: "string" },
                      relevance_score: { type: "number" },
                    },
                    required: ["title", "author", "source_type", "text", "explanation", "relevance_score"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["pieces"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_resonant_pieces" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Слишком много запросов. Попробуйте через минуту." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "Нужно пополнить кредиты Lovable AI." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI недоступен" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error("No tool call returned", JSON.stringify(data).slice(0, 500));
      return new Response(JSON.stringify({ error: "Не удалось получить отклик" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const args = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify({
      pieces: args.pieces || [],
      meta: {
        candidates_total: candidates.length,
        from_lexical: candidates.filter(c => c.origin === "lexical").length,
        from_random: candidates.filter(c => c.origin === "random").length,
        language_pref: language_pref || null,
        used_memory: !!userMemory,
      },
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("find-resonance error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});