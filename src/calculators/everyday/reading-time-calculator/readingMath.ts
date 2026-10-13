// Pure reading-time maths shared by index.ts and the panel (the panel must not parse result strings).
// Words-per-minute basis: silent reading of adult non-fiction averages 238 wpm (Brysbaert 2019 meta-analysis,
// J. Memory & Language 109); the speed options are illustrative paces around that. The content multipliers and
// break rules below are rules of thumb, not published standards.

export const CONTENT_MULTIPLIERS: Record<string, number> = { general: 1.0, technical: 1.3, academic: 1.5 };
export const WORDS_PER_PAGE = 250;

export interface ReadingInfo {
  wordCount: number;
  wpm: number;
  multiplier: number;
  contentType: string;
  /** reading minutes before breaks */
  readingMinutes: number;
  breakMinutes: number;
  breakItems: string[];
  totalMinutes: number;
  pages: number;
}

/** Total minutes for a word count at a speed, with the content multiplier and optional breaks. */
export function readingMinutesFor(wordCount: number, wpm: number, multiplier: number, pauses: string) {
  const readingMinutes = (wordCount / wpm) * multiplier;
  let breakMinutes = 0;
  const breakItems: string[] = [];
  if (readingMinutes >= 30) {
    if (pauses === 'short') {
      const n = Math.floor(readingMinutes / 30);
      breakMinutes = n * 5;
      if (n > 0) breakItems.push(`${n} x 5-min break${n > 1 ? 's' : ''}`);
    } else if (pauses === 'full') {
      const n = Math.floor(readingMinutes / 60);
      breakMinutes = n * 15;
      if (n > 0) breakItems.push(`${n} x 15-min break${n > 1 ? 's' : ''}`);
    }
  }
  return { readingMinutes, breakMinutes, breakItems, totalMinutes: readingMinutes + breakMinutes };
}

export function readingInfo(values: Record<string, string>): ReadingInfo | null {
  const wordCount = parseInt(values.wordCount, 10);
  if (!Number.isFinite(wordCount) || wordCount < 1) return null;
  const wpm = parseInt(values.readingSpeed || '200', 10);
  if (!Number.isFinite(wpm) || wpm < 1) return null;
  const contentType = CONTENT_MULTIPLIERS[values.contentType || 'general'] !== undefined ? values.contentType || 'general' : 'general';
  const multiplier = CONTENT_MULTIPLIERS[contentType];
  const r = readingMinutesFor(wordCount, wpm, multiplier, values.includePauses || 'none');
  return { wordCount, wpm, multiplier, contentType, ...r, pages: Math.ceil(wordCount / WORDS_PER_PAGE) };
}
