/**
 * pH helpers shared by engineering/ph-calculator and its math/ph-calculator twin.
 * All values assume 25 °C (Kw = 1.0e-14, pH + pOH = 14.00).
 *
 * "Strongly acidic / basic" describes how far the pH is from neutral; it is NOT the chemistry term "strong acid"
 * (complete dissociation), which a pH value alone cannot tell you (0.01 M acetic acid, a weak acid, has pH ~3.4).
 */
export const PKW_25C = 14;

/** Classify on the displayed (2-dp) pH so the label always matches the number shown. */
export function classifyPh(ph: number): string {
  const p = Math.round(ph * 100) / 100;
  if (p === 7) return 'Neutral';
  if (p < 3) return 'Strongly acidic';
  if (p < 7) return 'Acidic';
  if (p <= 11) return 'Basic';
  return 'Strongly basic';
}
