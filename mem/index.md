# MoodVerse — Project Memory

## Core
MoodVerse: empathetic literary companion. Helps users process emotions through deeply resonant real poetry, prose, and film quotes. Never generic, never clinical — always warm, poetic, healing.
AI matching MUST prioritize REAL existing works over AI-generated ones. Deep emotional resonance > keyword matching. Always balance: validation of pain + gentle hope/transformation.
Canon: Russian (Пушкин, Есенин, Ахматова, Цветаева, Бродский, Мандельштам, Рубцов, Ахмадулина, Пастернак, Блок, Бунин) + world (Rilke, Neruda, Dickinson, Rumi, Baudelaire, Shakespeare, Whitman, Basho) + film (Shawshank, Dead Poets Society, Her, Interstellar, The Cranes Are Flying, Tarkovsky, Bergman).
Hybrid search: real APIs (PoetryDB, Quotable.io, Open Library, API-Ninjas Quotes) FIRST, then pgvector semantic similarity, then AI stylization as last resort.
Visual style: Misty Blue — calm slate-blue, Cormorant Garamond serif, soft gradients, AuroraBackground. UI must feel literary and tender.
Stack: Lovable Cloud + Lovable AI Gateway (google/gemini-2.5-pro). All external API calls go through Edge Functions. Russian-localized by default.

## Memories
- [Vision & tone](mem://features/vision) — Core product purpose and emotional contract with the user
- [AI matching rules](mem://features/ai-matching) — How the resonance agent must select and balance pieces
- [Hybrid search architecture](mem://architecture/hybrid-search) — APIs → pgvector → AI fallback flow
- [Literary works knowledge base](mem://architecture/literary-works-table) — pgvector table schema and embedding pipeline
- [Design system](mem://design/misty-blue) — Misty Blue tokens, typography, motion
- [Personal memory agent](mem://features/personal-memory) — user_memory table + memory-agent edge function feeding find-resonance
- [Council of 5 curators](mem://features/council-of-curators) — council-resonance edge function: Poet/Philosopher/Healer/Critic/Mystic vote in parallel
