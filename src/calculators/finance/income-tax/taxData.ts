export type FilingStatus = 'single' | 'mfj' | 'mfs' | 'hoh';

export interface TaxBracket {
  rate: number;
  min: number;
  max: number;
  from: number;
  to: number;
}

export const FEDERAL_BRACKETS_2025: Record<FilingStatus, TaxBracket[]> = {
  single: [
    { rate: 0.10, min: 0, max: 11925, from: 0, to: 11925 },
    { rate: 0.12, min: 11925, max: 48475, from: 11925, to: 48475 },
    { rate: 0.22, min: 48475, max: 103350, from: 48475, to: 103350 },
    { rate: 0.24, min: 103350, max: 197300, from: 103350, to: 197300 },
    { rate: 0.32, min: 197300, max: 250525, from: 197300, to: 250525 },
    { rate: 0.35, min: 250525, max: 626350, from: 250525, to: 626350 },
    { rate: 0.37, min: 626350, max: Infinity, from: 626350, to: Infinity },
  ],
  mfj: [
    { rate: 0.10, min: 0, max: 23850, from: 0, to: 23850 },
    { rate: 0.12, min: 23850, max: 96950, from: 23850, to: 96950 },
    { rate: 0.22, min: 96950, max: 206700, from: 96950, to: 206700 },
    { rate: 0.24, min: 206700, max: 394600, from: 206700, to: 394600 },
    { rate: 0.32, min: 394600, max: 501050, from: 394600, to: 501050 },
    { rate: 0.35, min: 501050, max: 751600, from: 501050, to: 751600 },
    { rate: 0.37, min: 751600, max: Infinity, from: 751600, to: Infinity },
  ],
  mfs: [
    { rate: 0.10, min: 0, max: 11925, from: 0, to: 11925 },
    { rate: 0.12, min: 11925, max: 48475, from: 11925, to: 48475 },
    { rate: 0.22, min: 48475, max: 103350, from: 48475, to: 103350 },
    { rate: 0.24, min: 103350, max: 197300, from: 103350, to: 197300 },
    { rate: 0.32, min: 197300, max: 250525, from: 197300, to: 250525 },
    { rate: 0.35, min: 250525, max: 375800, from: 250525, to: 375800 },
    { rate: 0.37, min: 375800, max: Infinity, from: 375800, to: Infinity },
  ],
  hoh: [
    { rate: 0.10, min: 0, max: 17000, from: 0, to: 17000 },
    { rate: 0.12, min: 17000, max: 64850, from: 17000, to: 64850 },
    { rate: 0.22, min: 64850, max: 103350, from: 64850, to: 103350 },
    { rate: 0.24, min: 103350, max: 197300, from: 103350, to: 197300 },
    { rate: 0.32, min: 197300, max: 250500, from: 197300, to: 250500 },
    { rate: 0.35, min: 250500, max: 626350, from: 250500, to: 626350 },
    { rate: 0.37, min: 626350, max: Infinity, from: 626350, to: Infinity },
  ],
};

export const STANDARD_DEDUCTIONS_2025: Record<FilingStatus, number> = {
  single: 15000,
  mfj: 30000,
  mfs: 15000,
  hoh: 22500,
};

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
