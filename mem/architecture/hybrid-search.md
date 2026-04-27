---
name: Hybrid search architecture
description: Order of operations for the find-resonance pipeline — real APIs, pgvector, AI fallback
type: feature
---
**Pipeline order (must be implemented in `find-resonance` edge function):**

1. **Embed the user input** (text + emotions + context) using a strong embedding model (OpenAI `text-embedding-3-large` or equivalent via Lovable AI / direct).
2. **pgvector semantic search** against `public.literary_works` — retrieve top ~20 candidates by cosine similarity, optionally filtered by `emotions_tags` overlap and language.
3. **External APIs in parallel** for freshness and breadth (all called from edge functions, never from client):
   - PoetryDB (https://poetrydb.org) — English-language poems by author/keyword.
   - Quotable.io (https://api.quotable.io) — curated quotes.
   - Open Library API — book metadata enrichment.
   - API-Ninjas Quotes — themed quotes by category.
4. **AI re-rank & curate** with google/gemini-2.5-pro: feed candidates from steps 2+3 to the model and have it pick the 6–8 most resonant, balanced set, write the warm `explanation`, and assign `relevance_score`. Tool calling for structured output.
5. **AI stylization fallback** ONLY if too few real candidates resonate — generate "in the spirit of [author]" pieces, marked `is_original: true`.

**Caching:** cache external API responses by query hash for ~24h to save quota.
**Errors:** surface 429 / 402 from Lovable AI back to the client as friendly toasts.
