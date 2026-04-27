---
name: Literary works knowledge base
description: pgvector table schema, embedding pipeline, and import strategy for the literary corpus
type: feature
---
**Table: `public.literary_works`** (to be created via migration when implementing pgvector phase)

Columns:
- `id` uuid primary key default gen_random_uuid()
- `text` text not null — the excerpt itself
- `author` text not null
- `title` text
- `source_type` text not null check in ('poem','book','film','monologue','quote')
- `emotions_tags` text[] default '{}' — e.g. {'грусть','одиночество','надежда'}
- `embedding` vector(3072) — for text-embedding-3-large; use 1536 if using -3-small
- `language` text not null default 'ru' — 'ru' | 'en' | etc.
- `year` int
- `created_at` timestamptz default now()

**Indexes:**
- `ivfflat` or `hnsw` on `embedding` using `vector_cosine_ops`.
- GIN on `emotions_tags`.
- btree on `language`, `source_type`.

**RLS:** read-only public SELECT (knowledge base is shared, not user-owned). No INSERT/UPDATE/DELETE from clients — only service role via edge functions.

**Embedding pipeline:**
- Edge function `embed-and-store` accepts batch of pieces, calls embedding model, upserts rows.
- Auto-embed on insert via DB trigger calling an edge function, OR embed in the import script before insert.
- Source ingestion scripts: import from PoetryDB dumps, public-domain Russian poetry corpora, curated film monologue lists.

**Search RPC:** create `match_literary_works(query_embedding vector, match_count int, filter_lang text, filter_emotions text[])` returning top-N by cosine similarity with optional filters.
