import { Frac, divFrac, fracToFixed, makeFrac, mulFrac, parseDecimalExact } from '../../../utils/rational';

export type Slot = 'a' | 'b' | 'c' | 'd';
export type SlotValue = Frac | null | 'bad';

/** Blank or "?" means "solve for this one"; anything that is not a decimal literal is 'bad' (parseFloat took "3abc" as 3). */
export function parseSlot(raw: string | undefined): SlotValue {
  const s = (raw ?? '').trim();
  if (!s || s === '?') return null;
  return parseDecimalExact(s, 60) ?? 'bad';
}

/** 8 decimals, trailing zeros trimmed, exact rounding of the true rational (no float drift). */
export const fmtExact = (f: Frac): string => fracToFixed(f, 8);

export interface FullProportion {
  a: Frac;
  b: Frac;
  c: Frac;
  d: Frac;
}

export type ProportionOutcome =
  | { kind: 'incomplete' }
  | { kind: 'error'; message: string }
  | { kind: 'solved'; missing: Slot; value: Frac; full: FullProportion; step: string; equal: true }
  | { kind: 'check'; full: FullProportion; equal: boolean };

const isPositive = (f: Frac) => f.n > 0n;

/**
 * a/b = c/d. With exactly one slot empty it is solved by cross-multiplication; with all four filled it is checked
 * exactly (a·d === b·c) instead of the old |a/b − c/d| < 0.0001 test, which called 1/3 = 0.33333/1 equal.
 * All values must be positive (documented behaviour).
 */
export function solveProportion(slots: Record<Slot, SlotValue>): ProportionOutcome {
  const keys: Slot[] = ['a', 'b', 'c', 'd'];
  if (keys.some((k) => slots[k] === 'bad')) return { kind: 'incomplete' };
  const known = keys.filter((k) => slots[k] !== null);
  if (known.length < 3) return { kind: 'incomplete' };
  if (known.some((k) => !isPositive(slots[k] as Frac))) return { kind: 'error', message: 'All values in a proportion must be positive numbers.' };

  if (known.length === 4) {
    const full = slots as unknown as FullProportion;
    return { kind: 'check', full, equal: full.a.n * full.b.d * full.d.n * full.c.d === full.b.n * full.a.d * full.c.n * full.d.d };
  }

  const missing = keys.find((k) => slots[k] === null) as Slot;
  const v = (k: Slot) => slots[k] as Frac;
  // a/b = c/d  =>  a·d = b·c
  let value: Frac;
  let step: string;
  const f = fmtExact;
  switch (missing) {
    case 'a':
      value = divFrac(mulFrac(v('b'), v('c')), v('d'));
      step = `a = (${f(v('b'))} × ${f(v('c'))}) / ${f(v('d'))} = ${f(value)}`;
      break;
    case 'b':
      value = divFrac(mulFrac(v('a'), v('d')), v('c'));
      step = `b = (${f(v('a'))} × ${f(v('d'))}) / ${f(v('c'))} = ${f(value)}`;
      break;
    case 'c':
      value = divFrac(mulFrac(v('a'), v('d')), v('b'));
      step = `c = (${f(v('a'))} × ${f(v('d'))}) / ${f(v('b'))} = ${f(value)}`;
      break;
    default:
      value = divFrac(mulFrac(v('b'), v('c')), v('a'));
      step = `d = (${f(v('b'))} × ${f(v('c'))}) / ${f(v('a'))} = ${f(value)}`;
  }
  const full = { a: v('a') ?? value, b: v('b') ?? value, c: v('c') ?? value, d: v('d') ?? value } as FullProportion;
  (full as unknown as Record<Slot, Frac>)[missing] = value;
  return { kind: 'solved', missing, value, full, step, equal: true };
}

/** a/b as a fraction in lowest terms and as a percentage text, for the "Fraction"/"Percentage" rows. */
export const ratioOf = (x: Frac, y: Frac): Frac => makeFrac(x.n * y.d, x.d * y.n);
