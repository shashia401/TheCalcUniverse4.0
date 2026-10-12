/**
 * Centralized 2026 tax data, IRA limits, VAT rates, and CD rate benchmarks.
 * Single source of truth updated annually — no hunting through 20+ calculator files.
 */

export const TAX_YEAR = 2026;

// ─── IRA Limits (2026) ───────────────────────────────────────────────
// Source: IRS Notice 2025-67 (2026 retirement plan limits).
export const IRA_LIMITS = {
  /** Base limit for under 50 */
  base: 7500,
  /** Additional catch-up for age 50+ (now inflation-indexed under SECURE 2.0 §108) */
  catchup: 1100,
  /** Total for age 50+ */
  totalAge50Plus: 8600,
} as const;

export const ROTH_IRA_INCOME_LIMITS = {
  /** Phase-out start and end for single filers */
  single: { start: 153000, end: 168000 },
  /** Phase-out for married filing jointly */
  mfj: { start: 242000, end: 252000 },
} as const;

/** Deductible IRA income limits (if covered by workplace plan) — 2026 */
export const DEDUCTIBLE_IRA_LIMITS = {
  single: { start: 81000, end: 91000 },
  mfj: { start: 129000, end: 149000 },
} as const;

// ─── FICA (2026) ─────────────────────────────────────────────────────
// Source: SSA — Social Security wage base rises to $184,500 for 2026.
export const FICA = {
  socialSecurityRate: 0.062,
  medicareRate: 0.0145,
  additionalMedicareRate: 0.009, // 0.9% above threshold
  socialSecurityWageBase: 184500,
  additionalMedicareThreshold: {
    single: 200000,
    mfj: 250000,
  },
} as const;

// ─── Federal Income Tax Brackets (2026 — TCJA extended by OBBBA) ────
// Source: IRS Revenue Procedure 2025-32 / IRS newsroom 2026 inflation adjustments.
export const FEDERAL_BRACKETS = {
  single: [
    { rate: 0.10, from: 0, to: 12400, min: 0, max: 12400 },
    { rate: 0.12, from: 12400, to: 50400, min: 12400, max: 50400 },
    { rate: 0.22, from: 50400, to: 105700, min: 50400, max: 105700 },
    { rate: 0.24, from: 105700, to: 201775, min: 105700, max: 201775 },
    { rate: 0.32, from: 201775, to: 256225, min: 201775, max: 256225 },
    { rate: 0.35, from: 256225, to: 640600, min: 256225, max: 640600 },
    { rate: 0.37, from: 640600, to: Infinity, min: 640600, max: Infinity },
  ],
  mfj: [
    { rate: 0.10, from: 0, to: 24800, min: 0, max: 24800 },
    { rate: 0.12, from: 24800, to: 100800, min: 24800, max: 100800 },
    { rate: 0.22, from: 100800, to: 211400, min: 100800, max: 211400 },
    { rate: 0.24, from: 211400, to: 403550, min: 211400, max: 403550 },
    { rate: 0.32, from: 403550, to: 512450, min: 403550, max: 512450 },
    { rate: 0.35, from: 512450, to: 768700, min: 512450, max: 768700 },
    { rate: 0.37, from: 768700, to: Infinity, min: 768700, max: Infinity },
  ],
  hoh: [
    { rate: 0.10, from: 0, to: 17700, min: 0, max: 17700 },
    { rate: 0.12, from: 17700, to: 67450, min: 17700, max: 67450 },
    { rate: 0.22, from: 67450, to: 105700, min: 67450, max: 105700 },
    { rate: 0.24, from: 105700, to: 201750, min: 105700, max: 201750 },
    { rate: 0.32, from: 201750, to: 256200, min: 201750, max: 256200 },
    { rate: 0.35, from: 256200, to: 640600, min: 256200, max: 640600 },
    { rate: 0.37, from: 640600, to: Infinity, min: 640600, max: Infinity },
  ],
  mfs: [
    { rate: 0.10, from: 0, to: 12400, min: 0, max: 12400 },
    { rate: 0.12, from: 12400, to: 50400, min: 12400, max: 50400 },
    { rate: 0.22, from: 50400, to: 105700, min: 50400, max: 105700 },
    { rate: 0.24, from: 105700, to: 201775, min: 105700, max: 201775 },
    { rate: 0.32, from: 201775, to: 256225, min: 201775, max: 256225 },
    { rate: 0.35, from: 256225, to: 384350, min: 256225, max: 384350 },
    { rate: 0.37, from: 384350, to: Infinity, min: 384350, max: Infinity },
  ],
} as const;

export type FilingStatus = keyof typeof FEDERAL_BRACKETS;

// ─── Standard Deduction (2026) ───────────────────────────────────────
// Source: IRS Revenue Procedure 2025-32. Verified 2026-09-26.
export const STANDARD_DEDUCTION: Record<FilingStatus, number> = {
  single: 16100,
  mfj: 32200,
  hoh: 24150,
  mfs: 16100,
} as const;

/** Marginal rate brackets as display labels */
export const BRACKET_LABELS: Record<FilingStatus, { from: number; to: number; label: string }[]> = {
  single: [
    { from: 0, to: 12400, label: '10%' },
    { from: 12400, to: 50400, label: '12%' },
    { from: 50400, to: 105700, label: '22%' },
    { from: 105700, to: 201775, label: '24%' },
    { from: 201775, to: 256225, label: '32%' },
    { from: 256225, to: 640600, label: '35%' },
    { from: 640600, to: Infinity, label: '37%' },
  ],
  mfj: [
    { from: 0, to: 24800, label: '10%' },
    { from: 24800, to: 100800, label: '12%' },
    { from: 100800, to: 211400, label: '22%' },
    { from: 211400, to: 403550, label: '24%' },
    { from: 403550, to: 512450, label: '32%' },
    { from: 512450, to: 768700, label: '35%' },
    { from: 768700, to: Infinity, label: '37%' },
  ],
  hoh: [
    { from: 0, to: 17700, label: '10%' },
    { from: 17700, to: 67450, label: '12%' },
    { from: 67450, to: 105700, label: '22%' },
    { from: 105700, to: 201750, label: '24%' },
    { from: 201750, to: 256200, label: '32%' },
    { from: 256200, to: 640600, label: '35%' },
    { from: 640600, to: Infinity, label: '37%' },
  ],
  mfs: [
    { from: 0, to: 12400, label: '10%' },
    { from: 12400, to: 50400, label: '12%' },
    { from: 50400, to: 105700, label: '22%' },
    { from: 105700, to: 201775, label: '24%' },
    { from: 201775, to: 256225, label: '32%' },
    { from: 256225, to: 384350, label: '35%' },
    { from: 384350, to: Infinity, label: '37%' },
  ],
};

// ─── VAT Rates by Country (2026) ─────────────────────────────────────
export const VAT_RATES: Record<string, { standard: number; name: string }> = {
  UK: { standard: 20, name: 'United Kingdom' },
  DE: { standard: 19, name: 'Germany' },
  FR: { standard: 20, name: 'France' },
  IT: { standard: 22, name: 'Italy' },
  ES: { standard: 21, name: 'Spain' },
  NL: { standard: 21, name: 'Netherlands' },
  BE: { standard: 21, name: 'Belgium' },
  AT: { standard: 20, name: 'Austria' },
  IE: { standard: 23, name: 'Ireland' },
  PT: { standard: 23, name: 'Portugal' },
  GR: { standard: 24, name: 'Greece' },
  FI: { standard: 25.5, name: 'Finland' },
  SE: { standard: 25, name: 'Sweden' },
  DK: { standard: 25, name: 'Denmark' },
  PL: { standard: 23, name: 'Poland' },
  CZ: { standard: 21, name: 'Czech Republic' },
  HU: { standard: 27, name: 'Hungary' },
  RO: { standard: 21, name: 'Romania' }, // 19% -> 21% from 1 Aug 2025
  BG: { standard: 20, name: 'Bulgaria' },
  HR: { standard: 25, name: 'Croatia' },
  SK: { standard: 23, name: 'Slovakia' },
  SI: { standard: 22, name: 'Slovenia' },
  LT: { standard: 21, name: 'Lithuania' },
  LV: { standard: 21, name: 'Latvia' },
  EE: { standard: 24, name: 'Estonia' }, // 22% -> 24% from 1 Jul 2025
  LU: { standard: 17, name: 'Luxembourg' },
  MT: { standard: 18, name: 'Malta' },
  CY: { standard: 19, name: 'Cyprus' },
  MC: { standard: 20, name: 'Monaco' },
  LI: { standard: 8.1, name: 'Liechtenstein' },
  SM: { standard: 17, name: 'San Marino' },
  AD: { standard: 4.5, name: 'Andorra' },
  CH: { standard: 8.1, name: 'Switzerland' },
  NO: { standard: 25, name: 'Norway' },
  AU: { standard: 10, name: 'Australia' },
  NZ: { standard: 15, name: 'New Zealand' },
  JP: { standard: 10, name: 'Japan' },
  SG: { standard: 9, name: 'Singapore' },
  IN: { standard: 18, name: 'India' },
  AE: { standard: 5, name: 'UAE' },
  SA: { standard: 15, name: 'Saudi Arabia' },
  ZA: { standard: 15, name: 'South Africa' },
  MX: { standard: 16, name: 'Mexico' },
  CA: { standard: 5, name: 'Canada (GST)' },
  CA_QC: { standard: 14.975, name: 'Canada Quebec (GST+QST)' },
  CA_ON: { standard: 13, name: 'Canada Ontario (HST)' },
};

/** Sorted list of VAT countries for dropdowns */
export const VAT_COUNTRY_LIST = Object.entries(VAT_RATES)
  .sort((a, b) => a[1].name.localeCompare(b[1].name))
  .map(([code, data]) => ({ code, ...data }));

// ─── Federal Tax Calculation Helper ───────────────────────────────────
export interface TaxResult {
  totalTax: number;
  brackets: Array<{ rate: number; from: number; to: number; min: number; max: number; tax: number; incomeInBracket: number }>;
  marginalRate: number;
  effectiveRate: number;
}

export function calculateFederalTax(income: number, status: FilingStatus, deduction = 0): TaxResult {
  const brackets = FEDERAL_BRACKETS[status];
  if (!brackets) {
    throw new Error(
      `Invalid filing status: "${status}". Valid statuses: ${Object.keys(FEDERAL_BRACKETS).join(', ')}`
    );
  }
  const taxableIncome = Math.max(0, income - deduction);
  let totalTax = 0;
  const bracketDetails: TaxResult['brackets'] = [];

  for (const b of brackets) {
    const taxableInBracket = Math.max(0, Math.min(taxableIncome, b.to) - b.from);
    const tax = taxableInBracket * b.rate;
    totalTax += tax;
    bracketDetails.push({ ...b, tax, incomeInBracket: taxableInBracket });
  }

  const marginalRate = [...bracketDetails].reverse().find((b) => b.incomeInBracket > 0)?.rate ?? 0;
  const effectiveRate = taxableIncome > 0 ? totalTax / taxableIncome : 0;

  return { totalTax, brackets: bracketDetails, marginalRate, effectiveRate };
}
