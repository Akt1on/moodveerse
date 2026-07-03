import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { SEED } from "./seed-data.ts";
import { SEED_HY, SEED_EXTRA } from "./seed-data-armenian.ts";
import { SEED_BIBLE } from "./seed-data-bible.ts";
import { SEED_EN } from "./seed-data-english.ts";
import { SEED_HY_EXTRA } from "./seed-data-armenian-extra.ts";
import { SEED_RU_EXTRA } from "./seed-data-russian-extra.ts";
import { SEED_HY_V2 } from "./seed-data-armenian-v2.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/** Batch-embed inputs via Lovable AI Gateway (OpenAI-compatible). */
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
        await new Promise((res) => setTimeout(res, 1500 * (attempt + 1)));
        continue;
      }
      if (!r.ok) return inputs.map(() => null);
      const j = await r.json();
      const out: (number[] | null)[] = new Array(inputs.length).fill(null);
      for (const item of (j.data ?? [])) {
        if (typeof item.index === "number" && Array.isArray(item.embedding)) out[item.index] = item.embedding;
      }
      return out;
    } catch {
      await new Promise((res) => setTimeout(res, 1500 * (attempt + 1)));
    }
  }
  return inputs.map(() => null);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    const ALL_SEED = [...SEED, ...SEED_HY, ...SEED_EXTRA, ...SEED_BIBLE, ...SEED_EN, ...SEED_HY_EXTRA, ...SEED_RU_EXTRA, ...SEED_HY_V2];

    const { count } = await supabase
      .from("literary_works")
      .select("*", { count: "exact", head: true });

    const force = new URL(req.url).searchParams.get("force") === "1";
    if ((count ?? 0) >= ALL_SEED.length && !force) {
      return new Response(JSON.stringify({ skipped: true, count }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Bulk-fetch existing external_ids in one query.
    const externalIds = ALL_SEED.map((p) => p.external_id);
    const { data: existing } = await supabase
      .from("literary_works")
      .select("external_id")
      .in("external_id", externalIds);
    const have = new Set((existing ?? []).map((r: any) => r.external_id));

    const toInsert = ALL_SEED
      .filter((p) => !have.has(p.external_id))
      .map((p) => ({
        text: p.text,
        author: p.author,
        title: p.title ?? null,
        source_type: p.source_type,
        emotions_tags: p.emotions_tags,
        language: p.language,
        year: p.year ?? null,
        external_id: p.external_id,
      }));

    let inserted = 0;
    let failed = 0;
    const skipped = ALL_SEED.length - toInsert.length;

    // Batch insert in chunks of 50.
    for (let i = 0; i < toInsert.length; i += 50) {
      const chunk = toInsert.slice(i, i + 50);
      const { error, data } = await supabase
        .from("literary_works")
        .insert(chunk)
        .select("id");
      if (error) {
        console.error("batch error", i, error);
        failed += chunk.length;
      } else {
        inserted += data?.length ?? chunk.length;
        // Embed the freshly inserted rows so semantic search works immediately.
        if (LOVABLE_API_KEY && data?.length) {
          const inputs = chunk.map((p) =>
            `${p.title ?? ""}\n${p.author ?? ""}\n${p.text ?? ""}`.trim() || p.author || "text",
          );
          const vectors = await embedBatch(inputs, LOVABLE_API_KEY);
          await Promise.all(
            data.map((row: any, idx: number) => {
              const vec = vectors[idx];
              if (!vec) return Promise.resolve();
              return supabase.from("literary_works").update({ embedding: vec as any }).eq("id", row.id);
            }),
          );
        }
      }
    }

    return new Response(
      JSON.stringify({ inserted, skipped, failed, total_seed: ALL_SEED.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("seed-library error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});