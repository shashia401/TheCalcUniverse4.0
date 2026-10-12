import { FEDERAL_BRACKETS, STANDARD_DEDUCTION, FICA as SHARED_FICA } from '../../../utils/taxData';

export type FilingStatus = 'single' | 'mfj' | 'mfs' | 'hoh';

// Re-exported from the shared, actively-maintained bracket data (utils/taxData.ts)
// so this calculator can't silently drift out of sync with the others that use it
// (the old local copy here had wrong MFS/HOH thresholds).
export const FEDERAL_BRACKETS_2025 = FEDERAL_BRACKETS;
export const STANDARD_DEDUCTIONS_2025 = STANDARD_DEDUCTION;

// Named *_2025 for import stability; the values are the 2026 limits (IRS Notice 2025-67).
export const RETIREMENT_LIMITS_2025 = {
  traditional401k: 24500,
  traditionalIRA: 7500,
  catchUp401k: 8000,
  /** Ages 60-63 (SECURE 2.0 super catch-up) replaces the regular catch-up */
  superCatchUp401k: 11250,
  catchUpIRA: 1100,
};

// Social Security wage base, rates, and the single/mfj additional-Medicare
// thresholds now come from the shared, actively-maintained utils/taxData.ts
// (same fix already applied to FEDERAL_BRACKETS/STANDARD_DEDUCTION above) so
// this file can't drift out of sync again — the wage base here used to be
// hardcoded at the stale 2025 figure ($176,100) after the SSA raised it to
// $184,500 for 2026. mfs/hoh additional-Medicare thresholds aren't in the
// shared FICA export, so they stay defined locally.
export const FICA_2025 = {
  socialSecurityRate: SHARED_FICA.socialSecurityRate,
  socialSecurityWageBase: SHARED_FICA.socialSecurityWageBase,
  medicareRate: SHARED_FICA.medicareRate,
  additionalMedicareRate: SHARED_FICA.additionalMedicareRate,
  additionalMedicareThreshold: { single: 200000, mfj: 250000, mfs: 125000, hoh: 200000 },
};

export interface StateRate {
  name: string;
  rate: number | 'graduated';
  effectiveRate?: number;
  noIncomeTax?: boolean;
}

// Flat rates are the 2026 rates (Tax Foundation, as of Jan 1 2026). States marked 'graduated' use a rough
// effective rate for a typical middle income, which is only an approximation of the real brackets.
export const STATE_RATES_2025: Record<string, StateRate> = {
  AL: { name: 'Alabama', rate: 'graduated', effectiveRate: 0.04 },
  AK: { name: 'Alaska', rate: 0, noIncomeTax: true },
  AZ: { name: 'Arizona', rate: 0.025 },
  AR: { name: 'Arkansas', rate: 'graduated', effectiveRate: 0.044 },
  CA: { name: 'California', rate: 'graduated', effectiveRate: 0.065 },
  CO: { name: 'Colorado', rate: 0.044 },
  CT: { name: 'Connecticut', rate: 'graduated', effectiveRate: 0.05 },
  DE: { name: 'Delaware', rate: 'graduated', effectiveRate: 0.052 },
  FL: { name: 'Florida', rate: 0, noIncomeTax: true },
  GA: { name: 'Georgia', rate: 0.0519 },
  HI: { name: 'Hawaii', rate: 'graduated', effectiveRate: 0.072 },
  ID: { name: 'Idaho', rate: 0.053 },
  IL: { name: 'Illinois', rate: 0.0495 },
  IN: { name: 'Indiana', rate: 0.0295 },
  IA: { name: 'Iowa', rate: 0.038 },
  KS: { name: 'Kansas', rate: 'graduated', effectiveRate: 0.049 },
  KY: { name: 'Kentucky', rate: 0.035 },
  LA: { name: 'Louisiana', rate: 0.03 },
  ME: { name: 'Maine', rate: 'graduated', effectiveRate: 0.055 },
  MD: { name: 'Maryland', rate: 'graduated', effectiveRate: 0.049 },
  MA: { name: 'Massachusetts', rate: 0.05 },
  MI: { name: 'Michigan', rate: 0.0425 },
  MN: { name: 'Minnesota', rate: 'graduated', effectiveRate: 0.063 },
  MS: { name: 'Mississippi', rate: 0.04 },
  MO: { name: 'Missouri', rate: 'graduated', effectiveRate: 0.047 },
  MT: { name: 'Montana', rate: 'graduated', effectiveRate: 0.054 },
  NE: { name: 'Nebraska', rate: 'graduated', effectiveRate: 0.053 },
  NV: { name: 'Nevada', rate: 0, noIncomeTax: true },
  NH: { name: 'New Hampshire', rate: 0, noIncomeTax: true },
  NJ: { name: 'New Jersey', rate: 'graduated', effectiveRate: 0.057 },
  NM: { name: 'New Mexico', rate: 'graduated', effectiveRate: 0.049 },
  NY: { name: 'New York', rate: 'graduated', effectiveRate: 0.062 },
  NC: { name: 'North Carolina', rate: 0.0399 },
  ND: { name: 'North Dakota', rate: 'graduated', effectiveRate: 0.018 },
  OH: { name: 'Ohio', rate: 0.0275 },
  OK: { name: 'Oklahoma', rate: 'graduated', effectiveRate: 0.044 },
  OR: { name: 'Oregon', rate: 'graduated', effectiveRate: 0.077 },
  PA: { name: 'Pennsylvania', rate: 0.0307 },
  RI: { name: 'Rhode Island', rate: 'graduated', effectiveRate: 0.049 },
  SC: { name: 'South Carolina', rate: 'graduated', effectiveRate: 0.054 },
  SD: { name: 'South Dakota', rate: 0, noIncomeTax: true },
  TN: { name: 'Tennessee', rate: 0, noIncomeTax: true },
  TX: { name: 'Texas', rate: 0, noIncomeTax: true },
  UT: { name: 'Utah', rate: 0.045 },
  VT: { name: 'Vermont', rate: 'graduated', effectiveRate: 0.054 },
  VA: { name: 'Virginia', rate: 'graduated', effectiveRate: 0.049 },
  WA: { name: 'Washington', rate: 0, noIncomeTax: true },
  WV: { name: 'West Virginia', rate: 'graduated', effectiveRate: 0.044 },
  WI: { name: 'Wisconsin', rate: 'graduated', effectiveRate: 0.052 },
  WY: { name: 'Wyoming', rate: 0, noIncomeTax: true },
  DC: { name: 'Washington D.C.', rate: 'graduated', effectiveRate: 0.065 },
};

export function calcFederalTax(taxableIncome: number, status: FilingStatus): { tax: number; marginalRate: number } {
  const brackets = FEDERAL_BRACKETS_2025[status];
  let tax = 0;
  let marginalRate = 0;
  for (const bracket of brackets) {
    if (taxableIncome <= bracket.min) break;
    const taxable = Math.min(taxableIncome, bracket.max) - bracket.min;
    tax += taxable * bracket.rate;
    if (taxableIncome > bracket.min) marginalRate = bracket.rate;
  }
  return { tax, marginalRate };
}

export interface IncomeTaxInput {
  gross: number;
  status: FilingStatus;
  stateCode: string;
  retirement401k: number;
  health: number;
  otherPreTax: number;
}

/** All figures behind the income-tax result rows and panel (single source of truth). */
export function computeIncomeTax(i: IncomeTaxInput) {
  const { gross, status, stateCode, retirement401k, health, otherPreTax } = i;
  // 401(k) deferrals reduce income tax but NOT FICA wages; Section 125 health premiums and payroll HSA/FSA reduce both.
  const ficaWages = Math.max(0, gross - health - otherPreTax);
  const federalAGI = Math.max(0, gross - retirement401k - health - otherPreTax);
  const standardDeduction = STANDARD_DEDUCTIONS_2025[status];
  const taxableIncome = Math.max(0, federalAGI - standardDeduction);

  const { tax: federalTax, marginalRate } = calcFederalTax(taxableIncome, status);
  const { ss, medicare, additionalMedicare } = calcFICA(ficaWages, status);
  const ficaTotal = ss + medicare + additionalMedicare;

  const stateInfo = STATE_RATES_2025[stateCode];
  const stateRate = stateInfo?.noIncomeTax
    ? 0
    : typeof stateInfo?.rate === 'number' && stateInfo.rate > 0
    ? stateInfo.rate
    : stateInfo?.effectiveRate || 0;
  const stateTax = federalAGI * stateRate;

  const preTaxTotal = retirement401k + health + otherPreTax;
  const totalTax = federalTax + ficaTotal + stateTax;
  const netPay = gross - totalTax - preTaxTotal;
  return {
    ficaWages, federalAGI, standardDeduction, taxableIncome, federalTax, marginalRate,
    ss, medicare, additionalMedicare, ficaTotal, stateInfo, stateRate, stateTax,
    preTaxTotal, totalTax, netPay,
    effectiveRate: (federalTax / Math.max(gross, 1)) * 100,
    totalEffectiveRate: (totalTax / Math.max(gross, 1)) * 100,
  };
}

export function calcFICA(wages: number, status: FilingStatus): { ss: number; medicare: number; additionalMedicare: number } {
  const ssWages = Math.min(wages, FICA_2025.socialSecurityWageBase);
  const ss = ssWages * FICA_2025.socialSecurityRate;
  const medicare = wages * FICA_2025.medicareRate;
  const addlThreshold = FICA_2025.additionalMedicareThreshold[status];
  const additionalMedicare = Math.max(0, wages - addlThreshold) * FICA_2025.additionalMedicareRate;
  return { ss, medicare, additionalMedicare };
}
