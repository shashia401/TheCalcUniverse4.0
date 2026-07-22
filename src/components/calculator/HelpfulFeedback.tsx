// "Was this helpful?" (Omni/CalculatorSoup idea). Client-only, localStorage-deduped.
// Honest: no fabricated count. A real aggregate count is a post-launch backend item.

import { useEffect, useState } from 'react';

interface Props {
  calculatorId: string;
}

export default function HelpfulFeedback({ calculatorId }: Props) {
  const key = `helpful:${calculatorId}`;
  const [voted, setVoted] = useState<null | 'yes' | 'no'>(null);

  useEffect(() => {
    try {
      const prev = localStorage.getItem(key);
      if (prev === 'yes' || prev === 'no') setVoted(prev);
    } catch {
      // storage unavailable — feature simply resets each visit
    }
  }, [key]);

  const vote = (v: 'yes' | 'no') => {
    setVoted(v);
    try {
      localStorage.setItem(key, v);
    } catch {
      // ignore
    }
  };

  if (voted) {
    return (
      <p className="text-sm text-[var(--surface-text-muted)]">
        {voted === 'yes' ? 'Thanks — glad it helped.' : 'Thanks for the feedback — we’ll keep improving it.'}
      </p>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-[var(--surface-text)]">Was this calculator helpful?</span>
      <button
        type="button"
        onClick={() => vote('yes')}
        className="rounded-lg border border-[var(--border-warm)] px-3 py-1 text-sm text-[var(--surface-text-secondary)] transition-colors hover:border-accent-emerald-400 hover:text-accent-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-default)]"
      >
        Yes
      </button>
      <button
        type="button"
        onClick={() => vote('no')}
        className="rounded-lg border border-[var(--border-warm)] px-3 py-1 text-sm text-[var(--surface-text-secondary)] transition-colors hover:border-accent-rose-400 hover:text-accent-rose-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-default)]"
      >
        No
      </button>
    </div>
  );
}
