// Pure aspect-ratio maths shared by index.ts and the panel (the panel must never parse result strings).

export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b > 0) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

const decimals = (n: number) => {
  const s = String(Number(n.toFixed(4)));
  const i = s.indexOf('.');
  return i < 0 ? 0 : s.length - i - 1;
};

/** Reduce a:b to the smallest whole-number ratio. Decimal inputs (1.85 : 1) are scaled to integers
 *  first (up to 4 decimals) so the integer GCD is exact; `g` is the divisor in the original units. */
export function simplifyRatio(a: number, b: number): { w: number; h: number; g: number } {
  const k = 10 ** Math.max(decimals(a), decimals(b));
  const A = Math.round(a * k);
  const B = Math.round(b * k);
  const g = gcd(A, B);
  return { w: A / g, h: B / g, g: g / k };
}

export interface AspectPreset {
  label: string;
  ratio: number; // w/h
  display: string;
}

export const PRESETS: AspectPreset[] = [
  { label: '16:9 — Widescreen HD', ratio: 16 / 9, display: '16:9' },
  { label: '4:3 — Standard / Classic', ratio: 4 / 3, display: '4:3' },
  { label: '1:1 — Square', ratio: 1 / 1, display: '1:1' },
  { label: '3:2 — Classic Photo', ratio: 3 / 2, display: '3:2' },
  { label: '21:9 — Ultrawide', ratio: 21 / 9, display: '21:9' },
  { label: '9:16 — Vertical / TikTok / IG Story', ratio: 9 / 16, display: '9:16' },
];

/** A preset whose w/h is within 0.02 of the given ratio (1366x768 is "about 16:9"). */
export function findPreset(w: number, h: number): AspectPreset | null {
  const r = w / h;
  return PRESETS.find((p) => Math.abs(r - p.ratio) < 0.02) ?? null;
}

export interface AspectInfo {
  mode: 'calculate-ratio' | 'find-missing';
  width: number;
  height: number;
  ratioW: number;
  ratioH: number;
  g: number;
  preset: AspectPreset | null;
  exactPreset: boolean;
  knownDimension: 'width' | 'height';
}

const pos = (s: string | undefined) => {
  const n = parseFloat(s ?? '');
  return Number.isFinite(n) && n > 0 ? n : null;
};

export function aspectInfo(values: Record<string, string>): AspectInfo | null {
  const mode = values.mode === 'find-missing' ? 'find-missing' : 'calculate-ratio';
  if (mode === 'calculate-ratio') {
    const width = pos(values.width);
    const height = pos(values.height);
    if (!width || !height) return null;
    const s = simplifyRatio(width, height);
    const preset = findPreset(width, height);
    return { mode, width, height, ratioW: s.w, ratioH: s.h, g: s.g, preset, exactPreset: !!preset && preset.display === `${s.w}:${s.h}`, knownDimension: 'width' };
  }
  const a = pos(values.ratioA);
  const b = pos(values.ratioB);
  const known = pos(values.knownValue);
  if (!a || !b || !known) return null;
  const knownDimension = values.knownDimension === 'height' ? 'height' : 'width';
  const width = knownDimension === 'width' ? known : (known / b) * a;
  const height = knownDimension === 'height' ? known : (known / a) * b;
  const s = simplifyRatio(a, b);
  const preset = findPreset(a, b);
  return { mode, width, height, ratioW: s.w, ratioH: s.h, g: s.g, preset, exactPreset: !!preset && preset.display === `${s.w}:${s.h}`, knownDimension };
}
