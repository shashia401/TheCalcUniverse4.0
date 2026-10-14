import Decimal from 'decimal.js';

// Private Decimal constructor: exact decimal arithmetic (20% of 0.07 is 0.014, not 0.014000000000000002)
// without touching the global Decimal config other calculators share.
const D = Decimal.clone({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

export type PctMode = 'percentOf' | 'whatPercent' | 'pctChange' | 'addPct' | 'subPct';

/** Up to 4 decimals, trailing zeros trimmed, plain notation (the old toFixed(2) turned 0.015 into 0.02 and 0.004 into 0). */
export const fmtPct = (n: Decimal): string => {
  const s = n.toDecimalPlaces(4).toFixed();
  return s === '-0' ? '0' : s;
};

export function parsePctInput(s: string | undefined): Decimal | null {
  const t = (s ?? '').trim();
  if (!/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(t)) return null;
  try {
    const d = new D(t);
    return d.isFinite() && Math.abs(d.e) <= 100 ? d : null;
  } catch {
    return null;
  }
}

export type PctCalc =
  | { kind: 'incomplete' }
  | { kind: 'zero-whole' }
  | { kind: 'zero-base' }
  | { kind: 'ok'; mode: PctMode; x: Decimal; y: Decimal; result: Decimal; extra: Decimal; ratio: Decimal; changeDirection?: 'increase' | 'decrease' | 'none' };

/**
 * All five modes in one place (calculate, explainSteps and the panel used to each redo the arithmetic in floats).
 *  percentOf   : result = x/100 · y
 *  whatPercent : result = x / y · 100           (ratio = x / y)
 *  pctChange   : result = (y − x) / |x| · 100   (divide by |x| so a rise from −50 to −25 reads as an increase)
 *  addPct      : result = y · (1 + x/100)       (extra = the added amount)
 *  subPct      : result = y · (1 − x/100)       (extra = the removed amount)
 */
export function computePercentage(modeRaw: string | undefined, xs: string | undefined, ys: string | undefined): PctCalc {
  const mode = (modeRaw || 'percentOf') as PctMode;
  const x = parsePctInput(xs);
  const y = parsePctInput(ys);
  if (!x || !y) return { kind: 'incomplete' };
  switch (mode) {
    case 'percentOf': {
      const ratio = x.div(100);
      return { kind: 'ok', mode, x, y, ratio, result: ratio.times(y), extra: ratio.times(y) };
    }
    case 'whatPercent': {
      if (y.isZero()) return { kind: 'zero-whole' };
      const ratio = x.div(y);
      return { kind: 'ok', mode, x, y, ratio, result: ratio.times(100), extra: ratio };
    }
    case 'pctChange': {
      if (x.isZero()) return { kind: 'zero-base' };
      const diff = y.minus(x);
      const ratio = diff.div(x.abs());
      return { kind: 'ok', mode, x, y, ratio, result: ratio.times(100), extra: diff.abs(), changeDirection: diff.isZero() ? 'none' : diff.isPositive() ? 'increase' : 'decrease' };
    }
    case 'addPct': {
      const amount = x.div(100).times(y);
      return { kind: 'ok', mode, x, y, ratio: new D(1).plus(x.div(100)), result: y.plus(amount), extra: amount };
    }
    case 'subPct': {
      const amount = x.div(100).times(y);
      return { kind: 'ok', mode, x, y, ratio: new D(1).minus(x.div(100)), result: y.minus(amount), extra: amount };
    }
    default:
      return { kind: 'incomplete' };
  }
}
