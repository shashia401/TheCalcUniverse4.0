// Pure recipe-scaling maths shared by index.ts and the panel (the panel must not parse result strings).
// Scaling is plain proportion: scaled = original x (desired servings / original servings). Real cooking is not always
// proportional (leavening, salt and spices, pan size, cooking time) - the UI says so; this file only does the arithmetic.

/** "1/2", "2 1/2", "1.5" or "1,5" -> number; null for anything else (including a zero denominator or non-positive values). */
export function parseQty(value: string): number | null {
  const t = value.trim();
  if (!t) return null;
  const mixed = /^(\d+)\s+(\d+)\/(\d+)$/.exec(t);
  if (mixed) {
    const den = Number(mixed[3]);
    return den === 0 ? null : Number(mixed[1]) + Number(mixed[2]) / den;
  }
  const frac = /^(\d+)\/(\d+)$/.exec(t);
  if (frac) {
    const den = Number(frac[2]);
    const q = den === 0 ? NaN : Number(frac[1]) / den;
    return Number.isFinite(q) && q > 0 ? q : null;
  }
  const dec = /^\d+,\d+$/.test(t) ? t.replace(',', '.') : t;
  const n = Number(dec);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Up to 2 decimals (3 for tiny values), trailing zeros trimmed. */
export function formatQty(value: number): string {
  if (Math.abs(value - Math.round(value)) < 0.001) return Math.round(value).toString();
  const digits = Math.abs(value) < 0.1 ? 3 : 2;
  return parseFloat(value.toFixed(digits)).toString();
}

/** Kitchen-friendly mixed number ("1 2/3") for amounts within 0.02 of a halves/thirds/quarters/eighths fraction; otherwise null. */
export function toKitchenFraction(value: number): string | null {
  if (!(value > 0)) return null;
  const whole = Math.floor(value + 1e-9);
  const frac = value - whole;
  if (frac < 0.02) return null; // already (nearly) a whole number
  for (const d of [2, 3, 4, 8]) {
    for (let n = 1; n < d; n++) {
      if (Math.abs(frac - n / d) < 0.02) {
        const g = gcd(n, d);
        return `${whole > 0 ? `${whole} ` : ''}${n / g}/${d / g}`;
      }
    }
  }
  return null;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

export interface ScaledIngredient {
  id: string;
  name: string;
  unit: string;
  original: number;
  scaled: number;
}

export interface ScaleResult {
  original: number;
  desired: number;
  factor: number;
  ingredients: ScaledIngredient[];
}

export function scaleRecipe(values: Record<string, string>): ScaleResult | null {
  const original = parseFloat(values.originalServings);
  const desired = parseFloat(values.desiredServings);
  if (!(original > 0) || !(desired > 0)) return null;
  const factor = desired / original;
  const ingredients: ScaledIngredient[] = [];
  for (const prefix of ['ingredient1', 'ingredient2', 'ingredient3']) {
    const name = values[`${prefix}Name`]?.trim() ?? '';
    const qtyStr = values[`${prefix}Qty`]?.trim() ?? '';
    const qty = parseQty(qtyStr);
    if (qty === null) continue;
    ingredients.push({ id: `${prefix}-scaled`, name, unit: values[`${prefix}Unit`]?.trim() ?? '', original: qty, scaled: qty * factor });
  }
  return { original, desired, factor, ingredients };
}
