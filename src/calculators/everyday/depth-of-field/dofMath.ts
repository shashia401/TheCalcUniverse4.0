// Pure depth-of-field maths shared by index.ts and the panel (the panel must not parse result strings).
// Circle of confusion = sensor diagonal / 1500 (the usual "8x10 print at 25 cm" convention, e.g. 43.27 mm / 1500 = 0.029 mm).

export const SENSOR_CONFIGS: Record<string, { coc: number; crop: number }> = {
  'Full Frame (35mm)': { coc: 0.029, crop: 1 },
  'APS-C (1.5x)': { coc: 0.019, crop: 1.5 },
  'APS-C (1.6x)': { coc: 0.019, crop: 1.6 },
  'Micro 4/3': { coc: 0.015, crop: 2 },
  '1"': { coc: 0.011, crop: 2.7 },
  '1/1.7"': { coc: 0.006, crop: 4.6 }, // 7.6 x 5.7 mm, diagonal 9.5 mm
  'Medium Format': { coc: 0.037, crop: 0.79 }, // 44 x 33 mm, diagonal 55 mm
};

export const FT_PER_M = 3.28084;

export interface DofInfo {
  sensorKey: string;
  coc: number;
  crop: number;
  unit: 'feet' | 'meters';
  /** all distances in metres */
  distance: number;
  hyperfocal: number;
  near: number;
  /** null = infinity (subject at or beyond the hyperfocal distance) */
  far: number | null;
  dof: number | null;
  /** subject closer than the focal length: cannot be focused */
  tooClose: boolean;
}

/** H = f^2/(N c) + f;  near = s(H-f)/(H+s-2f);  far = s(H-f)/(H-s) for s < H, else infinity. */
export function dofInfo(values: Record<string, string>): DofInfo | null {
  const sensorKey = values.sensorSize || 'Full Frame (35mm)';
  const sensor = SENSOR_CONFIGS[sensorKey];
  if (!sensor) return null;
  const f = parseFloat(values.focalLength);
  const N = parseFloat(values.aperture);
  const raw = parseFloat(values.subjectDistance);
  if (!(f > 0) || !(N > 0) || !(raw > 0)) return null;
  const unit = values.distanceUnit === 'meters' ? 'meters' : 'feet';
  const s = (unit === 'feet' ? raw * 0.3048 : raw) * 1000; // mm
  const H = (f * f) / (N * sensor.coc) + f;
  const base = { sensorKey, coc: sensor.coc, crop: sensor.crop, unit } as const;
  if (s <= f) return { ...base, distance: s / 1000, hyperfocal: H / 1000, near: 0, far: null, dof: null, tooClose: true };
  const near = (s * (H - f)) / (H + s - 2 * f);
  const far = s < H ? (s * (H - f)) / (H - s) : null;
  return {
    ...base,
    distance: s / 1000,
    hyperfocal: H / 1000,
    near: near / 1000,
    far: far === null ? null : far / 1000,
    dof: far === null ? null : (far - near) / 1000,
    tooClose: false,
  };
}
