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
  language?: string;
  year?: number;
  external_id: string;
};

// ---------- Emotion auto-tagging (lightweight keyword classifier) ----------
const EMOTION_LEXICON: Record<string, string[]> = {
  "грусть": ["груст", "печал", "тоск", "слез", "плач", "sorrow", "sad", "weep", "tear", "mourn", "lament", "տխուր", "վիշտ"],
  "одиночество": ["одинок", "один ", "пуст", "alone", "lonely", "solitude", "empty", "միայնակ"],
  "любовь": ["любов", "любл", "любим", "сердц", "love", "beloved", "heart", "սեր", "սիրում"],
  "надежда": ["надежд", "верю", "свет", "hope", "faith", "light", "հույս", "լույս"],
  "ностальгия": ["вспомин", "помню", "детств", "родин", "memory", "remember", "childhood", "home", "հիշում", "մանկություն"],
  "тревога": ["страх", "трев", "боюс", "fear", "anxious", "dread", "վախ"],
  "радость": ["радост", "счасть", "смех", "joy", "happy", "laugh", "ուրախ"],
  "гнев": ["гнев", "ярост", "злост", "rage", "anger", "wrath", "զայր"],
  "смерть": ["смерт", "умер", "могил", "death", "die", "grave", "մահ"],
  "природа": ["небо", "море", "гор", "лес", "ветер", "sky", "sea", "mountain", "forest", "wind", "ծով", "լեռ"],
  "вера": ["бог", "молит", "храм", "god", "pray", "soul", "Աստված", "աղոթ"],
  "свобода": ["свобод", "вольн", "freedom", "liberty", "ազատ"],
};

function tagEmotions(text: string): string[] {
  const lower = text.toLowerCase();
  const tags = new Set<string>();
  for (const [emo, keys] of Object.entries(EMOTION_LEXICON)) {
    if (keys.some((k) => lower.includes(k))) tags.add(emo);
  }
  return Array.from(tags);
}

// ---------- Source: PoetryDB (English poetry, ~3000 poems) ----------
async function fetchPoetryDB(limit: number): Promise<Piece[]> {
  const r = await fetch("https://poetrydb.org/author");
  if (!r.ok) return [];
  const { authors } = await r.json();
  const pieces: Piece[] = [];
  for (const author of authors) {
    if (pieces.length >= limit) break;
    try {
      const ar = await fetch(`https://poetrydb.org/author/${encodeURIComponent(author)}`);
      if (!ar.ok) continue;
      const poems = await ar.json();
      if (!Array.isArray(poems)) continue;
      for (const p of poems) {
        if (pieces.length >= limit) break;
        const text = (p.lines ?? []).join("\n").trim();
        if (!text || text.length < 80) continue;
        pieces.push({
          text: text.slice(0, 4000),
          author: p.author,
          title: p.title,
          source_type: "poem",
          language: "en",
          emotions_tags: tagEmotions(text),
          external_id: `poetrydb:${p.author}:${p.title}`.slice(0, 200),
        });
      }
    } catch (_) { /* skip */ }
  }
  return pieces;
}

// ---------- Source: Gutendex (Project Gutenberg metadata + plain text) ----------
async function fetchGutendex(limit: number, languages: string[]): Promise<Piece[]> {
  const pieces: Piece[] = [];
  for (const lang of languages) {
    let url = `https://gutendex.com/books?languages=${lang}&sort=popular`;
    let pages = 0;
    while (url && pieces.length < limit && pages < 5) {
      pages++;
      const r = await fetch(url);
      if (!r.ok) break;
      const j = await r.json();
      for (const book of j.results ?? []) {
        if (pieces.length >= limit) break;
        const txtUrl = book.formats?.["text/plain; charset=utf-8"] || book.formats?.["text/plain"] || book.formats?.["text/plain; charset=us-ascii"];
        if (!txtUrl) continue;
        try {
          const tr = await fetch(txtUrl);
          if (!tr.ok) continue;
          let raw = await tr.text();
          // Strip Gutenberg header/footer
          const startMatch = raw.match(/\*\*\* START OF (THE|THIS) PROJECT GUTENBERG[^*]+\*\*\*/i);
          const endMatch = raw.match(/\*\*\* END OF (THE|THIS) PROJECT GUTENBERG/i);
          if (startMatch) raw = raw.slice(startMatch.index! + startMatch[0].length);
          if (endMatch) raw = raw.slice(0, endMatch.index);
          // Split into meaningful paragraphs and pick top 6
          const paras = raw.split(/\n\s*\n/).map((p) => p.replace(/\s+/g, " ").trim())
            .filter((p) => p.length > 200 && p.length < 1500);
          const author = book.authors?.[0]?.name ?? "Unknown";
          const title = book.title;
          const picks = paras.slice(0, 6);
          for (let i = 0; i < picks.length; i++) {
            pieces.push({
              text: picks[i],
              author,
              title,
              source_type: "book",
              language: lang,
              year: book.authors?.[0]?.death_year ?? null as any,
              emotions_tags: tagEmotions(picks[i]),
              external_id: `gutendex:${book.id}:${i}`,
            });
          }
        } catch (_) { /* skip book */ }
      }
      url = j.next;
    }
  }
  return pieces;
}

// ---------- Cursor helpers (resume where we left off) ----------
async function getCursor(supabase: any, source: string, key: string): Promise<string | null> {
  const { data } = await supabase.from("harvest_cursors").select("cursor")
    .eq("source", source).eq("key", key).maybeSingle();
  return data?.cursor ?? null;
}
async function setCursor(supabase: any, source: string, key: string, cursor: string | null) {
  await supabase.from("harvest_cursors").upsert(
    { source, key, cursor, updated_at: new Date().toISOString() },
    { onConflict: "source,key" }
  );
}

// ---------- Source: Wikisource (poems, elegies, songs, romances, prose) ----------
// Multiple categories per language to widen coverage.
const WIKISOURCE_CATEGORIES: Record<string, string[]> = {
  ru: [
    "Категория:Стихотворения_по_алфавиту",
    "Категория:Русская_поэзия",
    "Категория:Элегии",
    "Категория:Романсы",
    "Категория:Песни",
    "Категория:Сонеты",
  ],
  hy: [
    "Կատեգորիա:Բանաստեղծություններ",
    "Կատեգորիա:Հայ_գրականություն",
  ],
  en: [
    "Category:Poems",
    "Category:Sonnets",
    "Category:Elegies",
    "Category:Ballads",
  ],
  fr: ["Catégorie:Poèmes", "Catégorie:Sonnets"],
  de: ["Kategorie:Gedicht", "Kategorie:Lyrik"],
  es: ["Categoría:Poemas", "Categoría:Sonetos"],
};

async function fetchWikisource(supabase: any, limit: number, languages: string[]): Promise<Piece[]> {
  const pieces: Piece[] = [];
  for (const lang of languages) {
    const cats = WIKISOURCE_CATEGORIES[lang];
    if (!cats) continue;
    for (const category of cats) {
      if (pieces.length >= limit * languages.length) break;
      const cursorKey = `${lang}:${category}`;
      let cmcontinue: string | null = await getCursor(supabase, "wikisource", cursorKey);
      let pages = 0;
      let takenThisCat = 0;
      const perCatCap = Math.max(20, Math.floor(limit / cats.length));
      while (takenThisCat < perCatCap && pages < 6) {
        pages++;
        const listUrl = new URL(`https://${lang}.wikisource.org/w/api.php`);
        listUrl.searchParams.set("action", "query");
        listUrl.searchParams.set("list", "categorymembers");
        listUrl.searchParams.set("cmtitle", category);
        listUrl.searchParams.set("cmlimit", "50");
        listUrl.searchParams.set("cmtype", "page");
        listUrl.searchParams.set("format", "json");
        listUrl.searchParams.set("origin", "*");
        if (cmcontinue) listUrl.searchParams.set("cmcontinue", cmcontinue);
        let listJson: any;
        try {
          const r = await fetch(listUrl.toString(), { headers: { "User-Agent": "moodverse-harvester/1.0" } });
          if (!r.ok) break;
          listJson = await r.json();
        } catch { break; }
        const members = listJson?.query?.categorymembers ?? [];
        cmcontinue = listJson?.continue?.cmcontinue ?? null;
        if (!members.length) break;
        for (let i = 0; i < members.length && takenThisCat < perCatCap; i += 20) {
          const batch = members.slice(i, i + 20);
          const pageids = batch.map((m: any) => m.pageid).join("|");
          const exUrl = new URL(`https://${lang}.wikisource.org/w/api.php`);
          exUrl.searchParams.set("action", "query");
          exUrl.searchParams.set("prop", "extracts");
          exUrl.searchParams.set("explaintext", "1");
          exUrl.searchParams.set("exlimit", "20");
          exUrl.searchParams.set("pageids", pageids);
          exUrl.searchParams.set("format", "json");
          exUrl.searchParams.set("origin", "*");
          let exJson: any;
          try {
            const r = await fetch(exUrl.toString(), { headers: { "User-Agent": "moodverse-harvester/1.0" } });
            if (!r.ok) continue;
            exJson = await r.json();
          } catch { continue; }
          const pagesObj = exJson?.query?.pages ?? {};
          for (const pid of Object.keys(pagesObj)) {
            if (takenThisCat >= perCatCap) break;
            const p = pagesObj[pid];
            let raw = (p.extract ?? "").toString();
            if (!raw) continue;
            raw = raw.replace(/\[\d+\]/g, "").trim();
            const block = raw.split(/\n\s*\n/).map((s: string) => s.trim())
              .find((s: string) => s.length > 120 && s.length < 2400);
            if (!block) continue;
            const title = (p.title ?? "").toString();
            let author = "Неизвестен";
            let cleanTitle = title;
            const m = title.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
            if (m) { cleanTitle = m[1].trim(); author = m[2].trim(); }
            pieces.push({
              text: block.slice(0, 3500),
              author, title: cleanTitle,
              source_type: "poem", language: lang,
              emotions_tags: tagEmotions(block),
              external_id: `wikisource:${lang}:${p.pageid}`,
            });
            takenThisCat++;
          }
        }
        if (!cmcontinue) break;
      }
      await setCursor(supabase, "wikisource", cursorKey, cmcontinue);
    }
  }
  return pieces;
}

// ---------- Source: Wikiquote (quotes from authors, books, films) ----------
const WIKIQUOTE_CATEGORIES: Record<string, string[]> = {
  ru: ["Категория:Писатели", "Категория:Поэты", "Категория:Фильмы"],
  hy: ["Կատեգորիա:Գրողներ"],
  en: ["Category:Writers", "Category:Poets", "Category:Films", "Category:Books"],
  fr: ["Catégorie:Écrivains"],
  de: ["Kategorie:Autor"],
  es: ["Categoría:Escritores"],
};

function extractQuotes(text: string): string[] {
  // Wikiquote plain-text extracts have quotes as bullet lines or paragraphs.
  const lines = text.split(/\n+/).map((l) => l.replace(/^[•·*\-—]\s*/, "").trim());
  const out: string[] = [];
  for (const l of lines) {
    if (l.length < 60 || l.length > 600) continue;
    if (/^(References|См\.\s?также|Notes|Внешние ссылки|Ссылки|Sources)/i.test(l)) continue;
    if (/^={2,}/.test(l)) continue; // section headers
    out.push(l);
  }
  return out.slice(0, 4); // top 4 quotes per page
}

async function fetchWikiquote(supabase: any, limit: number, languages: string[]): Promise<Piece[]> {
  const pieces: Piece[] = [];
  for (const lang of languages) {
    const cats = WIKIQUOTE_CATEGORIES[lang];
    if (!cats) continue;
    for (const category of cats) {
      if (pieces.length >= limit * languages.length) break;
      const cursorKey = `${lang}:${category}`;
      let cmcontinue: string | null = await getCursor(supabase, "wikiquote", cursorKey);
      let pages = 0;
      let takenThisCat = 0;
      const perCatCap = Math.max(15, Math.floor(limit / cats.length));
      while (takenThisCat < perCatCap && pages < 5) {
        pages++;
        const listUrl = new URL(`https://${lang}.wikiquote.org/w/api.php`);
        listUrl.searchParams.set("action", "query");
        listUrl.searchParams.set("list", "categorymembers");
        listUrl.searchParams.set("cmtitle", category);
        listUrl.searchParams.set("cmlimit", "40");
        listUrl.searchParams.set("cmtype", "page");
        listUrl.searchParams.set("format", "json");
        listUrl.searchParams.set("origin", "*");
        if (cmcontinue) listUrl.searchParams.set("cmcontinue", cmcontinue);
        let listJson: any;
        try {
          const r = await fetch(listUrl.toString(), { headers: { "User-Agent": "moodverse-harvester/1.0" } });
          if (!r.ok) break;
          listJson = await r.json();
        } catch { break; }
        const members = listJson?.query?.categorymembers ?? [];
        cmcontinue = listJson?.continue?.cmcontinue ?? null;
        if (!members.length) break;
        for (let i = 0; i < members.length && takenThisCat < perCatCap; i += 20) {
          const batch = members.slice(i, i + 20);
          const pageids = batch.map((m: any) => m.pageid).join("|");
          const exUrl = new URL(`https://${lang}.wikiquote.org/w/api.php`);
          exUrl.searchParams.set("action", "query");
          exUrl.searchParams.set("prop", "extracts");
          exUrl.searchParams.set("explaintext", "1");
          exUrl.searchParams.set("exlimit", "20");
          exUrl.searchParams.set("pageids", pageids);
          exUrl.searchParams.set("format", "json");
          exUrl.searchParams.set("origin", "*");
          let exJson: any;
          try {
            const r = await fetch(exUrl.toString(), { headers: { "User-Agent": "moodverse-harvester/1.0" } });
            if (!r.ok) continue;
            exJson = await r.json();
          } catch { continue; }
          const pagesObj = exJson?.query?.pages ?? {};
          for (const pid of Object.keys(pagesObj)) {
            if (takenThisCat >= perCatCap) break;
            const p = pagesObj[pid];
            const raw = (p.extract ?? "").toString();
            if (!raw) continue;
            const quotes = extractQuotes(raw);
            const author = (p.title ?? "").toString();
            quotes.forEach((q, idx) => {
              pieces.push({
                text: q,
                author,
                source_type: "quote",
                language: lang,
                emotions_tags: tagEmotions(q),
                external_id: `wikiquote:${lang}:${p.pageid}:${idx}`,
              });
              takenThisCat++;
            });
          }
        }
        if (!cmcontinue) break;
      }
      await setCursor(supabase, "wikiquote", cursorKey, cmcontinue);
    }
  }
  return pieces;
}

// ---------- Source: Standard Ebooks (curated classic literature, atom feed) ----------
async function fetchStandardEbooks(limit: number): Promise<Piece[]> {
  const pieces: Piece[] = [];
  try {
    const r = await fetch("https://standardebooks.org/feeds/atom/new-releases", {
      headers: { "User-Agent": "moodverse-harvester/1.0" },
    });
    if (!r.ok) return pieces;
    const xml = await r.text();
    // Cheap XML parsing — extract <entry> blocks
    const entries = xml.split(/<entry\b/).slice(1);
    for (const entryChunk of entries) {
      if (pieces.length >= limit) break;
      const entry = "<entry" + entryChunk.split("</entry>")[0] + "</entry>";
      const title = /<title[^>]*>([^<]+)<\/title>/.exec(entry)?.[1]?.trim();
      const author = /<name>([^<]+)<\/name>/.exec(entry)?.[1]?.trim() ?? "Unknown";
      const summary = /<summary[^>]*>([\s\S]*?)<\/summary>/.exec(entry)?.[1]?.trim();
      const id = /<id>([^<]+)<\/id>/.exec(entry)?.[1]?.trim();
      if (!title || !summary || !id) continue;
      // strip HTML from summary
      const text = summary.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      if (text.length < 120) continue;
      pieces.push({
        text: text.slice(0, 2000),
        author, title,
        source_type: "book",
        language: "en",
        emotions_tags: tagEmotions(text),
        external_id: `standardebooks:${id.split("/").pop()}`.slice(0, 200),
      });
    }
  } catch { /* ignore */ }
  return pieces;
}

// ---------- Embedding (Lovable AI Gateway) ----------
async function embed(text: string, apiKey: string): Promise<number[] | null> {
  try {
    const r = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "openai/text-embedding-3-small", input: text.slice(0, 8000) }),
    });
    if (!r.ok) return null;
    const j = await r.json();
    return j.data?.[0]?.embedding ?? null;
  } catch { return null; }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    const url = new URL(req.url);
    const sources = (url.searchParams.get("sources") ?? "poetrydb,gutendex,wikisource,wikiquote,standardebooks").split(",");
    const limitPerSource = parseInt(url.searchParams.get("limit") ?? "300", 10);
    const langs = (url.searchParams.get("langs") ?? "ru,en,hy,fr,de,es").split(",");
    const doEmbed = url.searchParams.get("embed") !== "0" && !!LOVABLE_API_KEY;

    const all: Piece[] = [];
    if (sources.includes("poetrydb")) all.push(...await fetchPoetryDB(limitPerSource));
    if (sources.includes("gutendex")) all.push(...await fetchGutendex(limitPerSource, langs));
    if (sources.includes("wikisource")) all.push(...await fetchWikisource(supabase, limitPerSource, langs));
    if (sources.includes("wikiquote")) all.push(...await fetchWikiquote(supabase, limitPerSource, langs));
    if (sources.includes("standardebooks")) all.push(...await fetchStandardEbooks(limitPerSource));

    // Dedup by external_id against DB
    const ids = all.map((p) => p.external_id);
    const { data: have } = await supabase
      .from("literary_works").select("external_id").in("external_id", ids);
    const seen = new Set((have ?? []).map((r: any) => r.external_id));
    const fresh = all.filter((p) => !seen.has(p.external_id));

    let inserted = 0, failed = 0;
    for (let i = 0; i < fresh.length; i += 25) {
      const chunk = fresh.slice(i, i + 25);
      const rows = await Promise.all(chunk.map(async (p) => {
        const embedding = doEmbed ? await embed(`${p.title ?? ""}\n${p.author}\n${p.text}`, LOVABLE_API_KEY!) : null;
        return {
          text: p.text, author: p.author, title: p.title ?? null,
          source_type: p.source_type, emotions_tags: p.emotions_tags ?? [],
          language: p.language ?? "en", year: p.year ?? null,
          external_id: p.external_id, embedding: embedding as any,
        };
      }));
      const { error, data } = await supabase.from("literary_works").insert(rows).select("id");
      if (error) { console.error("insert", error); failed += chunk.length; }
      else inserted += data?.length ?? 0;
    }

    return new Response(JSON.stringify({
      sources, languages: langs, harvested: all.length,
      duplicates: all.length - fresh.length, inserted, failed, embedded: doEmbed,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("harvest-libraries error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});