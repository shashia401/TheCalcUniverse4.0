/**
 * Centralized 2026 tax data, IRA limits, VAT rates, and CD rate benchmarks.
 * Single source of truth updated annually — no hunting through 20+ calculator files.
 */

export const TAX_YEAR = 2026;

// ─── IRA Limits (2026) ───────────────────────────────────────────────
export const IRA_LIMITS = {
  /** Base limit for under 50 */
  base: 7000,
  /** Additional catch-up for age 50+ */
  catchup: 1000,
  /** Total for age 50+ */
  totalAge50Plus: 8000,
} as const;

export const ROTH_IRA_INCOME_LIMITS = {
  /** Phase-out start and end for single filers */
  single: { start: 150000, end: 165000 },
  /** Phase-out for married filing jointly */
  mfj: { start: 236000, end: 246000 },
} as const;

/** Deductible IRA income limits (if covered by workplace plan) — 2026 */
export const DEDUCTIBLE_IRA_LIMITS = {
  single: { start: 79000, end: 89000 },
  mfj: { start: 126000, end: 146000 },
} as const;

// ─── FICA (2026) ─────────────────────────────────────────────────────
export const FICA = {
  socialSecurityRate: 0.062,
  medicareRate: 0.0145,
  additionalMedicareRate: 0.009, // 0.9% above threshold
  socialSecurityWageBase: 176100,
  additionalMedicareThreshold: {
    single: 200000,
    mfj: 250000,
  },
} as const;

// ─── Federal Income Tax Brackets (2026 — TCJA extended) ────────────
export const FEDERAL_BRACKETS = {
  single: [
    { rate: 0.10, from: 0, to: 11925, min: 0, max: 11925 },
    { rate: 0.12, from: 11925, to: 48475, min: 11925, max: 48475 },
    { rate: 0.22, from: 48475, to: 103350, min: 48475, max: 103350 },
    { rate: 0.24, from: 103350, to: 197300, min: 103350, max: 197300 },
    { rate: 0.32, from: 197300, to: 250525, min: 197300, max: 250525 },
    { rate: 0.35, from: 250525, to: 626350, min: 250525, max: 626350 },
    { rate: 0.37, from: 626350, to: Infinity, min: 626350, max: Infinity },
  ],
  mfj: [
    { rate: 0.10, from: 0, to: 23850, min: 0, max: 23850 },
    { rate: 0.12, from: 23850, to: 96950, min: 23850, max: 96950 },
    { rate: 0.22, from: 96950, to: 206700, min: 96950, max: 206700 },
    { rate: 0.24, from: 206700, to: 394600, min: 206700, max: 394600 },
    { rate: 0.32, from: 394600, to: 501050, min: 394600, max: 501050 },
    { rate: 0.35, from: 501050, to: 751600, min: 501050, max: 751600 },
    { rate: 0.37, from: 751600, to: Infinity, min: 751600, max: Infinity },
  ],
  hoh: [
    { rate: 0.10, from: 0, to: 17000, min: 0, max: 17000 },
    { rate: 0.12, from: 17000, to: 64850, min: 17000, max: 64850 },
    { rate: 0.22, from: 64850, to: 103350, min: 64850, max: 103350 },
    { rate: 0.24, from: 103350, to: 197300, min: 103350, max: 197300 },
    { rate: 0.32, from: 197300, to: 250525, min: 197300, max: 250525 },
    { rate: 0.35, from: 250525, to: 626350, min: 250525, max: 626350 },
    { rate: 0.37, from: 626350, to: Infinity, min: 626350, max: Infinity },
  ],
  mfs: [
    { rate: 0.10, from: 0, to: 11925, min: 0, max: 11925 },
    { rate: 0.12, from: 11925, to: 48475, min: 11925, max: 48475 },
    { rate: 0.22, from: 48475, to: 103350, min: 48475, max: 103350 },
    { rate: 0.24, from: 103350, to: 197300, min: 103350, max: 197300 },
    { rate: 0.32, from: 197300, to: 250525, min: 197300, max: 250525 },
    { rate: 0.35, from: 250525, to: 626350, min: 250525, max: 626350 },
    { rate: 0.37, from: 626350, to: Infinity, min: 626350, max: Infinity },
  ],
} as const;

export type FilingStatus = keyof typeof FEDERAL_BRACKETS;

// ─── Standard Deduction (2026) ───────────────────────────────────────
// Source: IRS Revenue Procedure 2025-XX. Verified 2026-04-26.
export const STANDARD_DEDUCTION: Record<FilingStatus, number> = {
  single: 15000,
  mfj: 30000,
  hoh: 22500,
  mfs: 15000,
} as const;

/** Marginal rate brackets as display labels */
export const BRACKET_LABELS: Record<FilingStatus, { from: number; to: number; label: string }[]> = {
  single: [
    { from: 0, to: 11925, label: '10%' },
    { from: 11925, to: 48475, label: '12%' },
    { from: 48475, to: 103350, label: '22%' },
    { from: 103350, to: 197300, label: '24%' },
    { from: 197300, to: 250525, label: '32%' },
    { from: 250525, to: 626350, label: '35%' },
    { from: 626350, to: Infinity, label: '37%' },
  ],
  mfj: [
    { from: 0, to: 23850, label: '10%' },
    { from: 23850, to: 96950, label: '12%' },
    { from: 96950, to: 206700, label: '22%' },
    { from: 206700, to: 394600, label: '24%' },
    { from: 394600, to: 501050, label: '32%' },
    { from: 501050, to: 751600, label: '35%' },
    { from: 751600, to: Infinity, label: '37%' },
  ],
  hoh: [
    { from: 0, to: 17000, label: '10%' },
    { from: 17000, to: 64850, label: '12%' },
    { from: 64850, to: 103350, label: '22%' },
    { from: 103350, to: 197300, label: '24%' },
    { from: 197300, to: 250525, label: '32%' },
    { from: 250525, to: 626350, label: '35%' },
    { from: 626350, to: Infinity, label: '37%' },
  ],
  mfs: [
    { from: 0, to: 11925, label: '10%' },
    { from: 11925, to: 48475, label: '12%' },
    { from: 48475, to: 103350, label: '22%' },
    { from: 103350, to: 197300, label: '24%' },
    { from: 197300, to: 250525, label: '32%' },
    { from: 250525, to: 626350, label: '35%' },
    { from: 626350, to: Infinity, label: '37%' },
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
  RO: { standard: 19, name: 'Romania' },
  BG: { standard: 20, name: 'Bulgaria' },
  HR: { standard: 25, name: 'Croatia' },
  SK: { standard: 23, name: 'Slovakia' },
  SI: { standard: 22, name: 'Slovenia' },
  LT: { standard: 21, name: 'Lithuania' },
  LV: { standard: 21, name: 'Latvia' },
  EE: { standard: 22, name: 'Estonia' },
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
  BR: { standard: 17, name: 'Brazil' },
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
