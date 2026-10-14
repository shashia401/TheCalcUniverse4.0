import { Frac, parseDecimalExact } from '../../../utils/rational';

export type RoundMethod = 'half-up' | 'half-even' | 'ceil' | 'floor' | 'trunc';
export const METHODS: RoundMethod[] = ['half-up', 'half-even', 'ceil', 'floor', 'trunc'];

/** exponent k of the rounding unit 10^k for each named place */
export const PLACE_EXPONENT: Record<string, number> = {
  million: 6,
  thousand: 3,
  hundred: 2,
  ten: 1,
  unit: 0,
  tenth: -1,
  hundredth: -2,
  thousandth: -3,
  'ten-thousandth': -4,
};

export const PLACE_LABEL: Record<string, string> = {
  million: 'million',
  thousand: 'thousand',
  hundred: 'hundred',
  ten: 'ten',
  unit: 'unit',
  tenth: 'tenth',
  hundredth: 'hundredth',
  thousandth: 'thousandth',
  'ten-thousandth': 'ten-thousandth',
  sig: 'significant figure',
};

export const SIG_MAX = 30;

const abs = (a: bigint) => (a < 0n ? -a : a);
/** floor(n / d) for d > 0 (BigInt division truncates toward zero) */
const floorDiv = (n: bigint, d: bigint) => (n / d) - (n % d !== 0n && n < 0n ? 1n : 0n);

/** m × 10^k as a plain decimal string. keepZeros keeps trailing decimals ("1.20" for 3 significant figures). */
export function fmtScaled(m: bigint, k: number, keepZeros = false): string {
  if (m === 0n) return keepZeros && k < 0 ? `0.${'0'.repeat(-k)}` : '0';
  const sign = m < 0n ? '-' : '';
  const digits = abs(m).toString();
  if (k >= 0) return sign + digits + '0'.repeat(k);
  const places = -k;
  const padded = digits.padStart(places + 1, '0');
  const int = padded.slice(0, padded.length - places);
  let frac = padded.slice(padded.length - places);
  if (!keepZeros) frac = frac.replace(/0+$/, '');
  return sign + int + (frac ? `.${frac}` : '');
}

export interface RoundingOutcome {
  /** the input as an exact decimal string */
  original: string;
  rounded: string;
  lower: string;
  upper: string;
  /** numeric positions for drawing the number line only */
  lowerNum: number;
  upperNum: number;
  originalNum: number;
  roundedNum: number;
  direction: 'up' | 'down' | 'exact';
  /** first discarded digit (0-9) */
  dropDigit: number;
  /** the value sits exactly halfway between lower and upper */
  tie: boolean;
  method: RoundMethod;
  /** unit exponent: results are multiples of 10^exp */
  exp: number;
  placeLabel: string;
  explanation: string;
}

export type RoundingResult = { kind: 'incomplete' } | { kind: 'error'; message: string } | { kind: 'ok'; r: RoundingOutcome };

function decimalExponent(x: Frac): number {
  // floor(log10 |x|) from the integer parts (exact): digits(n) - digits(d) or one less.
  const n = abs(x.n);
  const d = x.d;
  let e = n.toString().length - d.toString().length;
  // 10^e * d <= n  <=>  |x| >= 10^e
  const ge = e >= 0 ? n >= d * 10n ** BigInt(e) : n * 10n ** BigInt(-e) >= d;
  if (!ge) e -= 1;
  return e;
}

/**
 * Exact decimal rounding. The old Math.round(x / 0.01) * 0.01 turned 1.005 into 1 (1.005 / 0.01 = 100.49999999999999),
 * printed 3 × 0.1 as 0.30000000000000004 and sent -3.5 to -3 although the page documents -3.5 → -4.
 */
export function roundExact(numberRaw: string | undefined, place: string, method: RoundMethod, sigRaw?: string): RoundingResult {
  const x = parseDecimalExact(numberRaw, 100);
  if (!x) return { kind: 'incomplete' };
  if (!METHODS.includes(method)) method = 'half-up';

  let exp: number;
  let sig = false;
  if (place === 'sig') {
    sig = true;
    const s = Number((sigRaw ?? '').trim());
    if (!Number.isInteger(s) || s < 1 || s > SIG_MAX) {
      if ((sigRaw ?? '').trim() === '') return { kind: 'incomplete' };
      return { kind: 'error', message: `Significant figures must be a whole number from 1 to ${SIG_MAX}.` };
    }
    exp = x.n === 0n ? -(s - 1) : decimalExponent(x) - s + 1;
  } else {
    exp = PLACE_EXPONENT[place] ?? 0;
  }

  // scaled value s = x / 10^exp = sn / sd
  const sn = exp >= 0 ? x.n : x.n * 10n ** BigInt(-exp);
  const sd = exp >= 0 ? x.d * 10n ** BigInt(exp) : x.d;
  const lowerN = floorDiv(sn, sd);
  const remN = sn - lowerN * sd; // 0 <= remN < sd, fraction = remN / sd
  const exact = remN === 0n;
  const cmpHalf = exact ? -1 : 2n * remN < sd ? -1 : 2n * remN > sd ? 1 : 0; // -1 below, 0 tie, 1 above
  const tie = cmpHalf === 0;

  let pick: bigint;
  if (exact) pick = lowerN;
  else if (method === 'floor') pick = lowerN;
  else if (method === 'ceil') pick = lowerN + 1n;
  else if (method === 'trunc') pick = sn < 0n ? lowerN + 1n : lowerN;
  else if (cmpHalf < 0) pick = lowerN;
  else if (cmpHalf > 0) pick = lowerN + 1n;
  else if (method === 'half-even') pick = lowerN % 2n === 0n ? lowerN : lowerN + 1n;
  else pick = sn > 0n ? lowerN + 1n : lowerN; // half away from zero

  const keep = sig; // sig-fig results keep their trailing zeros ("1.20")
  // 9.99 to 2 significant figures is 10, not "10.0": a carry into a new digit drops one trailing zero.
  let outPick = pick;
  let outExp = exp;
  if (sig && abs(outPick) >= 10n ** BigInt(Number((sigRaw ?? '').trim()))) {
    outPick /= 10n;
    outExp += 1;
  }
  const f = (m: bigint) => fmtScaled(m, exp, keep);
  const toNum = (m: bigint) => Number(m) * Math.pow(10, exp);
  const direction = exact ? 'exact' : pick > lowerN ? 'up' : 'down';

  // first discarded digit of |x| at this place
  const absRem = abs(sn) % sd;
  const dropDigit = Number((absRem * 10n) / sd);
  const placeLabel = sig ? `${(sigRaw ?? '').trim()} significant figure${(sigRaw ?? '').trim() === '1' ? '' : 's'}` : `nearest ${PLACE_LABEL[place] ?? 'unit'}`;
  const original = toPlain(x);

  const roundedStr = fmtScaled(outPick, outExp, keep);
  let explanation: string;
  if (exact) {
    explanation = `${original} already has no digits beyond the ${placeLabel}, so it stays ${roundedStr}.`;
  } else if (method === 'half-up' || method === 'half-even') {
    const mid = fmtMid(lowerN, exp, keep);
    explanation = tie
      ? `${original} is exactly halfway between ${f(lowerN)} and ${f(lowerN + 1n)} (the first dropped digit is 5 followed by zeros), so ${method === 'half-up' ? 'half away from zero' : 'half to even'} gives ${roundedStr}.`
      : `The first dropped digit is ${dropDigit}, ${cmpHalf < 0 ? 'less than 5, so the value is below the midpoint' : '5 or greater, so the value is above the midpoint'} ${mid}: it rounds to ${roundedStr}.`;
  } else {
    explanation = `${method === 'floor' ? 'Always rounding down (toward −∞)' : method === 'ceil' ? 'Always rounding up (toward +∞)' : 'Truncating (toward zero)'} gives ${roundedStr}.`;
  }

  return {
    kind: 'ok',
    r: {
      original,
      rounded: roundedStr,
      lower: f(lowerN),
      upper: f(lowerN + 1n),
      lowerNum: toNum(lowerN),
      upperNum: toNum(lowerN + 1n),
      originalNum: Number(x.n) / Number(x.d),
      roundedNum: toNum(pick),
      direction,
      dropDigit,
      tie,
      method,
      exp,
      placeLabel,
      explanation,
    },
  };
}

/** midpoint label between lowerN and lowerN + 1 at exponent exp, e.g. "75" or "3.75". */
function fmtMid(lowerN: bigint, exp: number, keep: boolean): string {
  // (2·lowerN + 1) × 10^exp / 2  ->  scale one more decimal and multiply by 5
  return fmtScaled((2n * lowerN + 1n) * 5n, exp - 1, keep);
}

/** Exact decimal string for a Frac that comes from a decimal literal (denominator 2^a·5^b). */
function toPlain(x: Frac): string {
  let d = x.d;
  let k = 0;
  while (d > 1n && d % 10n === 0n) {
    d /= 10n;
    k++;
  }
  // d is now of the form 2^a 5^b with a, b not both positive; scale to a power of ten
  let m = x.n;
  let scale = 0;
  while (d > 1n) {
    if (d % 2n === 0n) {
      d /= 2n;
      m *= 5n;
    } else {
      d /= 5n;
      m *= 2n;
    }
    scale++;
  }
  return fmtScaled(m, -(k + scale));
}
