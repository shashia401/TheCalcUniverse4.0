// Pure typing-test maths shared by index.ts and the panel (the panel must not parse result strings).
//
// Definitions (stated to users): a "word" is 5 characters (including spaces and punctuation), the long-standing
// typing-test convention. Gross WPM = typed characters / 5 / minutes. A typed character is "correct" when it belongs to the
// longest common subsequence of the source and the typed text, so one inserted or dropped letter costs one error instead of
// shifting every later character out of line (a position-by-position comparison would mark the rest of the text wrong).
// Accuracy = correct / typed characters; Net WPM = Gross WPM x accuracy = correct characters / 5 / minutes.

/** Length of the longest common subsequence; falls back to a position-by-position count for very long inputs. */
export function commonLength(a: string, b: string): number {
  const x = [...a];
  const y = [...b];
  if (x.length * y.length > 9_000_000) {
    let same = 0;
    for (let i = 0; i < Math.min(x.length, y.length); i++) if (x[i] === y[i]) same++;
    return same;
  }
  let prev = new Int32Array(y.length + 1);
  let cur = new Int32Array(y.length + 1);
  for (let i = 1; i <= x.length; i++) {
    for (let j = 1; j <= y.length; j++) {
      cur[j] = x[i - 1] === y[j - 1] ? prev[j - 1] + 1 : Math.max(prev[j], cur[j - 1]);
    }
    [prev, cur] = [cur, prev];
  }
  return prev[y.length];
}

export interface TypingStats {
  totalChars: number;
  correctChars: number;
  errorCount: number;
  accuracy: number;
  minutes: number;
  grossWpm: number;
  netWpm: number;
  wordsInSource: number;
}

export function typingStats(values: Record<string, string>): TypingStats | null {
  const source = values.sourceText || '';
  const typed = values.typedText || '';
  if (!source.trim() || !typed.trim()) return null;
  const minutes = parseFloat(values.timerMinutes || '1');
  if (!(minutes > 0)) return null;
  const totalChars = [...typed].length;
  const correctChars = commonLength(source, typed);
  const accuracy = (correctChars / totalChars) * 100;
  const grossWpm = totalChars / 5 / minutes;
  return {
    totalChars,
    correctChars,
    errorCount: totalChars - correctChars,
    accuracy,
    minutes,
    grossWpm,
    netWpm: (correctChars / 5) / minutes,
    wordsInSource: source.trim().split(/\s+/).length,
  };
}
