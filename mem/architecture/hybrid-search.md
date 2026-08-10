---
name: Hybrid search architecture
description: Order of operations for the find-resonance pipeline — real APIs, pgvector, AI fallback
type: feature
---
**Pipeline order (must be implemented in `find-resonance` edge function):**

1. **Embed the user input** (text + emotions + context) using a strong embedding model (OpenAI `text-embedding-3-large` or equivalent via Lovable AI / direct).
2. **pgvector semantic search** against `public.literary_works` — retrieve a broad nearest-neighbor pool by cosine similarity. Language may filter; `emotions_tags` are only a small ranking bonus and MUST NOT exclude semantically strong untagged works.
3. **External APIs in parallel** for freshness and breadth (all called from edge functions, never from client):
   - PoetryDB (https://poetrydb.org) — English-language poems by author/keyword.
   - Quotable.io (https://api.quotable.io) — curated quotes.
   - Open Library API — book metadata enrichment.
   - API-Ninjas Quotes — themed quotes by category.
4. **AI re-rank & curate** with a strong Gemini model: feed candidates from steps 2+3 to the model. It returns candidate indexes only; server code reconstructs every result from the database so text/author/title cannot be fabricated or altered. Return 3–6 strong matches (minimum score 72), never pad to a fixed count.
5. **AI stylization fallback** ONLY if too few real candidates resonate — generate "in the spirit of [author]" pieces, marked `is_original: true`.

**Caching:** cache external API responses by query hash for ~24h to save quota.
**Errors:** surface 429 / 402 from Lovable AI back to the client as friendly toasts.

**Quality invariants:**
- Never mix arbitrary/random library rows into a result pool.
- Vector retrieval is the primary signal; lexical retrieval is normalized separately and adds precision/reciprocal evidence.
- A candidate must relate to the user's situation and emotional conflict, not merely share a keyword.
- If no candidate clears the relevance threshold, ask the user for more detail instead of returning weak results.
