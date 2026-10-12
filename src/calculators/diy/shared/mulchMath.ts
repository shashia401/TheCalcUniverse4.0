// Shared by diy/mulch, diy/mulch-topsoil and math/mulch so identical inputs give identical answers.
export const CU_FT_PER_CU_YD = 27;
/** Suggested extra for settling, uneven beds and spillage. */
export const MULCH_BUFFER_PCT = 10;

export interface MulchVolume {
  areaSqFt: number;
  rawCuFt: number;
  rawCuYd: number;
  /** Raw volume plus the 10% buffer: what to actually buy. */
  orderCuFt: number;
  orderCuYd: number;
  bags2: number;
  bags3: number;
  /** Cubic yards to order in bulk: buffered, rounded up to the next half yard (common bulk increment). */
  bulkYards: number;
}

/** Whole-number ceil that ignores float noise (e.g. 3.0000000001 -> 3). */
const ceil = (n: number) => Math.ceil(+n.toFixed(9));

/** depth in inches, area in sq ft: cubic yards = area x depth / 324 (27 cu ft per yd x 12 in per ft). */
export function mulchVolume(areaSqFt: number, depthIn: number): MulchVolume {
  const rawCuFt = (areaSqFt * depthIn) / 12;
  const orderCuFt = rawCuFt * (1 + MULCH_BUFFER_PCT / 100);
  return {
    areaSqFt,
    rawCuFt,
    rawCuYd: rawCuFt / CU_FT_PER_CU_YD,
    orderCuFt,
    orderCuYd: orderCuFt / CU_FT_PER_CU_YD,
    bags2: ceil(orderCuFt / 2),
    bags3: ceil(orderCuFt / 3),
    bulkYards: Math.ceil(+(orderCuFt / CU_FT_PER_CU_YD * 2).toFixed(9)) / 2,
  };
}
