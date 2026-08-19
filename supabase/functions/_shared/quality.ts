const BAD_PATTERNS = [
  /<[a-z/][^>]*>/i,                          // HTML markup
  /\{\{|\}\}|\[\[|\]\]/,                     // wiki markup
  /^\s*(глава|часть|chapter|part|գլուխ)\s+[\dIVXLC]+/i,
  /^\s*\d+\s*$/,                             // bare page numbers
  /project gutenberg|archive\.org|wikisource|wikiquote|all rights reserved|isbn/i,
  /\bhttps?:\/\//i,
  /^\s*(содержание|оглавление|contents|примечания|footnotes|см\. также)/i,
];

const MIN_LEN = 120;
const MAX_LEN = 1500;

export function cleanFragment(raw: string): string {
  return raw
    .replace(/\r/g, "")
    .replace(/\[\d+\]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Strict quality gate for harvested fragments. */
export function isQualityFragment(text: string): boolean {
  const t = text.trim();
  if (t.length < MIN_LEN || t.length > MAX_LEN) return false;
  if (!/[.!?…»"'”’\]\)]\s*$|[։՞՜]\s*$/u.test(t)) return false; // must end on real punctuation (incl. Armenian)
  if (BAD_PATTERNS.some((re) => re.test(t))) return false;
  const letters = (t.match(/\p{L}/gu) ?? []).length;
  if (letters / t.length < 0.55) return false;            // too much noise/digits
  const upper = (t.match(/\p{Lu}/gu) ?? []).length;
  if (upper / Math.max(1, letters) > 0.4) return false;   // shouting headers / OCR junk
  return true;
}