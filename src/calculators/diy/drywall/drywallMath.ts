// Drywall takeoff. Material allowances per 1,000 sq ft of board: USG estimating guidance lists roughly
// 10 gallons of all-purpose joint compound and about 370 linear feet of joint tape; screws are planned at
// about 1 per sq ft (32 on a 4x8 sheet).
export const COMPOUND_GAL_PER_SQFT = 10 / 1000;
export const TAPE_FT_PER_SQFT = 370 / 1000;
export const SCREWS_PER_SQFT = 1;
export const TAPE_ROLL_FT = 250;
export const DOOR_SQFT = 20;
export const WINDOW_SQFT = 15;
export const WASTE = 0.1;

export interface Drywall {
  wallArea: number;
  ceilingArea: number;
  netArea: number;
  withWaste: number;
  sheets: number;
  sheetSqFt: number;
  screws: number;
  compoundGal: number;
  tapeFt: number;
  tapeRolls: number;
}

/** null = incomplete input (or openings that remove all the wall area). */
export function drywall(values: Record<string, string>): Drywall | null {
  const length = parseFloat(values.length);
  const width = parseFloat(values.width);
  const height = parseFloat(values.height);
  const sheetSqFt = parseFloat(values.sheetSize || '32');
  const includeCeiling = values.ceiling !== 'no';
  const doors = Math.max(0, parseFloat(values.doors) || 0);
  const windows = Math.max(0, parseFloat(values.windows) || 0);
  if (![length, width, height, sheetSqFt].every(Number.isFinite) || length <= 0 || width <= 0 || height <= 0 || sheetSqFt <= 0) return null;

  const wallArea = 2 * (length + width) * height;
  const ceilingArea = includeCeiling ? length * width : 0;
  const netArea = wallArea + ceilingArea - doors * DOOR_SQFT - windows * WINDOW_SQFT;
  if (!(netArea > 0)) return null;

  const withWaste = netArea * (1 + WASTE);
  const sheets = Math.ceil(+(withWaste / sheetSqFt).toFixed(9));
  const tapeFt = netArea * TAPE_FT_PER_SQFT;
  return {
    wallArea,
    ceilingArea,
    netArea,
    withWaste,
    sheets,
    sheetSqFt,
    screws: Math.ceil(sheets * sheetSqFt * SCREWS_PER_SQFT),
    compoundGal: netArea * COMPOUND_GAL_PER_SQFT,
    tapeFt,
    tapeRolls: Math.ceil(tapeFt / TAPE_ROLL_FT),
  };
}
