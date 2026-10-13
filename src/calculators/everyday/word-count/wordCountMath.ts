// Pure text statistics shared by index.ts and the panel (the panel must not parse result strings).
//
// Counting rules (stated to users in the educational text):
//  - word = any run of non-whitespace characters, as in most word processors; hyphenated compounds, contractions,
//    numbers and URLs are single words, and a lone dash or symbol counts as a word too;
//  - characters = Unicode code points (an emoji is 1 character, not 2);
//  - sentence = text ending in . ! or ? followed by whitespace/end (the dot inside "3.14" does not end one; an
//    abbreviation such as "Dr." does, which is a known limitation); trailing text without a terminator counts as one;
//  - paragraph = block separated by a blank line;
//  - reading speed basis: 238 wpm average for adult non-fiction (Brysbaert 2019), speaking at 150 wpm.

export const SPEAKING_WPM = 150;

const edge = /^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu;
/** Lower-cased word with surrounding punctuation removed and curly apostrophes normalised ("Don’t!" -> "don't"). */
export const normalizeWord = (w: string) => w.replace(/[’‘]/g, "'").replace(edge, '').toLowerCase();

/** Vowel-group syllable heuristic with a silent final "e" correction (still approximate). */
export function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  let groups = (w.match(/[aeiouy]+/g) || []).length;
  if (groups > 1 && /[^aeiouy]e$/.test(w) && !/le$/.test(w)) groups -= 1; // silent e: "make", "time" (but "table")
  if (groups > 1 && /[^aeiouy]es$|[^aeiouy]ed$/.test(w) && !/(t|d)ed$/.test(w) && !/[sxz]es$|[cs]hes$/.test(w)) groups -= 1;
  return Math.max(1, groups);
}

export const formatDuration = (seconds: number) => {
  const total = Math.round(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m > 0 ? `${m} min ${s} sec` : `${s} sec`;
};

export interface TextStats {
  wordCount: number;
  charCount: number;
  charNoSpaces: number;
  sentences: number;
  paragraphs: number;
  uniqueWords: number;
  readingSeconds: number;
  speakingSeconds: number;
  avgWordLength: number;
  keywords: { word: string; count: number; percent: number }[];
  fkGrade: number;
}

export function analyzeText(text: string, wpm: number): TextStats | null {
  if (!text.trim() || !(wpm > 0)) return null;
  const words = text.trim().split(/\s+/);
  const wordCount = words.length;
  const chars = [...text];
  const charNoSpaces = chars.filter((c) => !/\s/.test(c)).length;
  const sentences = (text.match(/[^.!?]+(?:[.!?]+(?=\s|$)|$)/g) || []).filter((s) => /[\p{L}\p{N}]/u.test(s)).length || 1;
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length || 1;

  const norm = words.map(normalizeWord);
  const uniqueWords = new Set(norm.filter((w) => w.length > 0)).size;

  const freq = new Map<string, number>();
  for (const w of norm) if (w.length > 1) freq.set(w, (freq.get(w) || 0) + 1);
  const keywords = [...freq.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 10)
    .map(([word, count]) => ({ word, count, percent: (count / wordCount) * 100 }));

  const totalSyllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
  const fkGrade = Math.max(0, 0.39 * (wordCount / sentences) + 11.8 * (totalSyllables / wordCount) - 15.59);

  return {
    wordCount,
    charCount: chars.length,
    charNoSpaces,
    sentences,
    paragraphs,
    uniqueWords,
    readingSeconds: (wordCount / wpm) * 60,
    speakingSeconds: (wordCount / SPEAKING_WPM) * 60,
    avgWordLength: charNoSpaces / wordCount,
    keywords,
    fkGrade,
  };
}
