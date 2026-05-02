---
name: Personal memory agent
description: How user_memory table and memory-agent edge function personalize matching
type: feature
---
**Tables:**
- `user_memory(user_id PK, summary, recurring_themes[], dominant_emotions[], agent_notes, entries_analyzed, updated_at)` — RLS: own-row only.

**Edge functions:**
- `memory-agent` — reads last 30 mood_entries of the authenticated user, asks google/gemini-2.5-flash (tool-calling) to produce summary + recurring_themes + dominant_emotions + agent_notes, upserts into user_memory.
- `journey-insight` — reads last 20 entries, returns a 3–5 sentence poetic mirror of the user's path (free-text, не tool call).
- `find-resonance` — when the request carries a user JWT, looks up user_memory and injects summary/themes/notes into the system prompt so subsequent picks avoid repetition and softly continue the path.

**UI:**
- `/journey` page — shows memory profile, intensity LineChart (recharts ^2.15), emotion cloud, AI insight on demand.
- Header link: «Путь» (visible only to authenticated users).

**Rules:**
- Memory is opt-in via the «Обновить» button — never refreshed silently to keep AI cost predictable.
- Never expose `agent_notes` raw to the user — it is internal curator guidance.
- recharts must stay on 2.x because shadcn chart.tsx is incompatible with 3.x.