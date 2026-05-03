import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Совет 5 кураторов: каждый агент со своей оптикой выбирает 2 произведения
 * из общего пула кандидатов. Оркестратор объединяет, дедуплицирует и балансирует
 * финальный набор из 6–8 откликов.
 */

type CuratorKey = "poet" | "philosopher" | "healer" | "critic" | "mystic";

const CURATORS: Record<CuratorKey, { label: string; emoji: string; system: string }> = {
  poet: {
    label: "Поэт",
    emoji: "🪶",
    system: `Ты — Поэт. Слышишь ритм души. Выбираешь произведения, которые поют в унисон с состоянием человека: лиричные, музыкальные, образные. Любишь Цветаеву, Лорку, Рильке, Туманяна, Терьяна. Возьмёшь скорее стих, чем прозу.`,
  },
  philosopher: {
    label: "Философ",
    emoji: "🧭",
    system: `Ты — Философ. Ищешь смысл за чувством. Выбираешь то, что помогает увидеть состояние шире, в перспективе судьбы и времени: Достоевский, Камю, Сенека, Сароян, Нарекаци, Бродский. Любишь прозу и афоризмы.`,
  },
  healer: {
    label: "Целитель",
    emoji: "🌿",
    system: `Ты — Целитель. Твоя задача — утешить, не обесценив боль. Выбираешь нежное, тёплое, дающее опору и принятие: Mary Oliver, Руми, Хафиз, Капутикян, библейские псалмы, Чехов в его светлых нотах.`,
  },
  critic: {
    label: "Кинокритик",
    emoji: "🎬",
    system: `Ты — Кинокритик. Слышишь состояние через монологи и кадры. Выбираешь киноцитаты, монологи, прозу с кинематографичной плотностью: Тарковский, Бергман, Параджанов, Малик, "Побег из Шоушенка", "Общество мёртвых поэтов".`,
  },
  mystic: {
    label: "Мистик",
    emoji: "✨",
    system: `Ты — Мистик. Видишь невидимое за словами. Выбираешь нечто неожиданное, древнее, духовное, восточное: Басё, Руми, Нарекаци, Дао, библейские строки, суфийские притчи, Тарковский-старший. Один твой выбор должен удивлять.`,
  },
};

const COMMON_RULES = `ЖЕЛЕЗНЫЕ ПРАВИЛА:
- Используй ТОЛЬКО произведения из списка кандидатов (по их idx).
- Текст НЕ переписывай — финальный текст возьмёт оркестратор.
- Объяснение — тёплое, на «вы», 1–2 предложения, в твоём голосе как куратора.
- Выбирай ровно 2 произведения, не больше.`;

type Candidate = {
  id?: string;
  text: string;
  author: string;
  title?: string | null;
  source_type: string;
  year?: number | null;
  language?: string;
  origin: "lexical" | "random";
};

async function callCurator(
  key: CuratorKey,
  apiKey: string,
  userBlock: string,
  candidatesJson: string,
): Promise<{ idx: number; explanation: string; relevance_score: number }[]> {
  const c = CURATORS[key];
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: `${c.system}\n\n${COMMON_RULES}` },
        { role: "user", content: `${userBlock}\n\nКАНДИДАТЫ:\n${candidatesJson}` },
      ],
      tools: [{
        type: "function",
        function: {
          name: "pick_two",
          description: "Выбери 2 произведения из кандидатов",
          parameters: {
            type: "object",
            properties: {
              picks: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    idx: { type: "number" },
                    explanation: { type: "string" },
                    relevance_score: { type: "number" },
                  },
                  required: ["idx", "explanation", "relevance_score"],
                  additionalProperties: false,
                },
              },
            },
            required: ["picks"],
            additionalProperties: false,
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "pick_two" } },
    }),
  });
  if (!resp.ok) {
    console.error(`curator ${key} error`, resp.status, await resp.text());
    return [];
  }
  const data = await resp.json();
  const tc = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!tc) return [];
  try {
    const args = JSON.parse(tc.function.arguments);
    return (args.picks || []).slice(0, 2);
  } catch {
    return [];
  }
}

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

    // User memory (if logged in)
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

    // Wider candidate pool — 5 curators need diversity
    const [lexResp, randResp] = await Promise.all([
      supabase.rpc("match_literary_lexical", {
        query_text: queryText,
        query_emotions: lowerEmotions.length ? lowerEmotions : null,
        preferred_language: lang,
        match_count: 36,
      }),
      supabase.from("literary_works").select("id,text,author,title,source_type,year,language").limit(12),
    ]);

    const candidates: Candidate[] = [];
    const seen = new Set<string>();
    for (const d of (lexResp.data as any[]) ?? []) {
      if (seen.has(d.id)) continue;
      seen.add(d.id);
      candidates.push({ id: d.id, text: d.text, author: d.author, title: d.title, source_type: d.source_type, year: d.year, language: d.language, origin: "lexical" });
    }
    for (const d of (randResp.data as any[]) ?? []) {
      if (seen.has(d.id)) continue;
      seen.add(d.id);
      candidates.push({ id: d.id, text: d.text, author: d.author, title: d.title, source_type: d.source_type, year: d.year, language: d.language, origin: "random" });
    }

    if (candidates.length === 0) {
      return new Response(JSON.stringify({ error: "Библиотека пуста. Подождите завершения первичной загрузки." }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pool = candidates.slice(0, 30);
    const candidatesPayload = pool.map((c, i) => ({
      idx: i, author: c.author, title: c.title || null, source_type: c.source_type,
      year: c.year ?? null, language: c.language ?? "ru",
      text: c.text.slice(0, 700),
    }));
    const candidatesJson = JSON.stringify(candidatesPayload);

    const userBlock = `СОСТОЯНИЕ ЧЕЛОВЕКА:
"${input_text}"
Эмоции: ${emotions.length ? emotions.join(", ") : "не указаны"}
Интенсивность: ${intensity ?? "—"} / 10
Контекст: ${context || "—"}
Язык: ${language_pref || "любой"}
${userMemory ? `\nЭМОЦИОНАЛЬНЫЙ ПРОФИЛЬ (учти, не цитируй):
- Резюме: ${userMemory.summary || "—"}
- Темы: ${(userMemory.recurring_themes || []).join(", ") || "—"}
- Состояния: ${(userMemory.dominant_emotions || []).join(", ") || "—"}
- Заметки: ${userMemory.agent_notes || "—"}\n` : ""}`;

    // Run all 5 curators in parallel
    const keys: CuratorKey[] = ["poet", "philosopher", "healer", "critic", "mystic"];
    const results = await Promise.all(
      keys.map((k) => callCurator(k, LOVABLE_API_KEY, userBlock, candidatesJson)),
    );

    // Orchestrator: dedupe by idx, merge votes, prefer items chosen by multiple curators
    type Merged = {
      idx: number;
      curators: { key: CuratorKey; label: string; emoji: string; explanation: string; score: number }[];
    };
    const merged = new Map<number, Merged>();
    keys.forEach((k, i) => {
      for (const p of results[i]) {
        if (typeof p.idx !== "number" || p.idx < 0 || p.idx >= pool.length) continue;
        const c = CURATORS[k];
        const existing = merged.get(p.idx);
        const entry = { key: k, label: c.label, emoji: c.emoji, explanation: p.explanation, score: p.relevance_score };
        if (existing) existing.curators.push(entry);
        else merged.set(p.idx, { idx: p.idx, curators: [entry] });
      }
    });

    // Rank: more curator votes first, then average score
    const ranked = Array.from(merged.values()).sort((a, b) => {
      if (b.curators.length !== a.curators.length) return b.curators.length - a.curators.length;
      const avg = (m: Merged) => m.curators.reduce((s, c) => s + (c.score || 0), 0) / m.curators.length;
      return avg(b) - avg(a);
    });

    // Take up to 8, ensure at least 6 if possible
    const final = ranked.slice(0, 8);

    const pieces = final.map((m) => {
      const cand = pool[m.idx];
      // Primary curator = the one with highest individual score (the "lead voice")
      const primary = [...m.curators].sort((a, b) => (b.score || 0) - (a.score || 0))[0];
      const avgScore = Math.round(m.curators.reduce((s, c) => s + (c.score || 0), 0) / m.curators.length);
      return {
        title: cand.title || "",
        author: cand.author,
        year: cand.year ? String(cand.year) : "",
        source_type: cand.source_type,
        text: cand.text,
        explanation: primary.explanation,
        relevance_score: avgScore,
        curator: { key: primary.key, label: primary.label, emoji: primary.emoji },
        curator_votes: m.curators.map((c) => ({ key: c.key, label: c.label, emoji: c.emoji })),
      };
    });

    return new Response(JSON.stringify({
      pieces,
      meta: {
        mode: "council",
        candidates_total: candidates.length,
        curators_active: keys.length,
        used_memory: !!userMemory,
        language_pref: language_pref || null,
      },
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("council-resonance error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});