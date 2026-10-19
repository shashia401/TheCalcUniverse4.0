import { factorize, MAX_FACTOR_INPUT } from '../../../utils/numberTheory';
import { Frac, addFrac, divFrac, fracToFixed, fracToNumber, gcdBig, makeFrac, mulFrac, parseDecimalExact, subFrac } from '../../../utils/rational';

/** Fixed-point with 8 decimals, but a non-zero value below 1e-8 keeps 6 significant digits instead of printing "0". */
export function fmtF(f: Frac): string {
  if (f.n === 0n) return '0';
  const v = fracToNumber(f);
  if (Math.abs(v) < 1e-8) return Number(v.toPrecision(6)).toString();
  return fracToFixed(f, 8);
}
export function fmtN(n: number): string {
  if (n === 0 || Math.abs(n) < 1e-14) return '0';
  if (Math.abs(n) < 1e-8) return Number(n.toPrecision(6)).toString();
  return parseFloat(n.toFixed(8)).toString();
}

export type RootKind = 'two-real' | 'repeated' | 'complex';

export interface Quadratic {
  a: Frac;
  b: Frac;
  c: Frac;
  /** b² − 4ac, exact (the sign decides the root type, so it is never rounded) */
  disc: Frac;
  kind: RootKind;
  vertexX: Frac;
  vertexY: Frac;
  /** −b/a and c/a */
  sum: Frac;
  product: Frac;
  /** numeric roots: x1 = (−b + √Δ)/2a, x2 = (−b − √Δ)/2a (real); for complex: re ± im·i with im ≥ 0 */
  x1?: number;
  x2?: number;
  re?: number;
  im?: number;
  /** exact rational roots when Δ is a perfect square of a rational */
  exact?: { x1: Frac; x2: Frac };
  /** exact closed form like "(1 ± √5) / 2" for integer coefficients with an irrational / complex result */
  surd?: string;
}

export type QuadResult =
  | { kind: 'incomplete' }
  | { kind: 'linear'; message: string }
  | { kind: 'ok'; q: Quadratic };

/** floor(sqrt(n)) by integer Newton iteration: exact for any size and about log2(n) steps. (A float estimate
 *  walked to the root one step at a time is off by ~10^134 for coefficients near 1e-300 and never finishes;
 *  Number(n) is Infinity, and BigInt(Infinity) throws, past 1e308.) */
function bigSqrt(n: bigint): bigint {
  if (n < 2n) return n;
  let x = 1n << BigInt((n.toString(2).length + 1) >> 1); // 2^ceil(bits/2) >= sqrt(n), so the sequence only decreases
  for (;;) {
    const y = (x + n / x) >> 1n;
    if (y >= x) return x;
    x = y;
  }
}

/** Rational square root of a non-negative fraction when it exists. */
function ratSqrt(f: Frac): Frac | null {
  if (f.n < 0n) return null;
  const p = bigSqrt(f.n);
  const q = bigSqrt(f.d);
  return p * p === f.n && q * q === f.d ? makeFrac(p, q) : null;
}

/** D = k²·m with m square-free (needs a factorisation, so |D| must be a safe integer). */
function squareFree(d: bigint): { k: bigint; m: bigint } | null {
  if (d > BigInt(MAX_FACTOR_INPUT)) return null;
  let k = 1n;
  let m = 1n;
  for (const [p, e] of factorize(Number(d))) {
    k *= BigInt(p) ** BigInt(Math.floor(e / 2));
    if (e % 2) m *= BigInt(p);
  }
  return { k, m };
}

function surdForm(a: Frac, b: Frac, disc: Frac): string | undefined {
  if (a.d !== 1n || b.d !== 1n || disc.d !== 1n || disc.n === 0n) return undefined;
  const sf = squareFree(disc.n < 0n ? -disc.n : disc.n);
  if (!sf || (sf.m === 1n && disc.n > 0n)) return undefined; // perfect square: handled as exact rational roots
  const neg = disc.n < 0n;
  let num0 = -b.n;
  let k = sf.k;
  let den = 2n * a.n;
  const g = gcdBig(gcdBig(num0, k), den) || 1n;
  num0 /= g;
  k /= g;
  den /= g;
  if (den < 0n) {
    den = -den;
    num0 = -num0; // ± makes the sign of the radical term irrelevant
  }
  const kText = k > 1n ? `${k}` : '';
  const radical = sf.m === 1n ? `${kText}i` : `${kText}√${sf.m}${neg ? ' i' : ''}`;
  const top = num0 === 0n ? `± ${radical}` : `${num0} ± ${radical}`;
  return den === 1n ? top : `(${top}) / ${den}`;
}

/** Parse + solve ax² + bx + c = 0 exactly where it matters (discriminant sign, vertex, Vieta) and stably for the roots. */
export function solveQuadratic(as: string | undefined, bs: string | undefined, cs: string | undefined): QuadResult {
  const a = parseDecimalExact(as, 60);
  const b = parseDecimalExact(bs, 60);
  const c = parseDecimalExact(cs, 60);
  if (!a || !b || !c) return { kind: 'incomplete' };
  if (a.n === 0n) {
    return {
      kind: 'linear',
      message:
        b.n === 0n
          ? c.n === 0n
            ? 'a = b = c = 0: every x satisfies 0 = 0.'
            : `a = b = 0 leaves ${fmtF(c)} = 0, which has no solution.`
          : `a = 0, so this is a linear equation, not a quadratic: ${fmtF(b)}x + ${fmtF(c)} = 0 gives x = ${fmtF(divFrac({ n: -c.n, d: c.d }, b))}.`,
    };
  }

  const four: Frac = { n: 4n, d: 1n };
  const disc = subFrac(mulFrac(b, b), mulFrac(mulFrac(four, a), c));
  const twoA = mulFrac({ n: 2n, d: 1n }, a);
  const negB: Frac = { n: -b.n, d: b.d };
  const vertexX = divFrac(negB, twoA);
  const vertexY = divFrac({ n: -disc.n, d: disc.d }, mulFrac(four, a)); // k = −Δ/4a = c − b²/4a
  const sum = divFrac(negB, a);
  const product = divFrac(c, a);

  const q: Quadratic = { a, b, c, disc, kind: disc.n > 0n ? 'two-real' : disc.n === 0n ? 'repeated' : 'complex', vertexX, vertexY, sum, product };
  const an = fracToNumber(a);
  const bn = fracToNumber(b);
  const cn = fracToNumber(c);

  if (disc.n === 0n) {
    q.x1 = q.x2 = fracToNumber(vertexX);
    q.exact = { x1: vertexX, x2: vertexX };
  } else if (disc.n > 0n) {
    const rs = ratSqrt(disc);
    if (rs) {
      const x1 = divFrac(addFrac(negB, rs), twoA);
      const x2 = divFrac(subFrac(negB, rs), twoA);
      q.exact = { x1, x2 };
      q.x1 = fracToNumber(x1);
      q.x2 = fracToNumber(x2);
    } else {
      // Cancellation-free: q = −(b + sign(b)·√Δ)/2, roots q/a and c/q.
      const sq = Math.sqrt(fracToNumber(disc));
      const qq = -(bn + (bn < 0 ? -sq : sq)) / 2;
      const r1 = qq / an;
      const r2 = cn / qq;
      // x1 uses +√Δ in (−b ± √Δ)/2a: that is q/a when b < 0, c/q otherwise.
      if (bn < 0) {
        q.x1 = r1;
        q.x2 = r2;
      } else {
        q.x1 = r2;
        q.x2 = r1;
      }
      q.surd = surdForm(a, b, disc);
    }
  } else {
    q.re = fracToNumber(vertexX);
    q.im = Math.sqrt(-fracToNumber(disc)) / (2 * Math.abs(an));
    q.surd = surdForm(a, b, disc);
  }
  return { kind: 'ok', q };
}

const coef = (f: Frac, first: boolean): string => {
  const neg = f.n < 0n;
  const mag: Frac = neg ? { n: -f.n, d: f.d } : f;
  const isOne = mag.n === 1n && mag.d === 1n;
  return first ? `${neg ? '-' : ''}${isOne ? '' : fmtF(mag)}` : `${neg ? '-' : '+'} ${isOne ? '' : fmtF(mag)}`;
};

/** "x² - 5x + 6 = 0": unit coefficients are implied, zero terms dropped, signs spaced. */
export function equationText(q: Pick<Quadratic, 'a' | 'b' | 'c'>): string {
  let s = `${coef(q.a, true)}x²`;
  if (q.b.n !== 0n) s += ` ${coef(q.b, false)}x`;
  if (q.c.n !== 0n) {
    const neg = q.c.n < 0n;
    s += ` ${neg ? '-' : '+'} ${fmtF(neg ? { n: -q.c.n, d: q.c.d } : q.c)}`;
  }
  return `${s} = 0`;
}

/** a(x − r1)(x − r2) for real roots; exact when the roots are rational, otherwise marked approximate. */
export function factoredText(q: Quadratic): string {
  const lead = q.a.n === 1n && q.a.d === 1n ? '' : q.a.n === -1n && q.a.d === 1n ? '-' : fmtF(q.a);
  const factor = (r: string, negative: boolean) => (r === '0' ? 'x' : negative ? `(x + ${r.replace('-', '')})` : `(x − ${r})`);
  const root = (f: Frac | undefined, n: number | undefined) => {
    const text = f ? fmtF(f) : fmtN(n as number);
    return factor(text, text.startsWith('-'));
  };
  const approx = q.exact ? '' : '≈ ';
  if (q.kind === 'repeated') return `${approx}${lead}${root(q.exact?.x1, q.x1)}²`;
  return `${approx}${lead}${root(q.exact?.x1, q.x1)}${root(q.exact?.x2, q.x2)}`;
}
