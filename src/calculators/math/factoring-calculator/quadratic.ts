// Exact quadratic factoring shared by index.ts and FactoringPanel.
// Coefficients are read as exact decimals and scaled to integers, so "does it factor over the integers"
// is decided with BigInt arithmetic (no floating-point tolerance), and rational roots are exact fractions.
import {
  Frac,
  fracToFixed,
  fracToNumber,
  gcdBig,
  isqrt,
  lcmBig,
  makeFrac,
  parseDecimalExact,
} from '../../../utils/rational';

export type QuadraticKind = 'rational' | 'irrational' | 'complex';

export interface QuadraticAnalysis {
  kind: QuadraticKind;
  /** The coefficients as numbers (for charts only; every decision below uses exact BigInt). */
  a: number;
  b: number;
  c: number;
  original: string;
  discriminant: string;
  discriminantSign: -1 | 0 | 1;
  factored: string;
  /** Real roots, ascending (rational / irrational), as numbers; empty for complex. */
  roots: number[];
  /** Text of each real root ("-0.5", "-3", "1/3"). */
  rootTexts: string[];
  /** Combined roots line: "x = 2, x = 3" or "x = -1 ± 2i". */
  rootsLine: string;
  steps: string[];
}

const MINUS = '−';
const abs = (n: bigint): bigint => (n < 0n ? -n : n);

/** One signed term of a polynomial: term(-5n, 'x') -> " − 5x", term(1n, 'x', true) -> "x". */
function term(v: bigint, suffix: string, first = false): string {
  const mag = abs(v);
  const body = suffix && mag === 1n ? '' : mag.toString();
  const sign = first ? (v < 0n ? '-' : '') : v < 0n ? ` ${MINUS} ` : ' + ';
  return `${sign}${body}${suffix}`;
}

/** "x² − 5x + 6" from exact (possibly fractional) coefficients; zero terms are omitted. */
function poly(a: Frac, b: Frac, c: Frac): string {
  const t = (f: Frac, suffix: string, first: boolean): string => {
    if (f.n === 0n) return '';
    const mag = fracToFixed(f.n < 0n ? { n: -f.n, d: f.d } : f, 6);
    const body = suffix && mag === '1' ? '' : mag;
    const sign = first ? (f.n < 0n ? '-' : '') : f.n < 0n ? ` ${MINUS} ` : ' + ';
    return `${sign}${body}${suffix}`;
  };
  let s = t(a, 'x²', true);
  s += t(b, 'x', s === '');
  s += t(c, '', s === '');
  return s || '0';
}

/** The linear binomial px + q, e.g. lin(2n, -3n) -> "2x − 3", lin(1n, 0n) -> "x". */
const lin = (p: bigint, q: bigint): string => `${term(p, 'x', true)}${q === 0n ? '' : term(q, '')}`;

/** Root as text: integer, short terminating decimal, or the exact fraction. */
function rootText(f: Frac): string {
  if (f.d === 1n) return f.n.toString();
  let d = f.d;
  let twos = 0;
  let fives = 0;
  while (d % 2n === 0n) { d /= 2n; twos++; }
  while (d % 5n === 0n) { d /= 5n; fives++; }
  if (d === 1n && Math.max(twos, fives) <= 6) return fracToFixed(f, 6);
  return `${f.n}/${f.d}`;
}

const numText = (n: number): string => {
  const v = parseFloat(n.toFixed(6));
  return (Object.is(v, -0) ? 0 : v).toString();
};

export function analyzeQuadratic(values: Record<string, string>): QuadraticAnalysis | null {
  const fa = parseDecimalExact(values.a, 60);
  const fb = parseDecimalExact(values.b, 60);
  const fc = parseDecimalExact(values.c, 60);
  if (!fa || !fb || !fc || fa.n === 0n) return null;

  // Scale to integers: polynomial = (A x² + B x + C) / D
  const D = lcmBig(lcmBig(fa.d, fb.d), fc.d);
  const A = (fa.n * D) / fa.d;
  const B = (fb.n * D) / fb.d;
  const C = (fc.n * D) / fc.d;

  const original = poly(fa, fb, fc);
  const discExact = makeFrac(B * B - 4n * A * C, D * D); // b² − 4ac of the polynomial as entered
  const discriminant = fracToFixed(discExact, 6);
  const discriminantSign: -1 | 0 | 1 = discExact.n < 0n ? -1 : discExact.n === 0n ? 0 : 1;
  const a = fracToNumber(fa);
  const b = fracToNumber(fb);
  const c = fracToNumber(fc);

  // Primitive integer form: polynomial = m * (a1 x² + b1 x + c1) with a1 > 0 and gcd(a1, b1, c1) = 1
  const content = (A < 0n ? -1n : 1n) * gcdBig(gcdBig(A, B), C);
  const a1 = A / content;
  const b1 = B / content;
  const c1 = C / content;
  const m = makeFrac(content, D);
  const disc1 = b1 * b1 - 4n * a1 * c1;
  const mIsOne = m.n === 1n && m.d === 1n;
  const mLead = mIsOne ? '' : m.d === 1n && m.n === -1n ? '-' : m.d === 1n ? `${m.n}` : `(${m.n}/${m.d})`;

  const steps: string[] = [];
  const fmtNum = (f: Frac) => fracToFixed(f, 6);
  let stepNo = 0;
  const step = (text: string) => steps.push(`Step ${++stepNo}: ${text}`);
  step(`Identify coefficients — a = ${fmtNum(fa)}, b = ${fmtNum(fb)}, c = ${fmtNum(fc)}`);

  if (disc1 >= 0n) {
    const s = isqrt(disc1);
    if (s * s === disc1) {
      // ---- rational roots: the polynomial factors over the integers (Gauss's lemma) ----
      const p = (b1 - s) / 2n; // p + q = b1 and p * q = a1 * c1  (s and b1 have the same parity)
      const q = (b1 + s) / 2n;
      const prim = poly({ n: a1, d: 1n }, { n: b1, d: 1n }, { n: c1, d: 1n });
      if (!mIsOne) {
        step(`Factor out the common factor ${m.d === 1n ? m.n : `${m.n}/${m.d}`} (the GCF, signed so the x² coefficient inside is positive): ${original} = ${mLead}(${prim})`);
      }
      step(`Multiply a × c = ${a1} × ${c1} = ${a1 * c1}`);
      step(`Find two numbers p and q such that p + q = b = ${b1} and p × q = a × c = ${a1 * c1}`);
      steps.push(`  p = ${p}, q = ${q} (since ${p} + ${q} = ${p + q} and ${p} × ${q} = ${p * q})`);

      let factors: string;
      if (c1 === 0n) {
        step(`c = 0, so x is a common factor: ${prim} = ${b1 === 0n ? 'x · x' : `x(${lin(a1, b1)})`}`);
        factors = b1 === 0n ? 'x²' : `x(${lin(a1, b1)})`;
      } else {
        step(`Rewrite the middle term: ${prim} = ${term(a1, 'x²', true)}${term(p, 'x')}${term(q, 'x')}${term(c1, '')}`);
        const g1 = gcdBig(a1, p);
        const bin = lin(a1 / g1, p / g1);
        const g2raw = gcdBig(q, c1);
        const g2 = q / g2raw === a1 / g1 && c1 / g2raw === p / g1 ? g2raw : -g2raw; // sign that makes group 2's binomial equal group 1's
        step(`Group the terms — (${term(a1, 'x²', true)}${term(p, 'x')}) + (${term(q, 'x', true)}${term(c1, '')})`);
        steps.push('  Factor out the GCF from each group:');
        steps.push(`    Group 1: ${term(g1, 'x', true)}(${bin})`);
        steps.push(`    Group 2: ${g2 === 1n ? '' : g2 === -1n ? '-' : g2}(${bin})`);
        const f1 = `(${lin(g1, g2)})`;
        const f2 = `(${bin})`;
        step(`Factor out the common binomial — ${f1}${f2}`);
        factors = f1 === f2 ? `${f1}²` : `${f1}${f2}`;
        steps.push(`  Final factored form: ${mLead}${factors}`);
      }
      const factored = `${mLead}${factors}`;

      const rs = [makeFrac(-b1 - s, 2n * a1), makeFrac(-b1 + s, 2n * a1)].sort((x, y) => (x.n * y.d < y.n * x.d ? -1 : 1));
      const texts = rs.map(rootText);
      steps.push(`  Roots: x = ${texts[0]}, x = ${texts[1]}${s === 0n ? ' (a repeated root)' : ''}`);
      return {
        kind: 'rational', a, b, c, original, discriminant, discriminantSign, factored,
        roots: rs.map(fracToNumber), rootTexts: texts, rootsLine: `x = ${texts[0]}, x = ${texts[1]}`, steps,
      };
    }

    // ---- real irrational roots ----
    // Stable form of the quadratic formula (no cancellation when b² >> 4ac): q = -(b + sign(b)√Δ)/2, x1 = q/a, x2 = c/q
    const sq = Math.sqrt(Number(disc1));
    const bN = Number(b1);
    const qq = -0.5 * (bN + (bN >= 0 ? sq : -sq));
    const [lo, hi] = [qq / Number(a1), Number(c1) / qq].sort((x, y) => x - y);
    step(`No integer pair p, q with p + q = b and p × q = a × c exists (Δ = ${discriminant} is not a perfect square), so the polynomial does not factor over the rationals — use the quadratic formula`);
    steps.push('  x = (−b ± √(b² − 4ac)) / (2a)');
    steps.push(`  x = (−(${fmtNum(fb)}) ± √(${discriminant})) / (2 × ${fmtNum(fa)})`);
    steps.push(`  x₁ = ${numText(lo)}, x₂ = ${numText(hi)} (irrational, rounded to 6 decimals)`);
    step('Write the factored form using the roots');
    const lead = fmtNum(fa);
    const sgn = (r: number) => `x ${r < 0 ? '+' : MINUS} ${numText(Math.abs(r))}`;
    const f = `${lead === '1' ? '' : lead === '-1' ? '-' : lead}(${sgn(lo)})(${sgn(hi)})`;
    steps.push(`  ${f}`);
    return {
      kind: 'irrational', a, b, c, original, discriminant, discriminantSign, factored: `${f} (roots rounded)`,
      roots: [lo, hi], rootTexts: [numText(lo), numText(hi)], rootsLine: `x = ${numText(lo)}, x = ${numText(hi)}`, steps,
    };
  }

  // ---- complex roots ----
  const re = -Number(b1) / (2 * Number(a1));
  const im = Math.sqrt(Number(-disc1)) / (2 * Number(a1));
  step('The discriminant is negative — roots are complex');
  steps.push('  x = (−b ± √(b² − 4ac)) / (2a)');
  steps.push(`  x = (−(${fmtNum(fb)}) ± √(${discriminant})) / (2 × ${fmtNum(fa)})`);
  steps.push('  The square root of a negative number involves the imaginary unit i');
  steps.push(`  x₁ = ${numText(re)} + ${numText(im)}i`);
  steps.push(`  x₂ = ${numText(re)} ${MINUS} ${numText(im)}i`);
  return {
    kind: 'complex', a, b, c, original, discriminant, discriminantSign, factored: 'Does not factor over the reals (complex roots)',
    roots: [], rootTexts: [], rootsLine: `x = ${numText(re)} ± ${numText(im)}i`, steps,
  };
}
