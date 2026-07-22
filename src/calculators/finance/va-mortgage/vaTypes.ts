export interface VAData {
  homePrice: number;
  downPaymentDollars: number;
  downPaymentPct: number;
  baseLoanAmount: number;
  totalLoanAmount: number;
  fundingFeeRate: number;
  fundingFeeAmount: number;
  fundingFeePaidUpfront: string;
  fundingFeeExempt: boolean;
  principalAndInterest: number;
  monthlyTax: number;
  monthlyInsurance: number;
  monthlyHOA: number;
  totalMonthlyPayment: number;
  interestRate: number;
  loanTerm: number;
  vaUseType: string;
}

export function fmt(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtK(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export function calcMonthlyPI(loanAmt: number, annualRate: number, termYears: number): number {
  if (loanAmt <= 0) return 0;
  const monthlyRate = annualRate / 100 / 12;
  const n = termYears * 12;
  if (monthlyRate === 0) return loanAmt / n;
  return (loanAmt * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -n));
}
