---
name: Council of 5 curators
description: Multi-agent ensemble (council-resonance edge function) — 5 curator personas vote on candidates, orchestrator merges
type: feature
---
**Edge function:** `council-resonance` — alternative to `find-resonance`. Same input shape, returns same `pieces[]` plus `curator` + `curator_votes`.

**Pipeline:**
1. Same hybrid retrieval as find-resonance (lexical RPC + random batch), pool size 30.
2. 5 curator personas called in parallel with `Promise.all` against `google/gemini-2.5-flash` (tool-calling, each picks exactly 2 idx from pool):
   - 🪶 Poet — lyrical, musical, image-heavy.
   - 🧭 Philosopher — meaning beneath feeling, Dostoevsky/Camus/Saroyan.
   - 🌿 Healer — gentle, holding, Rumi/Mary Oliver/Psalms.
   - 🎬 Critic — film monologues, cinematic prose.
   - ✨ Mystic — surprising, ancient, eastern, spiritual.
3. Orchestrator dedupes by idx, ranks by (vote count desc, avg score desc), takes top 8.
4. Each piece gets `curator` (lead voice = highest individual score) + `curator_votes[]` (everyone who picked it).

**UI:**
- MoodForm has mode toggle: «Один куратор» (find-resonance) | «Совет 5 кураторов» (council-resonance).
- PieceCard shows curator emoji+label badge; if multiple curators voted, badge shows ×N and tooltip lists all voters.
- Index.tsx routes to the chosen edge function based on `input.mode`.

**Cost note:** Council = 5 AI calls per query vs 1 for single mode. Keep it opt-in.