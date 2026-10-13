// Pure yarn-yardage maths shared by index.ts and the panel (the panel used to parse result strings).
//
// Model (an ESTIMATE): a knitted or crocheted row uses roughly K times its width in yarn (about 3.5x for stockinette,
// typically 3-4x), independent of how many stitches are in the row, because finer stitches are proportionally shorter.
// Total yarn therefore scales with the number of rows, i.e. with the ROW gauge:
//   custom piece:   yards = K x width x length x (rows per inch) / 36 x 1.2 waste
//   preset project: yards = base yardage (measured at 24 rows per 4 in, worsted) x (your rows per 4 in / 24)
// The stitch gauge is used only to check that the gauge is plausible for the chosen yarn weight.

export const K_STITCH = 3.5;
export const WASTE = 1.2;
export const BASELINE_ROWS = 24;
export const BASELINE_STITCHES = 20;

export const PROJECT_BASE_YARDAGE: Record<string, Record<string, number>> = {
  Scarf: { S: 300, M: 400, L: 500, XL: 600 },
  Blanket: { S: 1200, M: 1800, L: 2400, XL: 3000 },
  Sweater: { S: 800, M: 1000, L: 1200, XL: 1400 },
  Hat: { S: 200, M: 250, L: 300, XL: 350 },
  Socks: { S: 250, M: 300, L: 350, XL: 400 },
  Shawl: { S: 500, M: 700, L: 900, XL: 1100 },
  Dishcloth: { S: 100, M: 150, L: 200, XL: 250 },
};

/** Fabric-area equivalents of quilting precuts in yards of 44-inch-wide fabric (area / (36 x 44 in^2)). */
export const PRECUT_FABRIC_YARDS: Record<string, number> = {
  'Jelly Roll': (40 * 2.5 * 42) / (36 * 44), // 40 strips of 2.5" x 42"
  'Layer Cake': (42 * 10 * 10) / (36 * 44), // 42 squares of 10"
  'Charm Pack': (42 * 5 * 5) / (36 * 44), // 42 squares of 5"
  'Fat Quarter': (18 * 22) / (36 * 44), // 18" x 22" = 1/4 yd
  'Fat Eighth': (9 * 22) / (36 * 44), // 9" x 22" = 1/8 yd
};

/** Craft Yarn Council standard stitch gauge (stitches per 4 in, stockinette) by yarn weight. */
export const TYPICAL_STITCH_RANGE: Record<string, [number, number]> = {
  'Lace/Fingering': [27, 40],
  Sport: [23, 26],
  DK: [21, 24],
  Worsted: [16, 20],
  Bulky: [12, 15],
  'Super Bulky': [7, 11],
};

export interface YarnPlan {
  projectType: string;
  size: string;
  stitches: number;
  rows: number;
  baseYardage: number;
  rowFactor: number;
  yards: number;
  meters: number;
  yarnWeight: string;
  gaugeWarning: string | null;
  precutType: string;
  precutCount: number;
  precutFabricYards: number;
}

export function yarnPlan(values: Record<string, string>): YarnPlan | null {
  const projectType = values.projectType || 'Scarf';
  const size = values.size || 'M';
  const stitches = parseInt(values.stitchesPer4in, 10);
  const rows = parseInt(values.rowsPer4in, 10);
  if (!(stitches >= 1) || !(rows >= 1)) return null;

  let baseYardage: number;
  let yards: number;
  const rowFactor = rows / BASELINE_ROWS;
  if (projectType === 'Custom') {
    const w = parseFloat(values.customWidth);
    const l = parseFloat(values.customLength);
    if (!(w > 0) || !(l > 0)) return null;
    baseYardage = (K_STITCH * w * l * (rows / 4)) / 36;
    yards = baseYardage * WASTE;
  } else {
    baseYardage = PROJECT_BASE_YARDAGE[projectType]?.[size];
    if (!baseYardage) return null;
    yards = baseYardage * rowFactor;
  }

  const yarnWeight = values.yarnWeight || 'Worsted';
  const range = TYPICAL_STITCH_RANGE[yarnWeight];
  const gaugeWarning =
    range && (stitches < range[0] || stitches > range[1])
      ? `${stitches} stitches per 4 in is outside the usual ${range[0]}-${range[1]} for ${yarnWeight} yarn - re-measure your swatch or pick the yarn weight that matches it.`
      : null;

  const precutType = values.precutType || '';
  const precutCount = parseInt(values.precutCount, 10) || 0;
  const precutFabricYards = precutType && precutCount > 0 && PRECUT_FABRIC_YARDS[precutType] ? PRECUT_FABRIC_YARDS[precutType] * precutCount : 0;

  return { projectType, size, stitches, rows, baseYardage, rowFactor, yards, meters: yards * 0.9144, yarnWeight, gaugeWarning, precutType, precutCount, precutFabricYards };
}
