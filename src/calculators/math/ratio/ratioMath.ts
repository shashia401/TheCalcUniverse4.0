import { Frac, gcdBig, lcmBig } from '../../../utils/rational';

export const ASPECT_PRESETS: Record<string, { a: number; b: number; label: string }> = {
  '16:9': { a: 16, b: 9, label: 'HD Video / Widescreen' },
  '4:3': { a: 4, b: 3, label: 'Standard Screen' },
  '1:1': { a: 1, b: 1, label: 'Square' },
  '21:9': { a: 21, b: 9, label: 'Ultrawide' },
  '3:2': { a: 3, b: 2, label: 'Photo (35mm)' },
  '8:5': { a: 8, b: 5, label: '16:10 Display' },
  '9:16': { a: 9, b: 16, label: 'Portrait Phone' },
  '2:3': { a: 2, b: 3, label: 'Portrait Photo' },
  '4:5': { a: 4, b: 5, label: 'Instagram Portrait' },
  '5:4': { a: 5, b: 4, label: 'Medium Format' },
};

/**
 * Smallest whole-number pair with the same ratio as a : b (both positive rationals), exact.
 * 0.1 : 0.3 -> 1 : 3, 1.5 : 2.5 -> 3 : 5. The old Math.round(x * 1e9) route lost precision above ~9e6 and
 * silently dropped digits after the 9th decimal.
 */
export function simplifyRatio(a: Frac, b: Frac): [bigint, bigint] {
  const l = lcmBig(a.d, b.d);
  const ia = a.n * (l / a.d);
  const ib = b.n * (l / b.d);
  const g = gcdBig(ia, ib) || 1n;
  return [ia / g, ib / g];
}
