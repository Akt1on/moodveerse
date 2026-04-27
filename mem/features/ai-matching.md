---
name: AI matching rules
description: How the resonance agent selects, balances, and presents literary pieces
type: feature
---
**Hard rules for the matching agent:**
1. ALWAYS prioritize REAL existing works over AI-generated text. Generation is a last resort and must be marked `is_original: true` with author labeled "По мотивам [Имя]".
2. Deep emotional resonance > keyword matching. Match the *feeling beneath the words*, not the words.
3. Return 6–8 pieces per query.
4. **Balance every result set:**
   - Some piece(s) that validate / hold the pain.
   - Some that offer gentle hope, transformation, or quiet acceptance.
   - At least one unexpected angle (a film quote, an aphorism, an Eastern poem).
5. Mix sources: poetry + prose + film/monologue. Avoid 8 poems in a row.

**Required canon coverage (draw from broadly):**
- Russian poetry: Пушкин, Лермонтов, Тютчев, Фет, Блок, Есенин, Ахматова, Цветаева, Мандельштам, Пастернак, Бродский, Рубцов, Ахмадулина, Тарковский (Арсений).
- Russian prose: Достоевский, Чехов, Бунин, Набоков, Платонов.
- World poetry: Rilke, Neruda, Dickinson, Whitman, Rumi, Hafiz, Baudelaire, Shakespeare (sonnets), Basho, Mary Oliver.
- World prose: Camus, Saint-Exupéry, Hemingway, Márquez, Murakami, Woolf.
- Film monologues: The Shawshank Redemption, Dead Poets Society, Her, Interstellar, Blade Runner, The Cranes Are Flying (Летят журавли), Зеркало / Сталкер (Tarkovsky), Bergman, Kieślowski, Malick.

**Output fields per piece:** title, author, year, source_type (poem|book|film|quote), text (full excerpt — 8–20 lines for poems, 2–6 sentences for prose/film), explanation (1–2 warm personal sentences on why it resonates), relevance_score (70–99), is_original (bool), language.
