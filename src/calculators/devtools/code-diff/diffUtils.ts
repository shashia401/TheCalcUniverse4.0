export interface DiffLine {
  text: string;
  type: 'added' | 'removed' | 'unchanged';
}

export interface DiffData {
  leftLines: DiffLine[];
  rightLines: DiffLine[];
}

export function computeDiff(left: string[], right: string[]): DiffData {
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
