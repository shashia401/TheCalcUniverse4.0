// Interior wall paint. One US gallon covers roughly 350-400 sq ft on smooth, primed surfaces
// (typical manufacturer guidance, e.g. Sherwin-Williams, Behr); 350 is the conservative end.
export const COVERAGE_SQFT_PER_GAL = 350;
export const DOOR_SQFT = 21; // 3 ft x 7 ft
export const WINDOW_SQFT = 15;
export const WASTE = 0.1;

export interface Paint {
  wallArea: number;
  paintableArea: number;
  coats: number;
  gallonsRaw: number;
  gallonsWithWaste: number;
  containers: number;
}

/** Walls only (no ceiling/trim). null = incomplete input or openings that remove all the wall. */
export function paint(values: Record<string, string>): Paint | null {
  const length = parseFloat(values.roomLength);
  const width = parseFloat(values.roomWidth);
  const height = parseFloat(values.ceilingHeight);
  const doors = Math.max(0, parseFloat(values.doors) || 0);
  const windows = Math.max(0, parseFloat(values.windows) || 0);
  const coats = parseFloat(values.coats || '2');
  if (![length, width, height, coats].every(Number.isFinite) || length <= 0 || width <= 0 || height <= 0 || coats <= 0) return null;

  const wallArea = 2 * (length + width) * height;
  const paintableArea = wallArea - doors * DOOR_SQFT - windows * WINDOW_SQFT;
  if (!(paintableArea > 0)) return null;

  const gallonsRaw = (paintableArea * coats) / COVERAGE_SQFT_PER_GAL;
  const gallonsWithWaste = gallonsRaw * (1 + WASTE);
  return { wallArea, paintableArea, coats, gallonsRaw, gallonsWithWaste, containers: Math.ceil(+gallonsWithWaste.toFixed(9)) };
}
