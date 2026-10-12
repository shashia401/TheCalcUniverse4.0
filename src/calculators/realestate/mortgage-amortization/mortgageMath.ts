import { pmt } from '../../../utils/financial';

/** Flat PMI estimate: 0.8% of the loan per year when less than 20% is put down (an assumption, not a quote). */
export const PMI_ANNUAL_RATE = 0.008;
/** Homeowners Protection Act: PMI terminates automatically when the scheduled balance reaches 78% of the original value. */
export const PMI_AUTO_TERMINATION_LTV = 0.78;

export interface Mortgage {
  homePrice: number;
  downPayment: number;
  downPct: number; // percent, 0-100
  principal: number;
  annualRate: number; // fraction
  monthlyRate: number;
  years: number;
  numPayments: number;
  monthlyPI: number;
  monthlyPropertyTax: number;
  monthlyInsurance: number;
  hoaMonthly: number;
  monthlyPMI: number;
  /** Number of monthly payments that include PMI (0 when down payment >= 20%). */
  pmiMonths: number;
  /** Month-1 PITI + HOA + PMI. */
  totalMonthly: number;
  /** Everything paid over the term, excluding the down payment (PMI only while it applies). */
  totalPaid: number;
  totalInterest: number;
}

/** Parse the calculator form into one consistent model; null when incomplete/invalid. */
export function parseMortgage(values: Record<string, string>): Mortgage | null {
  const homePrice = parseFloat(values.homePrice);
  const annualRate = parseFloat(values.interestRate) / 100;
  const years = parseFloat(values.loanTerm || '30');
  if (!Number.isFinite(homePrice) || !Number.isFinite(annualRate) || !(years > 0) || homePrice <= 0) return null;

  const pct = parseFloat(values.downPaymentPct);
  const downPayment =
    values.downPaymentPct !== '' && values.downPaymentPct !== undefined && Number.isFinite(pct)
      ? homePrice * (pct / 100)
      : parseFloat(values.downPayment) || 0;
  const principal = homePrice - downPayment;
  if (principal <= 0) return null;

  const downPct = (downPayment / homePrice) * 100;
  const monthlyRate = annualRate / 12;
  const numPayments = Math.round(years * 12);
  const monthlyPI = pmt(principal, monthlyRate, numPayments);

  const taxPct = (parseFloat(values.propertyTax) || 0) / 100;
  const monthlyPropertyTax = (homePrice * taxPct) / 12;
  const monthlyInsurance = (parseFloat(values.homeInsurance) || 0) / 12;
  const hoaMonthly = parseFloat(values.hoaFee) || 0;

  const hasPMI = downPct < 20;
  const monthlyPMI = hasPMI ? (principal * PMI_ANNUAL_RATE) / 12 : 0;
  let pmiMonths = 0;
  if (hasPMI) {
    let balance = principal;
    while (pmiMonths < numPayments && balance > PMI_AUTO_TERMINATION_LTV * homePrice) {
      balance -= monthlyPI - balance * monthlyRate;
      pmiMonths++;
    }
  }

  const totalMonthly = monthlyPI + monthlyPropertyTax + monthlyInsurance + hoaMonthly + monthlyPMI;
  const totalPaid =
    (monthlyPI + monthlyPropertyTax + monthlyInsurance + hoaMonthly) * numPayments + monthlyPMI * pmiMonths;
  return {
    homePrice, downPayment, downPct, principal, annualRate, monthlyRate, years, numPayments, monthlyPI,
    monthlyPropertyTax, monthlyInsurance, hoaMonthly, monthlyPMI, pmiMonths, totalMonthly, totalPaid,
    totalInterest: monthlyPI * numPayments - principal,
  };
}
