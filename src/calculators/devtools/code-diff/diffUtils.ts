export interface DiffLine {
  text: string;
  type: 'added' | 'removed' | 'unchanged';
}

export interface DiffData {
  leftLines: DiffLine[];
  rightLines: DiffLine[];
}

/** Split text into lines, treating CRLF / CR / LF alike and ignoring one final line terminator. */
export function toLines(text: string): string[] {
  if (!text) return [];
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  if (lines.length > 1 && lines[lines.length - 1] === '') lines.pop();
  return lines;
}

/** DP table budget (cells) after trimming common head and tail. Beyond it we refuse instead of freezing the tab. */
export const MAX_DIFF_CELLS = 16_000_000;

/** Minimal line diff (longest common subsequence). Returns null when the changed region is too large to diff safely. */
export function computeDiff(leftAll: string[], rightAll: string[]): DiffData | null {
  // Trim the common prefix / suffix: it is unchanged by definition and removes most of the DP work for typical edits.
  let start = 0;
  while (start < leftAll.length && start < rightAll.length && leftAll[start] === rightAll[start]) start++;
  let endL = leftAll.length;
  let endR = rightAll.length;
  while (endL > start && endR > start && leftAll[endL - 1] === rightAll[endR - 1]) {
    endL--;
    endR--;
  }
  if ((endL - start + 1) * (endR - start + 1) > MAX_DIFF_CELLS) return null;
  const head = leftAll.slice(0, start).map((text): DiffLine => ({ text, type: 'unchanged' }));
  const tail = leftAll.slice(endL).map((text): DiffLine => ({ text, type: 'unchanged' }));
  const mid = diffCore(leftAll.slice(start, endL), rightAll.slice(start, endR));
  return { leftLines: [...head, ...mid.leftLines, ...tail], rightLines: [...head, ...mid.rightLines, ...tail] };
}

function diffCore(left: string[], right: string[]): DiffData {
  const m = left.length;
  const n = right.length;

  // Build LCS DP table
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (left[i - 1] === right[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to build diff lines
  const leftStack: DiffLine[] = [];
  const rightStack: DiffLine[] = [];

  let i = m;
  let j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && left[i - 1] === right[j - 1]) {
      leftStack.unshift({ text: left[i - 1], type: 'unchanged' });
      rightStack.unshift({ text: right[j - 1], type: 'unchanged' });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      rightStack.unshift({ text: right[j - 1], type: 'added' });
      j--;
    } else if (i > 0) {
      leftStack.unshift({ text: left[i - 1], type: 'removed' });
      i--;
    }
  }

  return { leftLines: leftStack, rightLines: rightStack };
}
