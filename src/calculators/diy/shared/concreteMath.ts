// Shared by diy/concrete and diy/concrete-slab so they always agree.
export const CU_FT_PER_CU_YD = 27;
/** Quikrete yields: an 80 lb bag makes about 0.60 cu ft, a 60 lb bag about 0.45 cu ft. */
export const BAG_80_CU_FT = 0.6;
export const BAG_60_CU_FT = 0.45;
/** Order 10% extra by default: spillage, uneven subgrade, and running short mid-pour is costly. */
export const DEFAULT_CONCRETE_WASTE_PCT = 10;

export interface ConcreteOrder {
  rawCuFt: number;
  totalCuFt: number;
  totalCuYd: number;
  bags60: number;
  bags80: number;
}

/** Add the waste allowance to a raw volume (cubic feet) and convert to cubic yards and whole bags. */
export function concreteOrder(rawCuFt: number, wastePct: number): ConcreteOrder {
  const totalCuFt = rawCuFt * (1 + wastePct / 100);
  // Round away float noise before ceil so 60.0000000001 bags is not 61.
  const bags = (cuFt: number, yieldCuFt: number) => Math.ceil(+(cuFt / yieldCuFt).toFixed(9));
  return {
    rawCuFt,
    totalCuFt,
    totalCuYd: totalCuFt / CU_FT_PER_CU_YD,
    bags60: bags(totalCuFt, BAG_60_CU_FT),
    bags80: bags(totalCuFt, BAG_80_CU_FT),
  };
}

export const slabCuFt = (lengthFt: number, widthFt: number, depthIn: number) => lengthFt * widthFt * (depthIn / 12);
export const cylinderCuFt = (diameterFt: number, depthIn: number) => Math.PI * (diameterFt / 2) ** 2 * (depthIn / 12);
