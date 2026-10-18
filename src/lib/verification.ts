// Trust figures shown on the site, read from src/data/verification.json (regenerate with
// `node scripts/verification-stats.mjs --tests <passing test count>` after an audit). Nothing here is typed in by hand.
import data from '../data/verification.json';

const audited = data.audited as Record<string, string>;

export const verification = {
  /** Calculators whose results are pinned by an audit test against an outside source. */
  auditedCount: Object.keys(audited).length,
  totalCalculators: data.calculators,
  testCount: data.tests,
  /** "10,500+": rounded down to the hundred so it stays true as the suite grows. */
  testCountLabel: `${(Math.floor(data.tests / 100) * 100).toLocaleString('en-US')}+`,
};

/** ISO date the calculator's audit test was last committed, or undefined if it has none. */
export const auditedOn = (id: string): string | undefined => audited[id];

/** "Oct 17, 2026" from an ISO date (UTC, so the day never shifts with the build machine's time zone). */
export const formatDate = (iso: string): string =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
