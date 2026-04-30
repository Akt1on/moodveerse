import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { SEED } from "./seed-data.ts";
import { SEED_HY, SEED_EXTRA } from "./seed-data-armenian.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function embed(text: string, apiKey: string): Promise<number[]> {
  const r = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "openai/text-embedding-3-small", input: text }),
  });
  if (!r.ok) throw new Error(`embed ${r.status}: ${await r.text()}`);
  const j = await r.json();
  return j.data[0].embedding;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    const ALL_SEED = [...SEED, ...SEED_HY, ...SEED_EXTRA];

    const { count } = await supabase
      .from("literary_works")
      .select("*", { count: "exact", head: true });

    const force = new URL(req.url).searchParams.get("force") === "1";
    if ((count ?? 0) >= ALL_SEED.length && !force) {
      return new Response(JSON.stringify({ skipped: true, count }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let inserted = 0, skipped = 0, failed = 0;
    for (const p of ALL_SEED) {
      try {
        const { data: existing } = await supabase
          .from("literary_works")
          .select("id")
          .eq("source_type", p.source_type)
          .eq("external_id", p.external_id)
          .maybeSingle();
        if (existing) { skipped++; continue; }

        const embedInput = `${p.title ?? ""}\n${p.author}\n${p.text}`.slice(0, 8000);
        const embedding = await embed(embedInput, LOVABLE_API_KEY);

        const { error } = await supabase.from("literary_works").insert({
          text: p.text, author: p.author, title: p.title ?? null,
          source_type: p.source_type, emotions_tags: p.emotions_tags,
          language: p.language, year: p.year ?? null,
          external_id: p.external_id, embedding: embedding as any,
        });
        if (error) { console.error(p.external_id, error); failed++; }
        else inserted++;
      } catch (e) {
        console.error(p.external_id, e);
        failed++;
      }
    }

    return new Response(JSON.stringify({ inserted, skipped, failed, total_seed: ALL_SEED.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("seed-library error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});