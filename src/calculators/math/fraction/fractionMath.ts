// Pure, exact (BigInt) fraction arithmetic shared by index.ts (results + explainSteps) and FractionPanel,
// so the page never re-derives a result differently from the calculator.
import {
  Frac,
  gcdBig,
  lcmBig,
  makeFrac,
  parseIntegerStrict,
  decimalExpansion,
  formatExpansion,
  fracToFixed,
} from '../../../utils/rational';

export type FractionOp = 'add' | 'subtract' | 'multiply' | 'divide';

export interface FractionComputation {
  op: FractionOp;
  /** The two operands exactly as entered (denominators > 0, not reduced). */
  a: { n: bigint; d: bigint };
  b: { n: bigint; d: bigint };
  /** add / subtract only: least common denominator and the factors that scale each fraction onto it. */
  lcd?: bigint;
  factorA?: bigint;
  factorB?: bigint;
  adjA?: bigint;
  adjB?: bigint;
  /** Result before reduction. */
  rawN: bigint;
  rawD: bigint;
  /** GCD removed by the reduction. */
  gcd: bigint;
  result: Frac;
}

export type FractionOutcome =
  | { kind: 'incomplete' }
  | { kind: 'invalid'; message: string }
  | { kind: 'ok'; comp: FractionComputation };

const OPS: FractionOp[] = ['add', 'subtract', 'multiply', 'divide'];

export function computeFraction(values: Record<string, string>): FractionOutcome {
  const raw = [values.aNum, values.aDen, values.bNum, values.bDen];
  if (raw.some((v) => (v ?? '').trim() === '')) return { kind: 'incomplete' };
  const parsed = raw.map((v) => parseIntegerStrict(v));
  if (parsed.some((v) => v === null)) {
    return { kind: 'invalid', message: 'Numerators and denominators must be whole numbers (no decimals).' };
  }
  const [aN, aD, bN, bD] = parsed as bigint[];
  if (aD <= 0n || bD <= 0n) return { kind: 'incomplete' }; // denominators must be positive integers
  const op: FractionOp = OPS.includes(values.mode as FractionOp) ? (values.mode as FractionOp) : 'add';

  let rawN: bigint;
  let rawD: bigint;
  let extra: Partial<FractionComputation> = {};
  if (op === 'add' || op === 'subtract') {
    const lcd = lcmBig(aD, bD);
    const factorA = lcd / aD;
    const factorB = lcd / bD;
    const adjA = aN * factorA;
    const adjB = bN * factorB;
    rawN = op === 'add' ? adjA + adjB : adjA - adjB;
    rawD = lcd;
    extra = { lcd, factorA, factorB, adjA, adjB };
  } else if (op === 'multiply') {
    rawN = aN * bN;
    rawD = aD * bD;
  } else {
    if (bN === 0n) return { kind: 'invalid', message: 'Cannot divide by zero: the second fraction equals 0.' };
    rawN = aN * bD;
    rawD = aD * bN; // may be negative; makeFrac moves the sign to the numerator
  }
  const result = makeFrac(rawN, rawD);
  const gcd = rawN === 0n ? (rawD < 0n ? -rawD : rawD) : gcdBig(rawN, rawD);
  return {
    kind: 'ok',
    comp: { op, a: { n: aN, d: aD }, b: { n: bN, d: bD }, rawN, rawD, gcd, result, ...extra },
  };
}

/** "5", "-3/4" — whole numbers have no denominator. */
export const fmtFrac = (f: { n: bigint; d: bigint }): string => (f.d === 1n ? f.n.toString() : `${f.n}/${f.d}`);

/** "1 1/12" / "-2 3/4" for an improper fraction; null when the value is a proper fraction or an integer. */
export function mixedNumber(f: Frac): string | null {
  if (f.d === 1n) return null;
  const abs = f.n < 0n ? -f.n : f.n;
  if (abs < f.d) return null;
  return `${f.n < 0n ? '-' : ''}${abs / f.d} ${abs % f.d}/${f.d}`;
}

/** Decimal views of a reduced fraction: rounded (<= 8 places) and, when different, the exact expansion with its repeating block. */
export function decimalViews(f: Frac): { rounded: string; exact: string | null } {
  const rounded = fracToFixed(f, 8);
  const exact = formatExpansion(decimalExpansion(f, 200));
  return { rounded, exact: exact === rounded ? null : exact };
}

export const OP_SYMBOL: Record<FractionOp, string> = { add: '+', subtract: '−', multiply: '×', divide: '÷' };
export const OP_LABEL: Record<FractionOp, string> = {
  add: 'Addition',
  subtract: 'Subtraction',
  multiply: 'Multiplication',
  divide: 'Division',
};
