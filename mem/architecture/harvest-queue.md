---
name: Harvest queue architecture
description: Library growth runs through harvest_queue (planner + worker) driven by pg_cron; admin-only edge functions, cron authenticates with app_config.cron_token; quality gate + AI budget circuit breaker.
type: feature
---

## Queue flow
- `harvest-libraries?action=plan` — enqueues one bounded task per source (11 sources) into `harvest_queue`; skips if pending/running >= sources count. Cron: daily 03:00 UTC.
- `harvest-libraries?action=work` — claims exactly ONE task via `claim_harvest_task()` (SKIP LOCKED, 15-min stale reclaim), processes it, marks `done` / `error` / `paused` with `inserted_count`. Cron: every 10 minutes.
- `action=run` (default) — legacy manual mode with `?sources=&langs=&limit=`.

## Guards
- Quality gate: `_shared/quality.ts` `cleanFragment` + `isQualityFragment` before dedup.
- Dedup: composite `(source_type, external_id)`, chunked lookups of 50.
- Budget: `_shared/budget-guard.ts` — daily $5 cap; on exhaustion the task is set to `paused` and the function returns 402. Embedding spend logged to `ai_spend_log` as `harvest-embeddings`.

## Auth
- `harvest-libraries`, `backfill-embeddings`, `ingest-works`, `seed-library` are admin-only (`_shared/admin.ts` `requireAdmin`).
- Cron bypass: header `x-cron-token` compared against `public.app_config` row `cron_token` (service-role only table, no RLS policies by design).
- The client no longer auto-invokes `seed-library` (library is fully seeded).

## Source: curatedauthors
- Canon-first sweep: reads `curated_authors` ordered by `priority`, rotates 8 authors per run via the `curatedauthors:offset` cursor.
- Searches the author's name on their language Wikisource; when the plaintext extract is empty (template-built poem pages) it falls back to the rendered HTML (`action=parse`) and takes up to 2 blocks per page.
- external_id format `curated:<lang>:<pageid>:<block>`.
