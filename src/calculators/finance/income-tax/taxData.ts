import { FEDERAL_BRACKETS, STANDARD_DEDUCTION } from '../../../utils/taxData';

export type FilingStatus = 'single' | 'mfj' | 'mfs' | 'hoh';

// Re-exported from the shared, actively-maintained bracket data (utils/taxData.ts)
// so this calculator can't silently drift out of sync with the others that use it
// (the old local copy here had wrong MFS/HOH thresholds).
export const FEDERAL_BRACKETS_2025 = FEDERAL_BRACKETS;
export const STANDARD_DEDUCTIONS_2025 = STANDARD_DEDUCTION;

export const RETIREMENT_LIMITS_2025 = {
  traditional401k: 23500,
  traditionalIRA: 7000,
  catchUp401k: 7500,
  catchUpIRA: 1000,
};

export const FICA_2025 = {
  socialSecurityRate: 0.062,
  socialSecurityWageBase: 176100,
  medicareRate: 0.0145,
  additionalMedicareRate: 0.009,
  additionalMedicareThreshold: { single: 200000, mfj: 250000, mfs: 125000, hoh: 200000 },
};

export interface StateRate {
  name: string;
  rate: number | 'graduated';
  effectiveRate?: number;
  noIncomeTax?: boolean;
}

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
  GA: { name: 'Georgia', rate: 0.0549 },
  HI: { name: 'Hawaii', rate: 'graduated', effectiveRate: 0.072 },
  ID: { name: 'Idaho', rate: 0.058 },
  IL: { name: 'Illinois', rate: 0.0495 },
  IN: { name: 'Indiana', rate: 0.0305 },
  IA: { name: 'Iowa', rate: 0.038 },
  KS: { name: 'Kansas', rate: 'graduated', effectiveRate: 0.049 },
  KY: { name: 'Kentucky', rate: 0.04 },
  LA: { name: 'Louisiana', rate: 'graduated', effectiveRate: 0.035 },
  ME: { name: 'Maine', rate: 'graduated', effectiveRate: 0.055 },
  MD: { name: 'Maryland', rate: 'graduated', effectiveRate: 0.049 },
  MA: { name: 'Massachusetts', rate: 0.05 },
  MI: { name: 'Michigan', rate: 0.0425 },
  MN: { name: 'Minnesota', rate: 'graduated', effectiveRate: 0.063 },
  MS: { name: 'Mississippi', rate: 0.047 },
  MO: { name: 'Missouri', rate: 'graduated', effectiveRate: 0.047 },
  MT: { name: 'Montana', rate: 'graduated', effectiveRate: 0.054 },
  NE: { name: 'Nebraska', rate: 'graduated', effectiveRate: 0.053 },
  NV: { name: 'Nevada', rate: 0, noIncomeTax: true },
  NH: { name: 'New Hampshire', rate: 0, noIncomeTax: true },
  NJ: { name: 'New Jersey', rate: 'graduated', effectiveRate: 0.057 },
  NM: { name: 'New Mexico', rate: 'graduated', effectiveRate: 0.049 },
  NY: { name: 'New York', rate: 'graduated', effectiveRate: 0.062 },
  NC: { name: 'North Carolina', rate: 0.0425 },
  ND: { name: 'North Dakota', rate: 'graduated', effectiveRate: 0.018 },
  OH: { name: 'Ohio', rate: 'graduated', effectiveRate: 0.035 },
  OK: { name: 'Oklahoma', rate: 'graduated', effectiveRate: 0.044 },
  OR: { name: 'Oregon', rate: 'graduated', effectiveRate: 0.077 },
  PA: { name: 'Pennsylvania', rate: 0.0307 },
  RI: { name: 'Rhode Island', rate: 'graduated', effectiveRate: 0.049 },
  SC: { name: 'South Carolina', rate: 'graduated', effectiveRate: 0.054 },
  SD: { name: 'South Dakota', rate: 0, noIncomeTax: true },
  TN: { name: 'Tennessee', rate: 0, noIncomeTax: true },
  TX: { name: 'Texas', rate: 0, noIncomeTax: true },
  UT: { name: 'Utah', rate: 0.0465 },
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

export function calcFICA(wages: number, status: FilingStatus): { ss: number; medicare: number; additionalMedicare: number } {
  const ssWages = Math.min(wages, FICA_2025.socialSecurityWageBase);
  const ss = ssWages * FICA_2025.socialSecurityRate;
  const medicare = wages * FICA_2025.medicareRate;
  const addlThreshold = FICA_2025.additionalMedicareThreshold[status];
  const additionalMedicare = Math.max(0, wages - addlThreshold) * FICA_2025.additionalMedicareRate;
  return { ss, medicare, additionalMedicare };
}
