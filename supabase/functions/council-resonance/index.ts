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
  score?: number;
  origin: "lexical" | "vector" | "hybrid";
};

async function embedQuery(text: string, apiKey: string): Promise<number[] | null> {
  try {
    const r = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "openai/text-embedding-3-small", input: text.slice(0, 4000) }),
    });
    if (!r.ok) return null;
    const j = await r.json();
    return j.data?.[0]?.embedding ?? null;
  } catch { return null; }
}

type Pick = { idx: number; explanation: string; relevance_score: number };

/** Один структурированный вызов: все 5 кураторов голосуют в одном ответе. */
async function callCouncil(
  apiKey: string,
  userBlock: string,
  candidatesJson: string,
): Promise<Record<CuratorKey, Pick[]> | null> {
  const roles = (Object.keys(CURATORS) as CuratorKey[])
    .map((k) => `[${k}] ${CURATORS[k].system}`).join("\n\n");
  const pickSchema = {
    type: "array",
    items: {
      type: "object",
      properties: {
        idx: { type: "number" },
        explanation: { type: "string" },
        relevance_score: { type: "number", description: "0-100" },
      },
      required: ["idx", "explanation", "relevance_score"],
      additionalProperties: false,
    },
  };
  const props: Record<string, unknown> = {};
  for (const k of Object.keys(CURATORS)) props[k] = pickSchema;

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: `Ты — Совет из 5 независимых кураторов. Каждый говорит своим голосом и выбирает свои 2 произведения.\n\n${roles}\n\n${COMMON_RULES}\n- Кураторы могут совпадать в выборе, если произведение действительно лучшее.\n- relevance_score честный: насколько текст отвечает именно на это состояние.` },
        { role: "user", content: `${userBlock}\n\nКАНДИДАТЫ:\n${candidatesJson}` },
      ],
      tools: [{
        type: "function",
        function: {
          name: "council_vote",
          description: "Голоса всех 5 кураторов",
          parameters: { type: "object", properties: props, required: Object.keys(CURATORS), additionalProperties: false },
        },
      }],
      tool_choice: { type: "function", function: { name: "council_vote" } },
    }),
  });
  if (!resp.ok) {
    console.error("council error", resp.status, await resp.text());
    return null;
  }
  const data = await resp.json();
  const tc = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!tc) return null;
  try {
    const args = JSON.parse(tc.function.arguments);
    const out = {} as Record<CuratorKey, Pick[]>;
    for (const k of Object.keys(CURATORS) as CuratorKey[]) {
      out[k] = (Array.isArray(args[k]) ? args[k] : []).slice(0, 2);
    }
    return out;
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { input_text, emotions = [], intensity, context, language_pref } = await req.json();
    if (!input_text || typeof input_text !== "string" || input_text.trim().length < 3 || input_text.length > 4000) {
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

    // ---------- Rate limit (10 / hour per user or IP — council is heavier) ----------
    let rateId = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "anon";
    const authHeaderRL = req.headers.get("Authorization") || "";
    if (authHeaderRL && authHeaderRL !== `Bearer ${ANON}`) {
      try {
        const uc = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeaderRL } } });
        const { data: ud } = await uc.auth.getUser();
        if (ud?.user) rateId = `u:${ud.user.id}`;
      } catch { /* fall back to IP */ }
    }
    const { data: allowed } = await supabase.rpc("check_rate_limit", {
      p_identifier: rateId, p_endpoint: "council-resonance", p_max: 10, p_window_seconds: 3600,
    });
    if (allowed === false) {
      return new Response(JSON.stringify({ error: "Совет отдыхает. Попробуйте через час." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // User memory + recent favorites (if logged in)
    let userMemory: { summary?: string; recurring_themes?: string[]; dominant_emotions?: string[]; agent_notes?: string } | null = null;
    const recentFavTexts = new Set<string>();
    const authHeader = req.headers.get("Authorization") || "";
    if (authHeader && authHeader !== `Bearer ${ANON}`) {
      try {
        const userClient = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeader } } });
        const { data: ud } = await userClient.auth.getUser();
        if (ud?.user) {
          const [{ data: mem }, { data: favs }] = await Promise.all([
            supabase.from("user_memory")
              .select("summary, recurring_themes, dominant_emotions, agent_notes")
              .eq("user_id", ud.user.id).maybeSingle(),
            supabase.from("favorites").select("text")
              .eq("user_id", ud.user.id).order("created_at", { ascending: false }).limit(40),
          ]);
          if (mem) userMemory = mem as any;
          for (const f of (favs as any[]) ?? []) if (f?.text) recentFavTexts.add(String(f.text).slice(0, 200));
        }
      } catch (e) { console.log("memory lookup skipped:", e); }
    }

    const lang = (language_pref && ["ru", "hy", "en"].includes(language_pref)) ? language_pref : null;
    const safeEmotions = Array.isArray(emotions)
      ? emotions.filter((e): e is string => typeof e === "string").slice(0, 12)
      : [];
    const lowerEmotions = safeEmotions.map((e) => e.toLowerCase().trim()).filter(Boolean);
    const safeContext = typeof context === "string" ? context.slice(0, 1500) : "";
    const queryText = `Состояние: ${input_text.trim()}\nЭмоции: ${safeEmotions.join(", ")}\nКонтекст: ${safeContext}`;

    const queryEmbedding = await embedQuery(queryText, LOVABLE_API_KEY);

    const retrieve = async (opts: { threshold: number; emotions: string[] | null; language: string | null; lexText: string }) => {
      const [v, l] = await Promise.all([
        queryEmbedding
          ? supabase.rpc("match_literary_works", {
              query_embedding: queryEmbedding as any,
              match_count: 40,
              filter_language: opts.language,
              filter_emotions: opts.emotions,
              similarity_threshold: opts.threshold,
            })
          : Promise.resolve({ data: null, error: null } as any),
        supabase.rpc("match_literary_lexical", {
          query_text: opts.lexText,
          query_emotions: opts.emotions,
          preferred_language: opts.language,
          match_count: 30,
        }),
      ]);
      return { vec: (v?.data as any[]) ?? [], lex: (l?.data as any[]) ?? [] };
    };

    const emoFilter = lowerEmotions.length ? lowerEmotions : null;
    let { vec, lex } = await retrieve({ threshold: 0.20, emotions: emoFilter, language: lang, lexText: queryText });
    if (lex.length === 0) {
      lex = (await retrieve({ threshold: 1, emotions: emoFilter, language: lang, lexText: input_text.trim() })).lex;
    }
    if (vec.length + lex.length < 10) {
      const r = await retrieve({ threshold: 0.12, emotions: null, language: lang, lexText: queryText });
      vec = vec.concat(r.vec); lex = lex.concat(r.lex);
    }
    if (vec.length + lex.length < 6 && lang) {
      const r = await retrieve({ threshold: 0.12, emotions: null, language: null, lexText: queryText });
      vec = vec.concat(r.vec); lex = lex.concat(r.lex);
    }

    // Normalize each channel to [0..1] before fusion
    const norm = (rows: any[], key: (d: any) => number) => {
      const vals = rows.map(key);
      const max = Math.max(...vals, 0), min = Math.min(...vals, 0);
      const span = max - min || 1;
      return (d: any) => (key(d) - min) / span;
    };
    const vNorm = norm(vec, (d) => Number(d.similarity ?? d.score ?? 0));
    const lNorm = norm(lex, (d) => Number(d.score ?? 0));

    const candidates: Candidate[] = [];
    const seen = new Map<string, Candidate>();
    for (const d of vec) {
      if (seen.has(d.id)) continue;
      const c: Candidate = { id: d.id, text: d.text, author: d.author, title: d.title, source_type: d.source_type, year: d.year, language: d.language, score: 0.65 * vNorm(d), origin: "vector" };
      seen.set(d.id, c); candidates.push(c);
    }
    for (const d of lex) {
      const existing = seen.get(d.id);
      if (existing) {
        if (existing.origin !== "hybrid") {
          existing.origin = "hybrid";
          existing.score = (existing.score ?? 0) + 0.35 * lNorm(d) + 0.1;
        }
        continue;
      }
      const c: Candidate = { id: d.id, text: d.text, author: d.author, title: d.title, source_type: d.source_type, year: d.year, language: d.language, score: 0.35 * lNorm(d), origin: "lexical" };
      seen.set(d.id, c); candidates.push(c);
    }
    // Anti-repetition: penalize recently favorited works
    for (const c of candidates) {
      if (recentFavTexts.has(String(c.text).slice(0, 200))) c.score = (c.score ?? 0) - 0.25;
    }
    candidates.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

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
Эмоции: ${safeEmotions.length ? safeEmotions.join(", ") : "не указаны"}
Интенсивность: ${intensity ?? "—"} / 10
Контекст: ${safeContext || "—"}
Язык: ${language_pref || "любой"}
${userMemory ? `\nЭМОЦИОНАЛЬНЫЙ ПРОФИЛЬ (учти, не цитируй):
- Резюме: ${userMemory.summary || "—"}
- Темы: ${(userMemory.recurring_themes || []).join(", ") || "—"}
- Состояния: ${(userMemory.dominant_emotions || []).join(", ") || "—"}
- Заметки: ${userMemory.agent_notes || "—"}\n` : ""}`;

    // One structured call: all 5 curators vote together
    const keys: CuratorKey[] = ["poet", "philosopher", "healer", "critic", "mystic"];
    const votes = await callCouncil(LOVABLE_API_KEY, userBlock, candidatesJson);

    if (!votes || keys.every((k) => votes[k].length === 0)) {
      return new Response(JSON.stringify({
        error: "Совет сейчас перегружен. Попробуйте обычный режим или повторите через минуту.",
      }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Orchestrator: dedupe by idx, merge votes, prefer items chosen by multiple curators
    type Merged = {
      idx: number;
      curators: { key: CuratorKey; label: string; emoji: string; explanation: string; score: number }[];
    };
    const merged = new Map<number, Merged>();
    keys.forEach((k) => {
      const seenIdx = new Set<number>();
      for (const p of votes[k]) {
        if (!Number.isInteger(p.idx) || p.idx < 0 || p.idx >= pool.length || seenIdx.has(p.idx)) continue;
        seenIdx.add(p.idx);
        const c = CURATORS[k];
        const existing = merged.get(p.idx);
        const entry = { key: k, label: c.label, emoji: c.emoji, explanation: String(p.explanation || "").slice(0, 600), score: Number(p.relevance_score) || 0 };
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
        from_vector: candidates.filter(c => c.origin === "vector").length,
        from_lexical: candidates.filter(c => c.origin === "lexical").length,
        from_hybrid: candidates.filter(c => c.origin === "hybrid").length,
        embedded_query: !!queryEmbedding,
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