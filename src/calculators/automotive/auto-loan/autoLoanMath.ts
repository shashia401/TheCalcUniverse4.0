import { pmt } from '../../../utils/financial';

export interface AutoLoan {
  price: number;
  down: number;
  tradeInValue: number;
  tradeInOwed: number;
  taxPct: number;
  fees: number;
  months: number;
  /** Trade-in value minus payoff; negative = underwater. */
  netTradeIn: number;
  negativeEquity: number;
  taxableAmount: number;
  salesTax: number;
  outTheDoor: number;
  loanAmount: number;
  monthlyPayment: number;
  totalPaid: number;
  totalInterest: number;
  /** Everything you pay in total: loan payments + cash down + positive trade-in equity. */
  totalCost: number;
}

/**
 * Returns null for incomplete input. loanAmount <= 0 is returned as-is (the caller shows "no loan needed").
 * Sales tax: in states that give a trade-in credit, tax applies to price minus the trade-in VALUE (the
 * allowance), whether or not the car is paid off — an underwater trade-in still earns the credit and the
 * negative equity is simply financed on top. `tradeInCredit = false` models states with no credit (e.g. CA, VA).
 */
export function autoLoan(values: Record<string, string>): AutoLoan | null {
  const price = parseFloat(values.vehiclePrice);
  const apr = parseFloat(values.interestRate) / 100;
  const months = parseFloat(values.loanTerm || '60');
  if (!Number.isFinite(price) || !Number.isFinite(apr) || price <= 0 || !(months > 0)) return null;

  const down = parseFloat(values.downPayment) || 0;
  const tradeInValue = parseFloat(values.tradeInValue) || 0;
  const tradeInOwed = parseFloat(values.tradeInOwed) || 0;
  const taxPct = parseFloat(values.salesTaxPct) || 0;
  const fees = parseFloat(values.titleRegFees) || 0;
  const credit = values.tradeInTaxCredit !== 'no';

  const netTradeIn = tradeInValue - tradeInOwed;
  const negativeEquity = Math.max(0, -netTradeIn);
  const positiveEquity = Math.max(0, netTradeIn);
  const taxableAmount = Math.max(0, price - (credit ? tradeInValue : 0));
  const salesTax = taxableAmount * (taxPct / 100);
  const outTheDoor = price + salesTax + fees;
  const loanAmount = outTheDoor - netTradeIn - down;
  const monthlyPayment = loanAmount > 0 ? pmt(loanAmount, apr / 12, months) : 0;
  const totalPaid = monthlyPayment * months;
  return {
    price, down, tradeInValue, tradeInOwed, taxPct, fees, months, netTradeIn, negativeEquity, taxableAmount,
    salesTax, outTheDoor, loanAmount, monthlyPayment, totalPaid,
    totalInterest: loanAmount > 0 ? totalPaid - loanAmount : 0,
    totalCost: totalPaid + down + positiveEquity,
  };
}
