// Pure odds maths shared by index.ts and the panel (the panel must not parse result strings).

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/** Decimal profit multiple (decimal odds - 1) -> smallest fraction with denominator <= 1000. */
export function decimalToFraction(value: number): string {
  if (!(value > 0)) return '0/1';
  let bestNum = 1;
  let bestDen = 1;
  let bestErr = Math.abs(value - 1);
  for (let den = 1; den <= 1000; den++) {
    const num = Math.round(value * den);
    const err = Math.abs(value - num / den);
    if (err < bestErr) {
      bestErr = err;
      bestNum = num;
      bestDen = den;
      if (err < 1e-6) break;
    }
  }
  const g = gcd(bestNum, bestDen);
  return `${bestNum / g}/${bestDen / g}`;
}

/** Any odds format -> decimal odds (>= 1). American odds must satisfy |x| >= 100. null if invalid. */
export function toDecimal(format: string, raw: string | undefined): number | null {
  const s = (raw ?? '').trim();
  if (s === '') return null;
  if (format === 'American') {
    const a = Number(s);
    if (!Number.isFinite(a) || Math.abs(a) < 100) return null;
    return a > 0 ? a / 100 + 1 : 100 / -a + 1;
  }
  if (format === 'Decimal') {
    const d = Number(s);
    return Number.isFinite(d) && d >= 1 ? d : null;
  }
  if (format === 'Fractional') {
    const parts = s.split('/').map((p) => p.trim());
    if (parts.length !== 2) return null;
    const num = Number(parts[0]);
    const den = Number(parts[1]);
    if (!Number.isFinite(num) || !Number.isFinite(den) || num < 0 || den <= 0) return null;
    return num / den + 1;
  }
  return null;
}

/** Decimal -> American string ("+200" / "-150"); 1.00 has no American equivalent. */
export function decimalToAmerican(d: number): string {
  if (d <= 1) return '—';
  if (d >= 2) return `+${Math.round((d - 1) * 100)}`;
  return `${Math.round(-100 / (d - 1))}`;
}

export interface OddsInfo {
  decimal: number;
  /** probability 0..1 implied by the odds (1 / decimal) */
  implied: number;
  stake: number;
  payout: number;
  profit: number;
  /** second outcome of a two-way market, if given */
  otherImplied: number | null;
  /** sum of implied probabilities minus 1 (the bookmaker margin); null without the other side */
  overround: number | null;
  /** this outcome's probability after removing the margin proportionally */
  fairProb: number | null;
}

export function oddsInfo(values: Record<string, string>): OddsInfo | null {
  const format = values.oddsFormat || 'American';
  const src =
    format === 'American' ? values.americanOdds : format === 'Decimal' ? values.decimalOdds : values.fractionalOdds;
  const decimal = toDecimal(format, src);
  if (decimal === null) return null;
  const stake = values.stake !== undefined && values.stake !== '' ? Number(values.stake) : 100;
  if (!Number.isFinite(stake) || stake <= 0) return null;
  const implied = 1 / decimal;
  const otherDec = values.otherOdds?.trim() ? toDecimal(format, values.otherOdds) : null;
  const otherImplied = otherDec === null ? null : 1 / otherDec;
  const total = otherImplied === null ? null : implied + otherImplied;
  return {
    decimal,
    implied,
    stake,
    payout: stake * decimal,
    profit: stake * (decimal - 1),
    otherImplied,
    overround: total === null ? null : total - 1,
    fairProb: total === null ? null : implied / total,
  };
}
