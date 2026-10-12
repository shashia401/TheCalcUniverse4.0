import { pmt } from '../../../utils/financial';

export interface StudentLoanCalc {
  principal: number;
  annualRate: number;
  monthlyRate: number;
  repaymentYears: number;
  n: number;
  inSchool: boolean;
  loanType: string;
  monthsUntilGrad: number;
  gracePeriod: number;
  totalDeferMonths: number;
  /** Simple interest accrued in school + grace on an UNSUBSIDIZED loan, capitalized at repayment start. */
  capitalizedInterest: number;
  /** Interest the government pays on a SUBSIDIZED loan over the same period. */
  subsidy: number;
  effectivePrincipal: number;
  monthlyPayment: number;
  totalPaid: number;
  totalInterestRepayment: number;
}

/**
 * Fixed-payment amortization over the chosen term (not an income-driven plan). Interest during school and grace is
 * simple interest on the full balance (assumes it was all disbursed on day one), capitalized at repayment start for
 * unsubsidized loans. Shared by index.ts and the panel so they cannot disagree (the panel used to turn "No grace
 * period" into 6 months).
 */
export function computeStudentLoan(values: Record<string, string>): StudentLoanCalc | null {
  const principal = parseFloat(values.loanBalance);
  const annualRate = parseFloat(values.interestRate) / 100;
  if (isNaN(principal) || isNaN(annualRate) || principal <= 0) return null;

  const repaymentYears = parseInt(values.repaymentTerm, 10) || 10;
  const inSchool = values.inSchool === 'yes';
  const monthsUntilGrad = parseInt(values.monthsUntilGraduation, 10) || 0;
  const loanType = values.loanType || 'unsubsidized';
  const graceRaw = parseInt(values.gracePeriodMonths, 10);
  const gracePeriod = isNaN(graceRaw) ? 6 : graceRaw;

  const monthlyRate = annualRate / 12;
  const totalDeferMonths = inSchool ? monthsUntilGrad + gracePeriod : 0;
  const accrued = principal * monthlyRate * totalDeferMonths;
  const capitalizedInterest = inSchool && loanType === 'unsubsidized' ? accrued : 0;
  const subsidy = inSchool && loanType === 'subsidized' ? accrued : 0;
  const effectivePrincipal = principal + capitalizedInterest;
  const n = repaymentYears * 12;
  const monthlyPayment = pmt(effectivePrincipal, monthlyRate, n);
  const totalPaid = monthlyPayment * n;

  return {
    principal, annualRate, monthlyRate, repaymentYears, n, inSchool, loanType, monthsUntilGrad, gracePeriod,
    totalDeferMonths, capitalizedInterest, subsidy, effectivePrincipal, monthlyPayment, totalPaid,
    totalInterestRepayment: totalPaid - effectivePrincipal,
  };
}
