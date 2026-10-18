import { STANDARD_DEDUCTION, FICA, FilingStatus, TaxResult, calculateFederalTax } from '../../../utils/taxData';
import { STATE_INCOME_TAX, hasNoWageTax, stateIncomeTax } from '../../../utils/stateTax';

export const PAY_FREQUENCIES: Record<string, { label: string; periods: number }> = {
  weekly: { label: 'Weekly (52/year)', periods: 52 },
  biweekly: { label: 'Bi-Weekly (26/year)', periods: 26 },
  semimonthly: { label: 'Semi-Monthly (24/year)', periods: 24 },
  monthly: { label: 'Monthly (12/year)', periods: 12 },
};

export interface PaycheckCalc {
  freq: string;
  periods: number;
  stateCode: string;
  stateName: string;
  noStateTax: boolean;
  status: FilingStatus;
  grossAnnual: number;
  /** Traditional 401(k)/403(b) deferrals actually applied: cut income tax, NOT FICA. */
  retirement: number;
  /** Deferral the user asked for before it was limited to what the paycheck can fund. */
  retirementRequested: number;
  /** True when the requested deferral was reduced so that net pay is not negative. */
  retirementClamped: boolean;
  /** Section 125 benefits (health premiums, HSA/FSA via payroll): cut income tax AND FICA. */
  benefits: number;
  ficaWages: number;
  taxableIncome: number;
  fed: TaxResult;
  ss: number;
  medicare: number;
  additionalMedicare: number;
  fica: number;
  stateTax: number;
  totalTax: number;
  netAnnual: number;
}

/**
 * One pure source of truth for the paycheck maths (2026 federal brackets/standard deduction,
 * 2026 FICA, 2026 state schedules). Used by both calculate() and the panel so they cannot diverge.
 * Returns null when the pay inputs are incomplete.
 */
export function computePaycheck(values: Record<string, string>): PaycheckCalc | null {
  const mode = values.payMode === 'hourly' ? 'hourly' : 'salary';
  const salary = parseFloat(values.annualSalary);
  const hourly = parseFloat(values.hourlyWage);
  const hours = parseFloat(values.hoursPerWeek);

  let grossAnnual: number;
  if (mode === 'salary') {
    if (!(salary > 0)) return null;
    grossAnnual = salary;
  } else {
    if (!(hourly > 0) || !(hours > 0)) return null;
    grossAnnual = hourly * hours * 52;
  }
  if (!Number.isFinite(grossAnnual)) return null;

  const status = (values.filingStatus in STANDARD_DEDUCTION ? values.filingStatus : 'single') as FilingStatus;
  const freq = values.payFrequency in PAY_FREQUENCIES ? values.payFrequency : 'biweekly';
  const stateCode = values.state in STATE_INCOME_TAX ? values.state : 'TX';

  // Deductions can never exceed the pay they come out of.
  const benefits = Math.min(Math.max(0, parseFloat(values.preTaxDeductions) || 0), grossAnnual);
  const retirementRequested = Math.max(0, parseFloat(values.retirementContributions) || 0);

  const ficaWages = grossAnnual - benefits;
  const ss = Math.min(ficaWages, FICA.socialSecurityWageBase) * FICA.socialSecurityRate;
  const medicare = ficaWages * FICA.medicareRate;
  const threshold = status === 'mfj' ? FICA.additionalMedicareThreshold.mfj : FICA.additionalMedicareThreshold.single;
  const additionalMedicare = Math.max(0, ficaWages - threshold) * FICA.additionalMedicareRate;
  const fica = ss + medicare + additionalMedicare;

  // Income taxes for a given deferral. Pennsylvania taxes 401(k) deferrals, so PA state wages are NOT reduced by them
  // (PA Dept. of Revenue, PA Personal Income Tax Guide, Gross Compensation); every other state schedule uses wages net of deferrals.
  const taxesFor = (ret: number) => {
    const incomeTaxWages = ficaWages - ret;
    const taxableIncome = Math.max(0, incomeTaxWages - STANDARD_DEDUCTION[status]);
    const fed = calculateFederalTax(taxableIncome, status);
    const stateWages = stateCode === 'PA' ? ficaWages : incomeTaxWages;
    return { taxableIncome, fed, stateTax: stateIncomeTax(stateCode, stateWages, status) };
  };
  const netFor = (ret: number) => {
    const t = taxesFor(ret);
    return grossAnnual - (t.fed.totalTax + fica + t.stateTax) - benefits - ret;
  };

  // A deferral cannot exceed pay: limit it to the largest amount that leaves net pay at or above zero
  // (FICA and any income tax are still owed on the wages, so this is below gross pay).
  let retirement = Math.min(retirementRequested, ficaWages);
  if (netFor(retirement) < 0) {
    let lo = 0;
    let hi = retirement;
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2;
      if (netFor(mid) >= 0) lo = mid;
      else hi = mid;
    }
    retirement = lo;
  }
  const retirementClamped = retirement < retirementRequested - 0.005;

  const { taxableIncome, fed, stateTax } = taxesFor(retirement);
  const totalTax = fed.totalTax + fica + stateTax;
  const netAnnual = grossAnnual - totalTax - benefits - retirement;

  return {
    freq,
    periods: PAY_FREQUENCIES[freq].periods,
    stateCode,
    stateName: STATE_INCOME_TAX[stateCode].name,
    noStateTax: hasNoWageTax(stateCode),
    status,
    grossAnnual,
    retirement,
    retirementRequested,
    retirementClamped,
    benefits,
    ficaWages,
    taxableIncome,
    fed,
    ss,
    medicare,
    additionalMedicare,
    fica,
    stateTax,
    totalTax,
    netAnnual,
  };
}
