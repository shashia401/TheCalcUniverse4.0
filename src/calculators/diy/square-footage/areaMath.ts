export const SQFT_PER_SQM = 10.763910417; // 1 m = 3.280839895 ft

export type Shape = 'rectangle' | 'circle' | 'lshape';

export interface Area {
  shape: Shape;
  unit: 'ft' | 'm';
  /** Area in the unit the user typed (ft² or m²). */
  area: number;
  sqft: number;
  sqm: number;
  wastagePct: number;
  withWaste: number;
  /** Price is quoted per sq ft, so cost uses the waste-adjusted ft². */
  cost: number | null;
  dimensions: { length?: number; width?: number; radius?: number; length2?: number; width2?: number };
}

const pos = (n: number) => Number.isFinite(n) && n > 0;

/** null = incomplete or non-positive dimensions. */
export function area(values: Record<string, string>): Area | null {
  const shape = (values.shape || 'rectangle') as Shape;
  const unit = values.unit === 'm' ? 'm' : 'ft';
  const wastagePct = parseInt(values.wastage || '0', 10) || 0;
  const price = values.pricePerSqFt ? parseFloat(values.pricePerSqFt) : NaN;

  const length = parseFloat(values.length);
  const width = parseFloat(values.width);
  let a: number;
  const dimensions: Area['dimensions'] = {};
  if (shape === 'rectangle') {
    if (!pos(length) || !pos(width)) return null;
    a = length * width;
    Object.assign(dimensions, { length, width });
  } else if (shape === 'circle') {
    const radius = parseFloat(values.radius);
    if (!pos(radius)) return null;
    a = Math.PI * radius * radius;
    Object.assign(dimensions, { radius });
  } else if (shape === 'lshape') {
    const length2 = parseFloat(values.lLength2);
    const width2 = parseFloat(values.lWidth2);
    if (!pos(length) || !pos(width) || !pos(length2) || !pos(width2)) return null;
    a = length * width + length2 * width2;
    Object.assign(dimensions, { length, width, length2, width2 });
  } else {
    return null;
  }
  if (!Number.isFinite(a) || a <= 0) return null;

  const sqft = unit === 'm' ? a * SQFT_PER_SQM : a;
  const sqm = unit === 'm' ? a : a / SQFT_PER_SQM;
  const withWaste = sqft * (1 + wastagePct / 100);
  return { shape, unit, area: a, sqft, sqm, wastagePct, withWaste, cost: pos(price) ? price * withWaste : null, dimensions };
}
