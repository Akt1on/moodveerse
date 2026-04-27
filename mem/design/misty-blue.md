---
name: Misty Blue design system
description: Visual tokens, typography, motion and tone for MoodVerse UI
type: design
---
**Aesthetic:** Misty Blue — calm, contemplative, literary. Evokes quiet morning fog, slate water, candlelit reading.

**Color tokens (HSL, in index.css):** soft slate-blue background, muted indigo primary, warm parchment accents for cards, low-contrast borders. Both light and dark modes; dark mode is the poetic default.

**Typography:**
- Headings & literary text: **Cormorant Garamond** (serif).
- Body / UI: clean sans (Inter or system).
- Never sans-serif for poem text.

**Motion & atmosphere:**
- `AuroraBackground` floating gradient component on main surfaces.
- Slow fades, gentle stagger when revealing pieces. No bounces, no harsh transitions.
- Generous whitespace; line-height for poetry ≥ 1.6.

**Components:**
- `PieceCard`: serif text, subtle border, optional TTS (ru-RU), favorite, share.
- `MoodForm`: emotion multi-select chips, intensity slider, free-text textarea, optional context.

**Forbidden:** harsh neons, emoji-heavy UI, motivational-poster styling, sans-serif for poems.
