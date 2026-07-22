// Search island. Receives a slim, serializable index built at build time — it does
// NOT import the registry (that would drag ~350 KB into the client bundle).
// Two looks: default (light /search/ page) and `hero` (floating dropdown on the
// dark homepage hero).

import { useMemo, useState } from 'react';

export interface SearchEntry {
  /** display title */
  t: string;
  /** path, e.g. /finance/loan-calculator/ */
  p: string;
  /** category name */
  c: string;
}

interface Props {
  index: SearchEntry[];
  hero?: boolean;
}

export default function SearchBox({ index, hero = false }: Props) {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return index
      .filter((e) => e.t.toLowerCase().includes(q) || e.c.toLowerCase().includes(q))
      .slice(0, 25);
  }, [query, index]);

  const showResults = query.trim().length >= 2;

  if (hero) {
    return (
      <div className="relative max-w-2xl">
        <input
          id="calc-search"
          type="search"
          autoComplete="off"
          placeholder={`Search ${index.length} calculators — try "mortgage", "BMI", "percentage"…`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          aria-label={`Search ${index.length} calculators`}
          className="w-full rounded-xl border border-white/25 bg-white/10 px-5 py-4 text-base text-white placeholder-white/55 backdrop-blur transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-amber-400 focus:border-white/50"
        />
        {showResults && (
          <div className="absolute z-30 mt-2 w-full rounded-xl border border-[var(--border-warm)] bg-[var(--surface-card)] shadow-elevation-3 overflow-hidden">
            {results.length === 0 ? (
              <p className="px-4 py-3 text-sm text-[var(--surface-text-muted)]">No matches — try a shorter word.</p>
            ) : (
              <ul className="max-h-80 overflow-y-auto list-none p-0 m-0">
                {results.map((r) => (
                  <li key={r.p}>
                    <a
                      href={r.p}
                      className="flex items-center justify-between gap-3 px-4 py-2.5 transition-colors hover:bg-[var(--surface-bg)] focus-visible:bg-[var(--surface-bg)] focus-visible:outline-none"
                    >
                      <span className="font-medium text-sm text-[var(--surface-text)]">{r.t}</span>
                      <span className="text-xs text-[var(--surface-text-muted)] shrink-0">{r.c}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <label htmlFor="calc-search" className="block text-sm font-medium text-[var(--surface-text)] mb-2">
        Search {index.length} calculators
      </label>
      <input
        id="calc-search"
        type="search"
        autoComplete="off"
        placeholder="e.g. mortgage, BMI, percentage…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded-xl border border-[var(--border-warm)] bg-[var(--surface-card)] px-4 py-3 text-base text-[var(--surface-text)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-default)] focus:border-[var(--brand-default)]"
      />

      {query.trim().length >= 2 && (
        <p className="mt-3 text-sm text-[var(--surface-text-muted)]" role="status">
          {results.length === 0 ? 'No matches — try a shorter word.' : `${results.length} match${results.length === 1 ? '' : 'es'}`}
        </p>
      )}

      <ul className="mt-4 space-y-2 list-none p-0">
        {results.map((r) => (
          <li key={r.p}>
            <a
              href={r.p}
              className="block rounded-lg border border-[var(--border-warm)] bg-[var(--surface-card)] px-4 py-3 transition-colors hover:border-[var(--brand-default)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-default)]"
            >
              <span className="font-medium text-[var(--surface-text)]">{r.t}</span>
              <span className="ml-2 text-xs text-[var(--surface-text-muted)]">{r.c}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
