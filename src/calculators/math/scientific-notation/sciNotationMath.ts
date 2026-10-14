// Scientific notation by digit-string manipulation, so every digit the user typed survives (the old
// Math.log10 / Math.pow route rounded the coefficient to 7 digits and printed "10 × 10^2" for 99999999).

export const MAX_EXP = 9999;
export const MAX_PLAIN_LEN = 200;

export interface ParsedDecimal {
  negative: boolean;
  /** significant digits, no leading zeros ("45" for 0.0045); '0' for zero */
  digits: string;
  /** value = 0.d1d2d3... × 10^pointExp is awkward; we store the base-10 exponent of the first digit instead */
  exponent: number;
  /** significant-figure count under the usual convention (trailing zeros count only when a decimal point is written) */
  sigFigs: number;
  isZero: boolean;
}

/** Plain decimal ("0.0045", "-1,234.50", "4.5e-3", "+.5E2") -> digits and exponent. null if not a number. */
export function parseDecimalString(raw: string | undefined): ParsedDecimal | null {
  const t = (raw ?? '').trim().replace(/,/g, '').replace(/\s+/g, '');
  const m = /^([+-]?)(\d*)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/.exec(t);
  if (!m) return null;
  const [, sign, intPart, fracPart = '', expPart] = m;
  if (intPart === '' && fracPart === '') return null;
  if (intPart.length + fracPart.length > 1000) return null;
  const e0 = expPart === undefined ? 0 : Number(expPart);
  if (!Number.isInteger(e0) || Math.abs(e0) > MAX_EXP) return null;

  const all = intPart + fracPart;
  const first = all.search(/[1-9]/);
  if (first === -1) return { negative: sign === '-', digits: '0', exponent: 0, sigFigs: 1, isZero: true };
  // position of the decimal point relative to the start of `all`, after applying e0
  const pointPos = intPart.length + e0;
  const exponent = pointPos - first - 1;
  let digits = all.slice(first);
  // Trailing zeros are significant only when the mantissa is written with a decimal point ("450." and "4.500" yes, "4500" no).
  const hasPoint = t.replace(/[eE].*$/, '').includes('.');
  const sig = hasPoint ? digits.length : digits.replace(/0+$/, '').length || 1;
  digits = digits.replace(/0+$/, '') || '0';
  return { negative: sign === '-', digits, exponent, sigFigs: sig, isZero: false };
}

export interface SciResult {
  coefficient: string; // "-4.5"
  exponent: number;
  moves: number;
  direction: 'left' | 'right' | 'none';
  sci: string; // "4.5 × 10^-3"
  eNotation: string; // "4.5e-3"
  sigFigs: number;
  original: string;
  negative: boolean;
}

export function toScientific(raw: string | undefined): SciResult | null {
  const p = parseDecimalString(raw);
  if (!p) return null;
  const original = (raw ?? '').trim();
  if (p.isZero) {
    return { coefficient: '0', exponent: 0, moves: 0, direction: 'none', sci: '0 × 10^0', eNotation: '0e0', sigFigs: 1, original, negative: false };
  }
  const coefficient = `${p.negative ? '-' : ''}${p.digits[0]}${p.digits.length > 1 ? `.${p.digits.slice(1)}` : ''}`;
  return {
    coefficient,
    exponent: p.exponent,
    moves: Math.abs(p.exponent),
    direction: p.exponent === 0 ? 'none' : p.exponent > 0 ? 'left' : 'right',
    sci: `${coefficient} × 10^${p.exponent}`,
    eNotation: `${coefficient}e${p.exponent}`,
    sigFigs: p.sigFigs,
    original,
    negative: p.negative,
  };
}

export interface ToDecimal {
  /** plain notation, or null when the expansion would be longer than MAX_PLAIN_LEN characters */
  plain: string | null;
  eNotation: string;
  /** the same value with a coefficient in [1, 10) */
  normalized: string;
  /** true when the typed coefficient was already in [1, 10) */
  alreadyNormal: boolean;
}

export function toDecimal(coefRaw: string | undefined, expRaw: string | undefined): ToDecimal | null {
  const e = (expRaw ?? '').trim();
  if (!/^[+-]?\d+$/.test(e)) return null;
  const exp = Number(e);
  if (Math.abs(exp) > MAX_EXP) return null;
  const p = parseDecimalString(`${(coefRaw ?? '').trim().replace(/[eE].*$/, '')}`);
  if (!p || /[eE]/.test(coefRaw ?? '')) return null; // exponent goes in its own field
  if (p.isZero) return { plain: '0', eNotation: '0e0', normalized: '0 × 10^0', alreadyNormal: true };

  const totalExp = p.exponent + exp; // exponent of the first significant digit
  const d = p.digits;
  const sign = p.negative ? '-' : '';
  let plain: string | null;
  if (totalExp >= 0) {
    plain = totalExp + 1 >= d.length ? d + '0'.repeat(totalExp + 1 - d.length) : `${d.slice(0, totalExp + 1)}.${d.slice(totalExp + 1)}`;
  } else {
    plain = `0.${'0'.repeat(-totalExp - 1)}${d}`;
  }
  if (plain.length > MAX_PLAIN_LEN) plain = null;
  const coefficient = `${d[0]}${d.length > 1 ? `.${d.slice(1)}` : ''}`;
  return {
    plain: plain === null ? null : sign + plain,
    eNotation: `${sign}${coefficient}e${totalExp}`,
    normalized: `${sign}${coefficient} × 10^${totalExp}`,
    alreadyNormal: p.exponent === 0,
  };
}
