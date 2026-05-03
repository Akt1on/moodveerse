import { encode as base64Encode } from "https://deno.land/std@0.224.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Multilingual ElevenLabs voices that handle RU/EN/HY gracefully.
// Defaults chosen for warm, literary narration.
const VOICE_BY_LANG: Record<string, string> = {
  ru: "XrExE9yKIg1WjnnlVkGX", // Matilda — soft, female, expressive
  en: "JBFqnCBsd6RMkjVDRZzb", // George — warm baritone
  hy: "XrExE9yKIg1WjnnlVkGX", // Matilda multilingual
};
const DEFAULT_VOICE = "XrExE9yKIg1WjnnlVkGX";

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text, language, voice_id } = await req.json();
    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "text is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (text.length > 3000) {
      return new Response(JSON.stringify({ error: "text too long (max 3000)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "ELEVENLABS_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const vId = voice_id || VOICE_BY_LANG[language as string] || DEFAULT_VOICE;

    const r = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${vId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.55,
            similarity_boost: 0.75,
            style: 0.35,
            use_speaker_boost: true,
            speed: 0.92,
          },
        }),
      },
    );

    if (!r.ok) {
      const err = await r.text();
      console.error("ElevenLabs TTS error:", r.status, err);
      return new Response(JSON.stringify({ error: `TTS failed: ${r.status}`, detail: err }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const buf = await r.arrayBuffer();
    const audio = base64Encode(new Uint8Array(buf));

    return new Response(JSON.stringify({ audio, mime: "audio/mpeg" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("tts-speak fatal:", e);
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});