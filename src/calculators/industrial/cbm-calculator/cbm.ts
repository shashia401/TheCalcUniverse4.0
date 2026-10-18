import { FT_M, IN_M, parseQty } from '../../../utils/unitConvert';

/** Metres per input unit (exact: 1 in = 25.4 mm, 1 ft = 0.3048 m). */
export const UNIT_TO_M: Record<string, number> = { cm: 0.01, m: 1, in: IN_M, ft: FT_M };

/** Volumetric divisors in cm³ per kg. Air: IATA standard 6000 (167 kg/m³); courier: 5000 (200 kg/m³); sea LCL: 1 m³ = 1000 kg. */
export const SHIPPING_MODES = {
  air: { divisor: 6000, label: 'Air Freight (L×W×H cm ÷ 6000)' },
  sea: { divisor: 1000, label: 'Sea Freight (CBM × 1000 kg)' },
  courier: { divisor: 5000, label: 'Courier / Express (L×W×H cm ÷ 5000)' },
} as const;

/** Typical usable internal volumes in CBM (ISO 668 internal dimensions vary by builder; payload and packing gaps ignored). */
export const CONTAINER_CBM = { ft20: 33, ft40: 67, ft40hc: 76 } as const;

export interface CbmResult {
  length: number;
  width: number;
  height: number;
  unit: string;
  packages: number;
  /** Volume of one package, m³ */
  perPackageCbm: number;
  cbm: number;
  dimWeight: number;
  actualWeight: number;
  chargeableWeight: number;
  dimLabel: string;
  /** Volumetric divisor, cm³ per kg */
  divisor: number;
  containers20: number;
  containers40: number;
}

/** All CBM / dimensional-weight maths in one pure function; calculate() and the panel both use it. */
export function computeCbm(values: Record<string, string>): CbmResult | null {
  const length = parseQty(values.length);
  const width = parseQty(values.width);
  const height = parseQty(values.height);
  const actualWeight = parseQty(values.actualWeight);
  if (length === null || width === null || height === null || actualWeight === null) return null;
  if (length <= 0 || width <= 0 || height <= 0 || actualWeight <= 0) return null;

  const unit = values.unit || 'cm';
  const toM = UNIT_TO_M[unit];
  if (toM === undefined) return null;

  const rawPackages = values.packages === undefined || values.packages.trim() === '' ? 1 : parseQty(values.packages);
  if (rawPackages === null || !Number.isInteger(rawPackages) || rawPackages < 1) return null;
  const packages = rawPackages;

  const mode = SHIPPING_MODES[(values.shippingMode || 'air') as keyof typeof SHIPPING_MODES] ?? SHIPPING_MODES.air;

  const perPackageCbm = length * toM * (width * toM) * (height * toM);
  const cbm = perPackageCbm * packages;
  // cm³ = m³ × 1e6
  const dimWeight = (cbm * 1e6) / mode.divisor;
  const chargeableWeight = Math.max(actualWeight, dimWeight);
  if (![cbm, dimWeight, chargeableWeight].every(Number.isFinite)) return null;

  return {
    length,
    width,
    height,
    unit,
    packages,
    perPackageCbm,
    cbm,
    dimWeight,
    actualWeight,
    chargeableWeight,
    dimLabel: mode.label,
    divisor: mode.divisor,
    containers20: Math.ceil(cbm / CONTAINER_CBM.ft20),
    containers40: Math.ceil(cbm / CONTAINER_CBM.ft40),
  };
}

export function formatCbm(v: number): string {
  if (v >= 100) return v.toFixed(2);
  if (v >= 0.0001) return v.toFixed(4);
  return v.toFixed(8);
}
