// Shared unit-conversion engine for the industrial/* converters.
// Every unit is described by its relation to ONE base unit of its quantity:
//   - linear units: `factor` = size of the unit expressed in the base unit (1 in = 0.0254 m  ->  factor 0.0254)
//   - affine / non-linear units (temperature): `toBase` / `fromBase` functions
// Constants below are EXACT by definition (NIST SP 811 / BIPM SI Brochure 9th ed.) or are derived
// from exact values by exact arithmetic, so no converter ever carries a hand-rounded factor.

export interface UnitDef {
  value: string;
  label: string;
  shortLabel: string;
  /** Size of one of this unit in the quantity's base unit. Ignored when toBase/fromBase are given. */
  factor: number;
  /** Optional affine / non-linear mapping into the base unit (e.g. degC -> K). */
  toBase?: (v: number) => number;
  /** Inverse of toBase. */
  fromBase?: (b: number) => number;
}

// ── Exact defining constants ─────────────────────────────────────────────────
/** 1 inch = 25.4 mm exactly (international yard and pound agreement, 1959). */
export const IN_M = 0.0254;
export const FT_M = 12 * IN_M; // 0.3048 m
export const YD_M = 3 * FT_M; // 0.9144 m
export const MI_M = 5280 * FT_M; // 1609.344 m
/** 1 lb (avoirdupois) = 0.45359237 kg exactly. */
export const LB_KG = 0.45359237;
/** Standard gravity, exact: 1 kgf = 9.80665 N. */
export const G0 = 9.80665;
/** 1 lbf = 1 lb * g0 (4.4482216152605 N). */
export const LBF_N = LB_KG * G0;
/** 1 US gallon = 231 in^3 = 3.785411784 L exactly. */
export const GAL_US_L = 231 * IN_M ** 3 * 1000;
/** US customary kitchen volumes in litres, all exact fractions of the US gallon (1 gal = 128 fl oz = 768 tsp). */
export const TSP_L = GAL_US_L / 768;
export const TBSP_L = GAL_US_L / 256;
export const FLOZ_L = GAL_US_L / 128;
export const CUP_L = GAL_US_L / 16;
export const PT_L = GAL_US_L / 8;
export const QT_L = GAL_US_L / 4;
/** 1 imperial (UK) gallon = 4.54609 L exactly. */
export const GAL_UK_L = 4.54609;
/** 1 in^3 and 1 ft^3 in litres. */
export const IN3_L = IN_M ** 3 * 1000;
export const FT3_L = FT_M ** 3 * 1000;
/** Thermochemical calorie, exact: 1 cal(th) = 4.184 J. */
export const CAL_J = 4.184;
/** International Table BTU, exact definition 1 BTU(IT) = 1055.05585262 J. */
export const BTU_J = 1055.05585262;
/** 1 ft*lbf = 0.3048 m * 4.4482216152605 N (J). */
export const FTLBF_J = FT_M * LBF_N;
/** Conventional mercury / water manometer constants (NIST SP 811: 0 degC Hg, 4 degC H2O). */
export const MMHG_PA = 133.322387415;
export const MMH2O_PA = G0; // 1 mm of water = 9.80665 Pa (conventional)
export const ATM_PA = 101325;
export const SECONDS_PER_HOUR = 3600;

// ── Conversion ───────────────────────────────────────────────────────────────
export const toBase = (u: UnitDef, v: number): number => (u.toBase ? u.toBase(v) : v * u.factor);
export const fromBase = (u: UnitDef, b: number): number => (u.fromBase ? u.fromBase(b) : b / u.factor);

/** Convert `v` from unit `from` to unit `to` through the base unit. */
export function convertUnits(v: number, from: UnitDef, to: UnitDef): number {
  return fromBase(to, toBase(from, v));
}

export function findUnit(units: readonly UnitDef[], id: string | undefined): UnitDef | undefined {
  return units.find((u) => u.value === id);
}

/** Strict numeric parse: '', 'abc', '1e999' -> null (parseFloat would accept '12abc'). */
export function parseQty(raw: string | undefined): number | null {
  if (raw === undefined || raw === null) return null;
  const s = String(raw).trim();
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/**
 * Human-readable quantity: whole numbers in full, otherwise up to 8 significant digits with thousands separators for ordinary magnitudes,
 * scientific notation for the very small / very large (so 1 eV in J never shows as "0").
 * Locale is fixed to en-US so prerendered HTML and the client always agree.
 */
export function formatQty(n: number): string {
  if (!Number.isFinite(n)) return '';
  if (n === 0) return '0';
  const clean = Number(n.toPrecision(15)); // strip binary noise: 212.00000000000006 -> 212
  const abs = Math.abs(clean);
  if (abs >= 1e-4 && abs < 1e15) {
    // whole numbers print in full (1 TiB = 1,099,511,627,776 B); everything else to 8 significant digits
    return clean.toLocaleString('en-US', { maximumSignificantDigits: Number.isInteger(clean) ? 15 : 8 });
  }
  return clean.toExponential(6).replace(/\.?0+e/, 'e').replace('e+', 'e');
}

export interface ConversionOutcome {
  input: number;
  result: number;
  from: UnitDef;
  to: UnitDef;
  /** Overrides the default "value × (factor ÷ factor)" formula line (affine / density-dependent conversions). */
  note?: string;
}

/** Look up both units and convert; null when anything is missing / non-finite. */
export function runConversion(
  rawValue: string | undefined,
  units: readonly UnitDef[],
  fromId: string | undefined,
  toId: string | undefined,
): ConversionOutcome | null {
  const input = parseQty(rawValue);
  if (input === null) return null;
  const from = findUnit(units, fromId);
  const to = findUnit(units, toId);
  if (!from || !to) return null;
  const result = convertUnits(input, from, to);
  if (!Number.isFinite(result)) return null;
  return { input, result, from, to };
}
