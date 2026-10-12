import { computePaycheck, type PaycheckCalc } from '../paycheck-calculator/paycheckMath';

export const PAY_PERIODS: Record<string, number> = {
  monthly: 12,
  'semi-monthly': 24,
  'bi-weekly': 26,
  weekly: 52,
};

/** This calculator's frequency ids -> the paycheck engine's ids. */
const ENGINE_FREQ: Record<string, string> = {
  monthly: 'monthly',
  'semi-monthly': 'semimonthly',
  'bi-weekly': 'biweekly',
  weekly: 'weekly',
};

export interface TakeHome {
  calc: PaycheckCalc;
  stateCode: string;
  noState: boolean;
  /** Traditional 401(k)-style deferral, dollars (percentage of salary). */
  preTaxAmount: number;
}

/**
 * One source of truth for index.ts and the panel: the shared paycheck engine (2026 federal brackets, FICA and state
 * schedules). Pre-tax % is a traditional 401(k)/403(b) deferral: it cuts federal and state taxable income, not FICA.
 * State 'none' means a state without a wage tax.
 */
export function computeTakeHome(values: Record<string, string>): TakeHome | null {
  const salary = parseFloat(values.annualSalary);
  if (!(salary > 0) || !Number.isFinite(salary)) return null;
  const pct = Math.min(Math.max(parseFloat(values.preTaxDeductions) || 0, 0), 100);
  const preTaxAmount = (salary * pct) / 100;
  const noState = !values.state || values.state === 'none';
  const calc = computePaycheck({
    payMode: 'salary',
    annualSalary: String(salary),
    filingStatus: values.filingStatus || 'single',
    payFrequency: ENGINE_FREQ[values.payFrequency] ?? 'monthly',
    state: noState ? 'TX' : values.state,
    retirementContributions: String(preTaxAmount),
    preTaxDeductions: '0',
  });
  if (!calc) return null;
  return { calc, stateCode: noState ? 'none' : calc.stateCode, noState: noState || calc.noStateTax, preTaxAmount: calc.retirement };
}
