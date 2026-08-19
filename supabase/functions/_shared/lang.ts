/**
 * Script + stopword heuristic language detection.
 * No external dependency (franc is not reliably importable in Deno edge runtime).
 */
const STOPWORDS: Record<string, string[]> = {
  ru: [" и ", " не ", " что ", " как ", " на ", " с ", " в ", " я ", " мне ", " то "],
  en: [" the ", " and ", " of ", " to ", " in ", " is ", " that ", " it ", " with "],
  fr: [" le ", " la ", " les ", " des ", " et ", " est ", " une ", " dans ", " qui "],
  de: [" der ", " die ", " das ", " und ", " ist ", " nicht ", " mit ", " ein "],
  es: [" el ", " la ", " los ", " de ", " que ", " y ", " en ", " un ", " por "],
};

export function detectLanguage(text: string): string | null {
  const sample = ` ${text.toLowerCase().replace(/\s+/g, " ").slice(0, 1200)} `;
  const letters = sample.replace(/[^\p{L}]/gu, "");
  if (letters.length < 40) return null;

  const count = (re: RegExp) => (letters.match(re) ?? []).length;
  const arm = count(/[\u0530-\u058F]/g);
  const cyr = count(/[\u0400-\u04FF]/g);
  const grk = count(/[\u0370-\u03FF]/g);
  const lat = count(/[A-Za-zÀ-ÿ]/g);
  const total = letters.length;

  if (arm / total > 0.3) return "hy";
  if (grk / total > 0.3) return "el";
  if (cyr / total > 0.3) return "ru";
  if (lat / total < 0.3) return null;

  let best: string | null = null;
  let bestScore = 0;
  for (const [lang, words] of Object.entries(STOPWORDS)) {
    if (lang === "ru") continue;
    const score = words.reduce((s, w) => s + (sample.split(w).length - 1), 0);
    if (score > bestScore) {
      bestScore = score;
      best = lang;
    }
  }
  return bestScore >= 2 ? best : null;
}

/**
 * Returns the language to store, or null when the fragment must be rejected.
 * Mismatch against a confidently detected language re-classifies instead of lying.
 */
export function reconcileLanguage(text: string, claimed?: string): string | null {
  const detected = detectLanguage(text);
  if (!detected) return claimed ?? null;
  if (!claimed) return detected;
  if (detected === claimed) return claimed;
  // Cyrillic/Armenian scripts are unambiguous — trust detection over the source's claim.
  if (detected === "hy" || detected === "ru") return detected;
  // Latin-script confusion between en/fr/de/es: trust detection too, it beats source metadata.
  return detected;
}