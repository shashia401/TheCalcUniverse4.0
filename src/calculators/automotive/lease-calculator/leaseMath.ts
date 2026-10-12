export interface Lease {
  msrp: number;
  negotiatedPrice: number;
  downPayment: number;
  tradeInValue: number;
  leaseTerm: number;
  residualValuePct: number;
  rateInputType: 'mf' | 'apr';
  moneyFactor: number;
  /** Equivalent APR = money factor x 2400. */
  apr: number;
  /** Negotiated price - cap cost reductions + acquisition fee (fee capitalised). */
  adjustedCapCost: number;
  residualValue: number;
  monthlyDepreciation: number;
  monthlyFinanceCharge: number;
  baseMonthlyPayment: number;
  monthlyTax: number;
  totalMonthlyPayment: number;
  /** All payments plus drive-off cash (down payment + trade-in equity). */
  totalLeaseCost: number;
}

/**
 * Closed-end lease: payment = (adjCap - residual)/term + (adjCap + residual) x MF, tax on the monthly payment.
 * Returns null when incomplete or when the residual exceeds the cap cost (payment would be <= 0).
 */
export function lease(values: Record<string, string>): Lease | null {
  const msrp = parseFloat(values.msrp);
  const negotiatedPrice = parseFloat(values.negotiatedPrice);
  const residualValuePct = parseFloat(values.residualValuePct);
  if (![msrp, negotiatedPrice, residualValuePct].every(Number.isFinite) || msrp <= 0 || negotiatedPrice <= 0 || residualValuePct <= 0) return null;

  const rateInputType = values.rateInputType === 'apr' ? 'apr' : 'mf';
  const rateRaw = parseFloat(rateInputType === 'apr' ? values.aprRate : values.moneyFactor);
  if (!Number.isFinite(rateRaw) || rateRaw < 0) return null; // a blank rate must not silently mean a 0% lease
  const moneyFactor = rateInputType === 'apr' ? rateRaw / 2400 : rateRaw;

  const downPayment = parseFloat(values.downPayment) || 0;
  const tradeInValue = parseFloat(values.tradeInValue) || 0;
  const leaseTerm = parseInt(values.leaseTerm, 10) || 36;
  const salesTaxRate = (parseFloat(values.salesTax) || 0) / 100;
  const acquisitionFee = parseFloat(values.acquisitionFee) || 0;

  const adjustedCapCost = negotiatedPrice - downPayment - tradeInValue + acquisitionFee;
  const residualValue = msrp * (residualValuePct / 100);
  const monthlyDepreciation = (adjustedCapCost - residualValue) / leaseTerm;
  const monthlyFinanceCharge = (adjustedCapCost + residualValue) * moneyFactor;
  const baseMonthlyPayment = monthlyDepreciation + monthlyFinanceCharge;
  if (!(baseMonthlyPayment > 0)) return null;
  const monthlyTax = baseMonthlyPayment * salesTaxRate;
  const totalMonthlyPayment = baseMonthlyPayment + monthlyTax;
  return {
    msrp, negotiatedPrice, downPayment, tradeInValue, leaseTerm, residualValuePct, rateInputType, moneyFactor,
    apr: moneyFactor * 2400, adjustedCapCost, residualValue, monthlyDepreciation, monthlyFinanceCharge,
    baseMonthlyPayment, monthlyTax, totalMonthlyPayment,
    totalLeaseCost: totalMonthlyPayment * leaseTerm + downPayment + tradeInValue,
  };
}
