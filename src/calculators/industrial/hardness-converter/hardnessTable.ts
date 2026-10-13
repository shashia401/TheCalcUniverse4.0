// ASTM E140-12b, Table 1 "Approximate hardness conversion numbers for non-austenitic steels" (carbon, alloy and
// tool steel, homogeneous, as-forged / annealed / normalized / quenched-and-tempered), as reproduced at
// engineersedge.com/hardness_conversion.htm (Table B). One row per Vickers (136-degree diamond pyramid) value.
//
// Row layout: [HV, HRC, HRB, HRA, HBW, HS]
//   HRC  Rockwell C, 150 kgf diamond cone         (null below HRC 20: outside the scale's valid range)
//   HRB  Rockwell B, 100 kgf 1/16" ball           (null above HRB 100 and below HRB 81: this table has no HV for those)
//   HRA  Rockwell A, 60 kgf diamond cone
//   HBW  Brinell, 10 mm tungsten-carbide ball, 3000 kgf (null where the standard prints no value, HRC > 65)
//   HS   Shore scleroscope (rebound) number
// Only rows with a printed HV are kept, and HRC > 68 (HV > 940, parenthesised in the standard) is dropped.
// The standard says every number is approximate and valid only for the steel families above.
export const E140_ROWS: ReadonlyArray<readonly [number, number | null, number | null, number | null, number | null, number | null]> = [
  [160, null, 81, 50, 153, 24],
  [163, null, 82, 50.5, 156, 24],
  [166, null, 83, 51, 159, 24],
  [170, null, 84, 52, 162, 25],
  [173, null, 85, 52.5, 165, 25],
  [176, null, 86, 53, 169, 25],
  [180, null, 87, 53.5, 172, 26],
  [184, null, 88, 54, 176, 26],
  [188, null, 89, 55, 180, 26],
  [192, null, 90, 55.5, 185, 27],
  [196, null, 91, 56, 190, 28],
  [204, null, 92, 56.5, 195, 29],
  [208, null, 93, 57, 200, 30],
  [213, null, 94, 57.5, 205, 31],
  [222, null, 95, 58, 210, 32],
  [230, null, 96, 59, 216, 33],
  [238, 20, 97, 60.5, 222, 34],
  [243, 21, 98, 61, 228, 35],
  [248, 22, 99, 61.5, 234, 35],
  [254, 23, 100, 62, 240, 36],
  [260, 24, null, 62.4, 247, 37],
  [266, 25, null, 62.8, 253, 38],
  [272, 26, null, 63.3, 258, 39],
  [279, 27, null, 63.8, 264, 40],
  [286, 28, null, 64.3, 271, 41],
  [294, 29, null, 64.7, 279, 41],
  [302, 30, null, 65.3, 286, 42],
  [310, 31, null, 65.8, 294, 43],
  [318, 32, null, 66.3, 301, 44],
  [327, 33, null, 66.8, 311, 46],
  [336, 34, null, 67.4, 319, 47],
  [345, 35, null, 67.9, 327, 48],
  [354, 36, null, 68.4, 336, 49],
  [363, 37, null, 68.9, 344, 50],
  [372, 38, null, 69.4, 353, 51],
  [382, 39, null, 69.9, 362, 52],
  [392, 40, null, 70.4, 371, 54],
  [402, 41, null, 70.9, 381, 55],
  [412, 42, null, 71.5, 390, 56],
  [423, 43, null, 72, 400, 57],
  [434, 44, null, 72.5, 409, 58],
  [446, 45, null, 73.1, 421, 60],
  [458, 46, null, 73.6, 432, 62],
  [471, 47, null, 74.1, 442, 63],
  [484, 48, null, 74.7, 451, 64],
  [498, 49, null, 75.2, 464, 66],
  [513, 50, null, 75.9, 475, 67],
  [528, 51, null, 76.3, 487, 68],
  [544, 52, null, 76.8, 500, 69],
  [560, 53, null, 77.4, 525, 71],
  [577, 54, null, 78, 543, 72],
  [595, 55, null, 78.5, 560, 74],
  [613, 56, null, 79, 577, 75],
  [633, 57, null, 79.6, 595, 76],
  [653, 58, null, 80.1, 615, 78],
  [674, 59, null, 80.7, 634, 80],
  [697, 60, null, 81.2, 654, 81],
  [720, 61, null, 81.8, 670, 83],
  [746, 62, null, 82.3, 688, 85],
  [772, 63, null, 82.8, 705, 87],
  [800, 64, null, 83.4, 722, 88],
  [832, 65, null, 83.9, 739, 91],
  [865, 66, null, 84.5, null, 92],
  [900, 67, null, 85, null, 95],
  [940, 68, null, 85.6, null, 97],
];

export type HardnessScaleId = 'hrc' | 'hrb' | 'hra' | 'hbw' | 'hv' | 'hs' | 'nmm2';

const COL: Record<Exclude<HardnessScaleId, 'hv' | 'nmm2'>, number> = { hrc: 1, hrb: 2, hra: 3, hbw: 4, hs: 5 };

/** Tensile strength rule of thumb for steel, Rm [MPa] ~ 3.2 x HV, applied only up to HV 650 (about 2,080 MPa). */
export const TENSILE_PER_HV = 3.2;
export const TENSILE_MAX_HV = 650;

/** (scaleValue, HV) pairs, ascending, with plateaus (equal scale values, e.g. integer Shore numbers) averaged. */
function pairs(scale: Exclude<HardnessScaleId, 'hv' | 'nmm2'>): [number, number][] {
  const col = COL[scale];
  const groups = new Map<number, number[]>();
  for (const row of E140_ROWS) {
    const v = row[col];
    if (v === null) continue;
    groups.set(v, [...(groups.get(v) ?? []), row[0]]);
  }
  return [...groups.entries()].sort((a, b) => a[0] - b[0]).map(([v, hvs]) => [v, hvs.reduce((s, x) => s + x, 0) / hvs.length]);
}

const PAIRS = Object.fromEntries((Object.keys(COL) as (keyof typeof COL)[]).map((k) => [k, pairs(k)])) as Record<keyof typeof COL, [number, number][]>;

function lerp(table: [number, number][], x: number): number | null {
  if (!(x >= table[0][0] && x <= table[table.length - 1][0])) return null;
  for (let i = 0; i < table.length - 1; i++) {
    const [x0, y0] = table[i];
    const [x1, y1] = table[i + 1];
    if (x >= x0 && x <= x1) return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
  }
  return null;
}

/** Valid input range of each scale, taken from the table (never extrapolated). */
export function scaleRange(scale: HardnessScaleId): [number, number] {
  if (scale === 'hv') return [E140_ROWS[0][0], E140_ROWS[E140_ROWS.length - 1][0]];
  if (scale === 'nmm2') return [E140_ROWS[0][0] * TENSILE_PER_HV, TENSILE_MAX_HV * TENSILE_PER_HV];
  const p = PAIRS[scale];
  return [p[0][0], p[p.length - 1][0]];
}

/** Scale value -> HV, or null outside the table. */
export function toHV(scale: HardnessScaleId, v: number): number | null {
  if (scale === 'hv') return lerp([[scaleRange('hv')[0], scaleRange('hv')[0]], [scaleRange('hv')[1], scaleRange('hv')[1]]], v);
  if (scale === 'nmm2') {
    const hv = v / TENSILE_PER_HV;
    return hv >= E140_ROWS[0][0] && hv <= TENSILE_MAX_HV ? hv : null;
  }
  return lerp(PAIRS[scale], v);
}

/** HV -> scale value, or null when the scale has no table entry at that hardness. */
export function fromHV(scale: HardnessScaleId, hv: number): number | null {
  if (scale === 'hv') return hv;
  if (scale === 'nmm2') return hv >= E140_ROWS[0][0] && hv <= TENSILE_MAX_HV ? hv * TENSILE_PER_HV : null;
  const inv = PAIRS[scale].map(([v, h]) => [h, v] as [number, number]);
  return lerp(inv, hv);
}
