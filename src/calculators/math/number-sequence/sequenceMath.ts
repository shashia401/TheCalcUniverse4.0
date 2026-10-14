import { Frac, addFrac, decimalExpansion, formatExpansion, fracToNumber, fracToString, makeFrac, mulFrac, parseDecimalExact, subFrac } from '../../../utils/rational';

export const SEQ_MAX_TERMS = 100;
export const SEQ_MAX_NEXT = 20;

export type SeqType = 'Arithmetic' | 'Geometric' | 'Fibonacci' | 'Unknown';

export interface SeqAnalysis {
  type: SeqType;
  terms: Frac[];
  next: Frac[];
  d?: Frac;
  r?: Frac;
  formula: string;
  steps: string[];
}

export type SeqParse = { kind: 'incomplete' } | { kind: 'invalid'; message: string } | { kind: 'ok'; analysis: SeqAnalysis };

const eq = (a: Frac, b: Frac) => a.n === b.n && a.d === b.d;
const ONE: Frac = { n: 1n, d: 1n };
const isZero = (a: Frac) => a.n === 0n;
const neg = (a: Frac): Frac => ({ n: -a.n, d: a.d });

/** Exact display: decimals when they terminate (1/8 -> 0.125), otherwise the fraction (1/3), never a rounded float. */
export function fmtTerm(f: Frac): string {
  if (f.d === 1n) return f.n.toString();
  const e = decimalExpansion(f, 30);
  return e.repeating || e.truncated ? fracToString(f) : formatExpansion(e);
}
const paren = (f: Frac) => (f.n < 0n || f.d !== 1n ? `(${fmtTerm(f)})` : fmtTerm(f));

/** "2n", "n + 4", "-3n + 13", "5" for d·n + k (the old string builder printed "2n+" and "n+-1"). */
export function linearForm(d: Frac, k: Frac): string {
  const parts: string[] = [];
  if (!isZero(d)) {
    const mag = d.n < 0n ? neg(d) : d;
    const coef = eq(mag, ONE) ? '' : fmtTerm(mag);
    parts.push(`${d.n < 0n ? '-' : ''}${coef}n`);
  }
  if (!isZero(k) || parts.length === 0) {
    const mag = k.n < 0n ? neg(k) : k;
    parts.push(parts.length === 0 ? `${k.n < 0n ? '-' : ''}${fmtTerm(mag)}` : `${k.n < 0n ? '-' : '+'} ${fmtTerm(mag)}`);
  }
  return parts.join(' ');
}

export function parseSequence(raw: string | undefined, nextCountRaw: string | undefined): SeqParse {
  const tokens = (raw ?? '').split(/[,;\s]+/).filter(Boolean);
  if (tokens.length < 2) return { kind: 'incomplete' };
  if (tokens.length > SEQ_MAX_TERMS) return { kind: 'invalid', message: `Enter at most ${SEQ_MAX_TERMS} terms.` };
  const terms: Frac[] = [];
  for (const t of tokens) {
    const f = parseDecimalExact(t, 40);
    if (!f) return { kind: 'invalid', message: `"${t.slice(0, 20)}" is not a number.` };
    terms.push(f);
  }
  const m = (nextCountRaw ?? '').trim();
  const count = /^\d+$/.test(m) ? Math.min(Math.max(Number(m), 1), SEQ_MAX_NEXT) : 5;
  return { kind: 'ok', analysis: analyzeSequence(terms, count) };
}

export function analyzeSequence(terms: Frac[], count: number): SeqAnalysis {
  const n = terms.length;
  if (n < 3) {
    return { type: 'Unknown', terms, next: [], formula: 'Need at least 3 terms to identify a sequence pattern.', steps: ['Need at least 3 terms to determine the sequence type.'] };
  }

  const d = subFrac(terms[1], terms[0]);
  if (terms.every((t, i) => i === 0 || eq(subFrac(t, terms[i - 1]), d))) {
    const next: Frac[] = [];
    let last = terms[n - 1];
    for (let i = 0; i < count; i++) {
      last = addFrac(last, d);
      next.push(last);
    }
    const a1 = terms[0];
    const dSigned = d.n < 0n ? `− ${fmtTerm(neg(d))}` : `+ ${fmtTerm(d)}`;
    return {
      type: 'Arithmetic',
      terms,
      next,
      d,
      formula: `a(n) = ${fmtTerm(a1)} ${dSigned}(n − 1) = ${linearForm(d, subFrac(a1, d))}`,
      steps: [
        `Common difference d = ${fmtTerm(terms[1])} − ${paren(terms[0])} = ${fmtTerm(d)}`,
        `Verified: all consecutive differences equal ${fmtTerm(d)}.`,
        `nth-term formula: a(n) = ${fmtTerm(a1)} + (n − 1) × ${paren(d)}`,
      ],
    };
  }

  if (!isZero(terms[0])) {
    const r = makeFrac(terms[1].n * terms[0].d, terms[1].d * terms[0].n);
    if (!isZero(r) && terms.every((t, i) => i === 0 || eq(t, mulFrac(terms[i - 1], r)))) {
      const next: Frac[] = [];
      let last = terms[n - 1];
      for (let i = 0; i < count; i++) {
        last = mulFrac(last, r);
        next.push(last);
      }
      return {
        type: 'Geometric',
        terms,
        next,
        r,
        formula: `a(n) = ${fmtTerm(terms[0])} × ${paren(r)}^(n − 1)`,
        steps: [
          `Common ratio r = ${fmtTerm(terms[1])} ÷ ${paren(terms[0])} = ${fmtTerm(r)}`,
          `Verified: all consecutive ratios equal ${fmtTerm(r)}.`,
          `nth-term formula: a(n) = ${fmtTerm(terms[0])} × ${paren(r)}^(n − 1)`,
        ],
      };
    }
  }

  // Fibonacci-type (each term is the sum of the previous two); 4 terms are needed to confirm it.
  if (n >= 4 && terms.every((t, i) => i < 2 || eq(t, addFrac(terms[i - 1], terms[i - 2])))) {
    const next: Frac[] = [];
    let a = terms[n - 2];
    let b = terms[n - 1];
    for (let i = 0; i < count; i++) {
      const c = addFrac(a, b);
      next.push(c);
      a = b;
      b = c;
    }
    return {
      type: 'Fibonacci',
      terms,
      next,
      formula: `F(n) = F(n-1) + F(n-2), where F(1) = ${fmtTerm(terms[0])}, F(2) = ${fmtTerm(terms[1])}`,
      steps: [
        'Checking differences: each term is the sum of the two preceding terms.',
        `${fmtTerm(terms[n - 2])} + ${fmtTerm(terms[n - 3])} = ${fmtTerm(terms[n - 1])}, confirming Fibonacci pattern.`,
      ],
    };
  }

  return {
    type: 'Unknown',
    terms,
    next: [],
    formula: 'The sequence does not follow a simple arithmetic, geometric, or Fibonacci pattern.',
    steps: ['No consistent arithmetic difference, geometric ratio, or Fibonacci pattern detected.'],
  };
}

export const termsToNumbers = (fs: Frac[]): number[] => fs.map(fracToNumber);
