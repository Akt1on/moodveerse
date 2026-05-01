import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { SEED } from "./seed-data.ts";
import { SEED_HY, SEED_EXTRA } from "./seed-data-armenian.ts";
import { SEED_BIBLE } from "./seed-data-bible.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    const ALL_SEED = [...SEED, ...SEED_HY, ...SEED_EXTRA, ...SEED_BIBLE];

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