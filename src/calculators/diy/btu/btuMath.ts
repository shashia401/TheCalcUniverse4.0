// Room-level BTU sizing (a planning estimate, not an ACCA Manual J load calculation).
//
// Cooling is anchored on the ENERGY STAR / ASHRAE room-AC rule of thumb of about 20 BTU/h per sq ft for an
// 8-9 ft room, adjusted -10% for a shaded room and +10% for a sunny one, +600 BTU/h for each occupant beyond
// two, and +4,000 BTU/h for a kitchen. The climate scaling around that 20 BTU/sq ft anchor, the insulation,
// ceiling-height and basement factors are this calculator's own assumptions (documented in the page text).
// Heating uses its own per-sq-ft table: cold climates need MORE heating capacity, not less.

export const BTU_PER_TON = 12000;
export const BTU_PER_EXTRA_PERSON = 600;
export const FREE_OCCUPANTS = 2;
export const KITCHEN_BTU = 4000;

/** Cooling BTU/h per sq ft by climate zone (zone 3 = the 20 BTU/sq ft anchor). */
export const COOLING_BTU_PER_SQFT: Record<string, number> = { '1': 30, '2': 25, '3': 20, '4': 15 };
/** Heating BTU/h per sq ft by climate zone: planning values for a typical insulated room, warm to cold. */
export const HEATING_BTU_PER_SQFT: Record<string, number> = { '1': 20, '2': 30, '3': 40, '4': 50 };
/** Volume scales with height: 9 ft = 1.125, 10 ft = 1.25, 12 ft = 1.5 (the "9-10 ft" option uses 1.2). */
export const CEILING_FACTORS: Record<string, number> = { '8': 1.0, '9': 1.2, '12': 1.5 };
export const SUN_FACTORS: Record<string, number> = { minimal: 0.9, moderate: 1.0, high: 1.1 };
export const INSULATION_FACTORS: Record<string, number> = { poor: 1.2, average: 1.0, good: 0.9 };
export const BASEMENT_COOLING_FACTOR = 0.85;

export const CLIMATE_LABELS: Record<string, string> = {
  '1': 'Zone 1 — Hot', '2': 'Zone 2 — Mixed', '3': 'Zone 3 — Cool', '4': 'Zone 4 — Cold',
};

export interface Btu {
  purpose: 'cooling' | 'heating';
  area: number;
  perSqFt: number;
  ceilingFactor: number;
  sunFactor: number;
  insulationFactor: number;
  roomFactor: number;
  extraBtu: number; // occupants + kitchen (cooling only)
  occupants: number;
  totalBTU: number;
  tons: number;
  recommendedTons: number;
  recommendedBTU: number;
  btuPerSqFt: number;
}

/** null = incomplete or unrecognised option values. */
export function btu(values: Record<string, string>): Btu | null {
  const area = parseFloat(values.area);
  const zone = values.climateZone || '';
  const sun = values.sunExposure || '';
  const ins = values.insulation || '';
  const ceiling = values.ceilingHeight || '';
  const room = values.roomType || '';
  const occupants = Math.max(0, parseInt(values.people || '1', 10) || 0);
  const purpose = values.purpose === 'heating' ? 'heating' : 'cooling';
  if (!Number.isFinite(area) || area <= 0) return null;

  const perSqFt = (purpose === 'heating' ? HEATING_BTU_PER_SQFT : COOLING_BTU_PER_SQFT)[zone];
  const ceilingFactor = CEILING_FACTORS[ceiling];
  const sunFactor = SUN_FACTORS[sun];
  const insulationFactor = INSULATION_FACTORS[ins];
  if ([perSqFt, ceilingFactor, sunFactor, insulationFactor].some((v) => v === undefined)) return null;
  if (!['standard', 'kitchen', 'basement'].includes(room)) return null;

  let roomFactor = 1;
  let extraBtu = 0;
  let sunUsed = 1;
  if (purpose === 'cooling') {
    sunUsed = sunFactor;
    if (room === 'basement') roomFactor = BASEMENT_COOLING_FACTOR;
    if (room === 'kitchen') extraBtu += KITCHEN_BTU;
    extraBtu += Math.max(0, occupants - FREE_OCCUPANTS) * BTU_PER_EXTRA_PERSON;
  }
  const totalBTU = area * perSqFt * ceilingFactor * sunUsed * insulationFactor * roomFactor + extraBtu;
  const tons = totalBTU / BTU_PER_TON;
  const recommendedTons = Math.max(0.5, Math.ceil(+(tons * 2).toFixed(9)) / 2);
  return {
    purpose, area, perSqFt, ceilingFactor, sunFactor: sunUsed, insulationFactor, roomFactor, extraBtu, occupants,
    totalBTU, tons, recommendedTons, recommendedBTU: recommendedTons * BTU_PER_TON, btuPerSqFt: totalBTU / area,
  };
}
