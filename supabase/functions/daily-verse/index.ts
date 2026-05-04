import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Deterministic daily index from a date string (YYYY-MM-DD).
function dayHash(dateStr: string): number {
  let h = 0;
  for (let i = 0; i < dateStr.length; i++) {
    h = ((h << 5) - h) + dateStr.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function partOfDay(hour: number): "morning" | "day" | "evening" | "night" {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "day";
  if (hour >= 17 && hour < 22) return "evening";
  return "night";
}

const RITUAL_EMOTIONS: Record<string, string[]> = {
  morning: ["надежда", "вдохновение", "благодарность", "тишина", "пробуждение", "свет"],
  day:     ["вдохновение", "свобода", "любовь", "радость", "принятие"],
  evening: ["тишина", "благодарность", "смирение", "покой", "утешение"],
  night:   ["одиночество", "тоска", "молитва", "тишина", "покой", "утешение"],
};

const RITUAL_INTRO: Record<string, string> = {
  morning: "Утро. Стих, чтобы открыть день.",
  day:     "Полдень. Слово, чтобы услышать себя.",
  evening: "Вечер. Строки, чтобы выдохнуть.",
  night:   "Ночь. Тихое слово, чтобы уснуть.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const lang = url.searchParams.get("lang") || "ru";
    const tzOffsetMin = Number(url.searchParams.get("tz") ?? "0"); // minutes ahead of UTC
    const now = new Date(Date.now() + tzOffsetMin * 60_000);
    const dateStr = now.toISOString().slice(0, 10);
    const hour = now.getUTCHours();
    const part = partOfDay(hour);
    const emotions = RITUAL_EMOTIONS[part];

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Pull a pool matching ritual emotions in the preferred language; fall back broadly.
    let { data: pool } = await supabase
      .from("literary_works")
      .select("id,text,author,title,source_type,emotions_tags,language,year")
      .eq("language", lang)
      .overlaps("emotions_tags", emotions)
      .limit(80);

    if (!pool || pool.length === 0) {
      const fallback = await supabase
        .from("literary_works")
        .select("id,text,author,title,source_type,emotions_tags,language,year")
        .eq("language", lang)
        .limit(80);
      pool = fallback.data ?? [];
    }
    if (!pool || pool.length === 0) {
      const any = await supabase
        .from("literary_works")
        .select("id,text,author,title,source_type,emotions_tags,language,year")
        .limit(80);
      pool = any.data ?? [];
    }

    if (!pool.length) {
      return new Response(JSON.stringify({ error: "Library is empty" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const idx = dayHash(`${dateStr}|${part}|${lang}`) % pool.length;
    const piece = pool[idx];

    return new Response(
      JSON.stringify({
        date: dateStr,
        part,
        intro: RITUAL_INTRO[part],
        piece,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("daily-verse error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});