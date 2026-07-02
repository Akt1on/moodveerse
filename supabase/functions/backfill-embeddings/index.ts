import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function embed(text: string, apiKey: string, retries = 3): Promise<number[] | null> {
  let lastErr = "";
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const r = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "openai/text-embedding-3-small", input: text.slice(0, 6000) }),
      });
      if (r.status === 429 || r.status >= 500) {
        lastErr = `status ${r.status}`;
        await new Promise((res) => setTimeout(res, 1200 * (attempt + 1)));
        continue;
      }
      if (!r.ok) {
        const body = await r.text();
        console.error("embed non-ok:", r.status, body.slice(0, 200));
        return null;
      }
      const j = await r.json();
      const vec = j.data?.[0]?.embedding;
      if (!vec) { console.error("embed no data:", JSON.stringify(j).slice(0, 200)); return null; }
      return vec;
    } catch (e) {
      lastErr = String(e);
      await new Promise((res) => setTimeout(res, 1200 * (attempt + 1)));
    }
  }
  console.error("embed exhausted retries:", lastErr);
  return null;
}

/**
 * Fills `embedding` for rows where it is NULL. Processes a bounded batch per
 * invocation and returns progress so it can be called repeatedly (edge-function
 * time is limited).
 *
 * Query params:
 *   batch   — how many rows to process this call (default 30, max 100)
 *   parallel — concurrent embed requests (default 6)
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    const url = new URL(req.url);
    const batch = Math.min(parseInt(url.searchParams.get("batch") ?? "30", 10) || 30, 100);
    const parallel = Math.min(parseInt(url.searchParams.get("parallel") ?? "6", 10) || 6, 12);

    const { count: remainingBefore } = await supabase
      .from("literary_works")
      .select("*", { count: "exact", head: true })
      .is("embedding", null);

    const { data: rows, error } = await supabase
      .from("literary_works")
      .select("id, title, author, text")
      .is("embedding", null)
      .limit(batch);
    if (error) throw error;
    if (!rows || rows.length === 0) {
      return new Response(JSON.stringify({ done: true, processed: 0, remaining: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let ok = 0, failed = 0;
    for (let i = 0; i < rows.length; i += parallel) {
      const slice = rows.slice(i, i + parallel);
      const results = await Promise.all(slice.map(async (row: any) => {
        const input = `${row.title ?? ""}\n${row.author ?? ""}\n${row.text ?? ""}`.trim();
        const vec = await embed(input, LOVABLE_API_KEY);
        if (!vec) return { id: row.id, ok: false };
        const { error: upErr } = await supabase
          .from("literary_works")
          .update({ embedding: vec as any })
          .eq("id", row.id);
        return { id: row.id, ok: !upErr };
      }));
      for (const r of results) r.ok ? ok++ : failed++;
    }

    const { count: remainingAfter } = await supabase
      .from("literary_works")
      .select("*", { count: "exact", head: true })
      .is("embedding", null);

    console.log(`backfill-embeddings: ok=${ok} failed=${failed} remaining=${remainingAfter}/${remainingBefore}`);
    return new Response(JSON.stringify({
      done: (remainingAfter ?? 0) === 0,
      processed: rows.length,
      succeeded: ok,
      failed,
      remaining: remainingAfter ?? 0,
      remaining_before: remainingBefore ?? null,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("backfill-embeddings error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});