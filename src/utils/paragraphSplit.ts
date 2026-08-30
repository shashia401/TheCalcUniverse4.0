// Splits a long block of prose into readable paragraphs for scannability
// (SEO/AI-search audits flag single unbroken blocks over ~150 words). This
// is a rendering-only heuristic — it never touches the source text, so
// content stays exactly as written; it just groups sentences into chunks.
//
// ponytail: sentence-boundary detection is a heuristic, not a real NLP
// sentence splitter — it protects against the abbreviations actually used
// in this codebase's content (checked via grep) but an unlisted one would
// just produce one extra (harmless) paragraph break, not garbled text.
const ABBREVIATIONS = /\b(?:e\.g\.|i\.e\.|etc\.|approx\.|vs\.|Dr\.|Mr\.|Mrs\.|U\.S\.|U\.K\.)$/;

function splitSentences(text: string): string[] {
  const parts = text.split(/(?<=[.!?])\s+(?=[A-Z])/);
  const merged: string[] = [];
  for (const part of parts) {
    const prev = merged[merged.length - 1];
    if (prev !== undefined && ABBREVIATIONS.test(prev.trim())) {
      merged[merged.length - 1] = `${prev} ${part}`;
    } else {
      merged.push(part);
    }
  }
  return merged;
}

export function splitIntoParagraphs(text: string, targetWords = 70): string[] {
  const sentences = splitSentences(text.trim());
  const paragraphs: string[] = [];
  let current: string[] = [];
  let wordCount = 0;

  for (const sentence of sentences) {
    current.push(sentence);
    wordCount += sentence.trim().split(/\s+/).length;
    if (wordCount >= targetWords) {
      paragraphs.push(current.join(' '));
      current = [];
      wordCount = 0;
    }
  }
  if (current.length > 0) paragraphs.push(current.join(' '));
  return paragraphs.length > 0 ? paragraphs : [text];
}
