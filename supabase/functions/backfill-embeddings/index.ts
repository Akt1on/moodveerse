import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Embed many inputs in a single Gateway request. OpenAI's embedding API accepts
 * an array of inputs, which is dramatically faster than 1 request per row and
 * avoids per-second rate limits from N parallel requests.
 */
async function embedBatch(inputs: string[], apiKey: string, retries = 4): Promise<(number[] | null)[]> {
  if (!inputs.length) return [];
  const clean = inputs.map((t) => (t || " ").slice(0, 6000));
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const r = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "openai/text-embedding-3-small", input: clean }),
      });
      if (r.status === 429 || r.status >= 500) {
        const wait = 1500 * (attempt + 1);
        console.log(`embedBatch: status=${r.status}, retry in ${wait}ms (attempt ${attempt + 1})`);
        await new Promise((res) => setTimeout(res, wait));
        continue;
      }
      if (!r.ok) {
        const body = await r.text();
        console.error("embedBatch non-ok:", r.status, body.slice(0, 200));
        return inputs.map(() => null);
      }
      const j = await r.json();
      const arr: any[] = j.data ?? [];
      // OpenAI returns objects with { index, embedding } — normalize by index
      const out: (number[] | null)[] = new Array(inputs.length).fill(null);
      for (const item of arr) {
        if (typeof item.index === "number" && Array.isArray(item.embedding)) {
          out[item.index] = item.embedding;
        }
      }
      return out;
    } catch (e) {
      console.error("embedBatch throw:", String(e));
      await new Promise((res) => setTimeout(res, 1500 * (attempt + 1)));
    }
  }
  return inputs.map(() => null);
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
    const batch = Math.min(parseInt(url.searchParams.get("batch") ?? "60", 10) || 60, 200);
    const chunkSize = Math.min(parseInt(url.searchParams.get("chunk") ?? "20", 10) || 20, 50);

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
    for (let i = 0; i < rows.length; i += chunkSize) {
      const slice = rows.slice(i, i + chunkSize);
      const inputs = slice.map((row: any) =>
        `${row.title ?? ""}\n${row.author ?? ""}\n${row.text ?? ""}`.trim() || row.author || "text",
      );
      const vectors = await embedBatch(inputs, LOVABLE_API_KEY);
      // Update rows sequentially in a small parallel batch to avoid PG connection pressure
      await Promise.all(slice.map(async (row: any, idx: number) => {
        const vec = vectors[idx];
        if (!vec) { failed++; return; }
        const { error: upErr } = await supabase
          .from("literary_works")
          .update({ embedding: vec as any })
          .eq("id", row.id);
        if (upErr) { failed++; console.error("update err:", upErr.message); }
        else ok++;
      }));
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