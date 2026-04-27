import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Ты — глубоко эмпатичный литературный собеседник, знаток мировой и русской поэзии, прозы и кино. Твоя задача — выбрать из предложенного списка кандидатов 6–8 произведений, которые точнее всего резонируют с эмоциональным состоянием человека, и для каждого написать тёплое личное объяснение.

ЖЕЛЕЗНЫЕ ПРАВИЛА:
- ПРИОРИТЕТ — РЕАЛЬНЫМ работам из списка КАНДИДАТЫ. Не выдумывай авторов и тексты.
- Если в кандидатах достаточно подходящего — НЕ создавай оригинальных стилизаций. Стилизация (is_original=true, author="По мотивам …") — только если кандидатов мало или они не отзываются.
- Глубокий эмоциональный резонанс важнее ключевых слов.
- Баланс набора: что-то признающее боль, что-то утешающее, что-то с тихим лучом надежды или преображения, хотя бы один неожиданный ракурс.
- Микс источников: поэзия + проза + кино/афоризм.
- Сохраняй текст отрывка ТОЧНО как в кандидате (не сокращай, не переписывай).
- explanation — тёплое, личное, на «вы», 1–2 предложения, почему именно это отзывается ИМЕННО с этим состоянием.
- relevance_score: 70–99.
- ВСЕГДА на русском.`;

type Candidate = {
  id?: string;
  text: string;
  author: string;
  title?: string | null;
  source_type: string;
  year?: number | null;
  language?: string;
  similarity?: number;
  origin: "vector" | "poetrydb" | "quotable";
};

async function embed(text: string, apiKey: string): Promise<number[] | null> {
  try {
    const r = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "openai/text-embedding-3-small", input: text }),
    });
    if (!r.ok) { console.error("embed failed", r.status, await r.text()); return null; }
    const j = await r.json();
    return j.data[0].embedding;
  } catch (e) { console.error("embed error", e); return null; }
}

const EMOTION_TO_THEME: Record<string, string[]> = {
  грусть: ["sorrow", "melancholy"],
  печаль: ["sorrow", "melancholy"],
  одиночество: ["loneliness", "solitude"],
  любовь: ["love"],
  тоска: ["longing", "melancholy"],
  надежда: ["hope"],
  страх: ["fear"],
  тревога: ["anxiety"],
  радость: ["joy", "happiness"],
  гнев: ["anger"],
  потеря: ["grief", "loss"],
  благодарность: ["gratitude"],
  вдохновение: ["inspiration"],
};

async function fetchPoetryDB(emotions: string[]): Promise<Candidate[]> {
  // PoetryDB has no theme search but supports author/title; use a small curated random sample by author.
  const authors = ["Emily Dickinson", "Walt Whitman", "William Shakespeare", "Robert Frost", "William Wordsworth"];
  const author = authors[Math.floor(Math.random() * authors.length)];
  try {
    const r = await fetch(`https://poetrydb.org/author/${encodeURIComponent(author)}`, { signal: AbortSignal.timeout(4000) });
    if (!r.ok) return [];
    const arr = await r.json();
    if (!Array.isArray(arr)) return [];
    return arr.slice(0, 3).map((p: any): Candidate => ({
      author: p.author, title: p.title, source_type: "poem",
      text: Array.isArray(p.lines) ? p.lines.slice(0, 16).join("\n") : "",
      language: "en", origin: "poetrydb",
    })).filter(c => c.text.length > 30);
  } catch (e) { console.warn("PoetryDB skipped:", e); return []; }
}

async function fetchQuotable(emotions: string[]): Promise<Candidate[]> {
  const tagMap: Record<string, string> = {
    надежда: "hope", любовь: "love", вдохновение: "inspirational",
    мудрость: "wisdom", счастье: "happiness", дружба: "friendship",
  };
  const tag = emotions.map(e => tagMap[e.toLowerCase()]).find(Boolean) || "wisdom";
  try {
    const r = await fetch(`https://api.quotable.io/quotes/random?limit=3&tags=${tag}`, { signal: AbortSignal.timeout(4000) });
    if (!r.ok) return [];
    const arr = await r.json();
    if (!Array.isArray(arr)) return [];
    return arr.map((q: any): Candidate => ({
      author: q.author, title: undefined, source_type: "quote",
      text: q.content, language: "en", origin: "quotable",
    }));
  } catch (e) { console.warn("Quotable skipped:", e); return []; }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { input_text, emotions = [], intensity, context } = await req.json();
    if (!input_text || typeof input_text !== "string" || input_text.trim().length < 3) {
      return new Response(JSON.stringify({ error: "Опишите чувство подробнее" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    // 1. Build embedding query that captures the FEELING beneath the words.
    const embedQuery = [
      input_text,
      emotions.length ? `Эмоции: ${emotions.join(", ")}` : "",
      intensity ? `Интенсивность ${intensity}/10` : "",
      context ? `Контекст: ${context}` : "",
    ].filter(Boolean).join("\n");

    // 2. Run embedding + external APIs in parallel.
    const [queryEmbedding, poetryDb, quotable] = await Promise.all([
      embed(embedQuery, LOVABLE_API_KEY),
      fetchPoetryDB(emotions),
      fetchQuotable(emotions),
    ]);

    // 3. pgvector semantic search.
    let vectorCandidates: Candidate[] = [];
    if (queryEmbedding) {
      const { data, error } = await supabase.rpc("match_literary_works", {
        query_embedding: queryEmbedding as any,
        match_count: 18,
        filter_language: null,
        filter_emotions: null,
        similarity_threshold: 0.0,
      });
      if (error) console.error("rpc error", error);
      else if (Array.isArray(data)) {
        vectorCandidates = data.map((d: any): Candidate => ({
          id: d.id, text: d.text, author: d.author, title: d.title,
          source_type: d.source_type, year: d.year, language: d.language,
          similarity: d.similarity, origin: "vector",
        }));
      }
    }

    const candidates: Candidate[] = [...vectorCandidates, ...poetryDb, ...quotable];

    // 4. Ask the LLM to curate, balance, and write warm explanations via tool calling.
    const candidatesPayload = candidates.map((c, i) => ({
      idx: i, author: c.author, title: c.title || null, source_type: c.source_type,
      year: c.year ?? null, language: c.language ?? "ru",
      similarity: c.similarity ?? null,
      text: c.text.slice(0, 1200),
    }));

    const userPrompt = `СОСТОЯНИЕ ПОЛЬЗОВАТЕЛЯ:
"${input_text}"
Эмоции: ${emotions.length ? emotions.join(", ") : "не указаны"}
Интенсивность: ${intensity ?? "не указана"} / 10
Контекст: ${context || "не указан"}

КАНДИДАТЫ (выбери 6–8 самых резонансных, верни их text ДОСЛОВНО):
${JSON.stringify(candidatesPayload, null, 0)}`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
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
                      is_original: { type: "boolean" },
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
      console.error("No tool call returned", JSON.stringify(data));
      return new Response(JSON.stringify({ error: "Не удалось получить отклик" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const args = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify({
      pieces: args.pieces || [],
      meta: {
        candidates_total: candidates.length,
        from_vector: vectorCandidates.length,
        from_poetrydb: poetryDb.length,
        from_quotable: quotable.length,
      },
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("find-resonance error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});


