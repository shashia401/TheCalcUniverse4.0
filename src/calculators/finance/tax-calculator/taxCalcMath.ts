import { STANDARD_DEDUCTION, calculateFederalTax, type FilingStatus } from '../../../utils/taxData';

export const STATUS_KEY: Record<string, FilingStatus> = {
  Single: 'single',
  'Married Filing Jointly': 'mfj',
  'Head of Household': 'hoh',
  'Married Filing Separately': 'mfs',
};

/**
 * Federal income tax on wages for the 2026 tax year (shared taxData brackets and standard deduction).
 * Used by index.ts and the panel so the bracket breakdown always matches the filing status chosen.
 */
export function computeFederalTax(values: Record<string, string>) {
  const income = parseFloat(values.annualIncome);
  if (isNaN(income) || income < 0) return null;
  const status = STATUS_KEY[values.filingStatus] ?? 'single';
  const preTax = Math.max(0, parseFloat(values.preTaxDeductions) || 0);
  const withholding = Math.max(0, parseFloat(values.withholding) || 0);
  const standardDeduction = STANDARD_DEDUCTION[status];
  const taxableIncome = Math.max(0, income - standardDeduction - preTax);
  const tax = calculateFederalTax(taxableIncome, status);
  return {
    income,
    status,
    standardDeduction,
    taxableIncome,
    totalTax: tax.totalTax,
    marginalRate: tax.marginalRate,
    brackets: tax.brackets.filter((b) => b.incomeInBracket > 0),
    effectiveRate: income > 0 ? (tax.totalTax / income) * 100 : 0,
    withholding,
    balance: tax.totalTax - withholding,
  };
}
