import { fvAnnuity, fvLumpSum, pmt } from '../../../utils/financial';

export interface LeaseVsBuy {
  leaseTerm: number;
  buyTerm: number;
  totalLeaseCost: number;
  loanPrincipal: number;
  monthlyBuyPayment: number;
  /** Payments actually made inside the comparison window. */
  buyPaid: number;
  /** Loan still owed when the window ends (you must repay it to sell, or carry it if you keep the car). */
  loanBalance: number;
  /** Estimated vehicle value when the window ends. */
  residualValue: number;
  /** Cash out + remaining debt - what the car is worth. */
  netBuyCost: number;
  leaseWins: boolean;
  tie: boolean;
  savings: number;
}

/**
 * Compare leasing against buying over the lease term. Buying is charged for everything paid AND for the loan
 * that is still outstanding, then credited with the car's value (the balance would have to be cleared to sell).
 * Sales tax: lease tax is charged on each monthly payment; purchase tax is on the price and financed with the loan.
 */
export function leaseVsBuy(values: Record<string, string>): LeaseVsBuy | null {
  const price = parseFloat(values.vehiclePrice);
  const leasePayment = parseFloat(values.leasePayment);
  const buyAPR = parseFloat(values.buyAPR);
  if (![price, leasePayment, buyAPR].every(Number.isFinite) || price <= 0 || leasePayment < 0) return null;

  const leaseDown = parseFloat(values.leaseDownPayment) || 0;
  const leaseTerm = parseFloat(values.leaseTerm || '36');
  const buyTerm = parseFloat(values.buyLoanTerm || '60');
  const buyDown = parseFloat(values.buyDownPayment) || 0;
  const taxRate = (parseFloat(values.salesTax) || 0) / 100;
  // 0% depreciation is a valid input; only a blank field falls back to the 15% default.
  const deprRaw = parseFloat(values.depreciationRate);
  const deprPct = (Number.isFinite(deprRaw) ? deprRaw : 15) / 100;

  const totalLeaseCost = leaseDown + leasePayment * leaseTerm * (1 + taxRate);

  const loanPrincipal = Math.max(0, price * (1 + taxRate) - buyDown);
  const r = buyAPR / 100 / 12;
  const monthlyBuyPayment = loanPrincipal > 0 ? pmt(loanPrincipal, r, buyTerm) : 0;
  const k = Math.min(leaseTerm, buyTerm);
  const buyPaid = monthlyBuyPayment * k;
  const loanBalance = Math.max(0, fvLumpSum(loanPrincipal, r, k) - fvAnnuity(monthlyBuyPayment, r, k));
  const residualValue = price * Math.pow(1 - deprPct, leaseTerm / 12);
  const netBuyCost = Math.min(buyDown, price * (1 + taxRate)) + buyPaid + loanBalance - residualValue;

  const diff = netBuyCost - totalLeaseCost;
  return {
    leaseTerm, buyTerm, totalLeaseCost, loanPrincipal, monthlyBuyPayment, buyPaid, loanBalance, residualValue,
    netBuyCost, leaseWins: diff > 0, tie: Math.abs(diff) < 0.5, savings: Math.abs(diff),
  };
}
