import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Piece = {
  text: string;
  author: string;
  title?: string;
  source_type: "poem" | "book" | "film" | "monologue" | "quote";
  emotions_tags?: string[];
  theme?: string;
  mood_intensity?: number;
  language?: string;
  year?: number;
  external_id?: string;
};

async function embed(text: string, apiKey: string): Promise<number[]> {
  // Lovable AI Gateway exposes OpenAI-compatible embeddings.
  const r = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "openai/text-embedding-3-small", input: text }),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`embed failed ${r.status}: ${t}`);
  }
  const j = await r.json();
  return j.data[0].embedding;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const body = await req.json();
    const pieces: Piece[] = Array.isArray(body?.pieces) ? body.pieces : [];
    if (!pieces.length) {
      return new Response(JSON.stringify({ error: "pieces array required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
    let inserted = 0, skipped = 0, failed = 0;

    for (const p of pieces) {
      try {
        if (!p?.text || !p?.author || !p?.source_type) { failed++; continue; }

        // Skip if external_id already exists
        if (p.external_id) {
          const { data: existing } = await supabase
            .from("literary_works")
            .select("id")
            .eq("source_type", p.source_type)
            .eq("external_id", p.external_id)
            .maybeSingle();
          if (existing) { skipped++; continue; }
        }

        const embedInput = `${p.title ?? ""}\n${p.author}\n${p.text}`.slice(0, 8000);
        const embedding = await embed(embedInput, LOVABLE_API_KEY);

        const { error } = await supabase.from("literary_works").insert({
          text: p.text,
          author: p.author,
          title: p.title ?? null,
          source_type: p.source_type,
          emotions_tags: p.emotions_tags ?? [],
          theme: p.theme ?? null,
          mood_intensity: p.mood_intensity ?? null,
          language: p.language ?? "ru",
          year: p.year ?? null,
          external_id: p.external_id ?? null,
          embedding: embedding as any,
        });
        if (error) { console.error("insert error", error); failed++; }
        else inserted++;
      } catch (e) {
        console.error("piece failed", e);
        failed++;
      }
    }

    return new Response(JSON.stringify({ inserted, skipped, failed }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ingest-works error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});