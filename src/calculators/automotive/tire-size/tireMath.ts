export const MM_PER_INCH = 25.4;

export interface TireSizeComparison {
  origDiamMm: number;
  newDiamMm: number;
  /** (new - orig) / orig, in percent. Circumference scales with diameter, so this is also the speedometer/odometer error. */
  diamDiffPct: number;
  /** True speed at an indicated 60 mph on the new tires (mph). */
  actualAtIndicated60: number;
}

/** Overall diameter in mm = rim x 25.4 + 2 x (section width x aspect ratio). */
export function overallDiameterMm(widthMm: number, aspectPct: number, rimInches: number): number {
  return rimInches * MM_PER_INCH + 2 * widthMm * (aspectPct / 100);
}

/** null = incomplete or non-physical input. */
export function compareTires(values: Record<string, string>): TireSizeComparison | null {
  const [ow, oa, or, nw, na, nr] = ['origWidth', 'origAspect', 'origRim', 'newWidth', 'newAspect', 'newRim'].map((k) => parseFloat(values[k]));
  if (![ow, oa, or, nw, na, nr].every(Number.isFinite)) return null;
  const origDiamMm = overallDiameterMm(ow, oa, or);
  const newDiamMm = overallDiameterMm(nw, na, nr);
  if (!(origDiamMm > 0) || !(newDiamMm > 0)) return null;
  return {
    origDiamMm,
    newDiamMm,
    diamDiffPct: ((newDiamMm - origDiamMm) / origDiamMm) * 100,
    actualAtIndicated60: (60 * newDiamMm) / origDiamMm,
  };
}
