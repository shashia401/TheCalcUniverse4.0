import { pmt } from '../../../utils/financial';

export interface OfferComparison {
  n: number;
  downPayment: number;
  standardRate: number; // percent
  promoRate: number; // percent
  principalA: number;
  principalB: number;
  /** Rebate larger than the loan: the excess comes back as cash, so it offsets what you pay. */
  excessRebate: number;
  monthlyA: number;
  monthlyB: number;
  interestA: number;
  interestB: number;
  totalPaidA: number;
  totalPaidB: number;
  tie: boolean;
  aWins: boolean;
  savings: number;
}

/** Option A = take the rebate + finance at your own rate; Option B = no rebate + promotional rate. null when incomplete. */
export function compareOffers(values: Record<string, string>): OfferComparison | null {
  const vehiclePrice = parseFloat(values.vehiclePrice);
  const standardRate = parseFloat(values.standardRate);
  const n = parseFloat(values.loanTermMonths || '60');
  if (!Number.isFinite(vehiclePrice) || vehiclePrice <= 0 || !Number.isFinite(standardRate) || !(n > 0)) return null;

  const downPayment = parseFloat(values.downPayment) || 0;
  const cashRebate = parseFloat(values.cashRebate) || 0;
  const promoRate = parseFloat(values.promoRate) || 0;

  const loanAmount = vehiclePrice - downPayment;
  if (loanAmount <= 0) return null;
  const principalA = Math.max(0, loanAmount - cashRebate);
  const principalB = loanAmount;
  const excessRebate = Math.max(0, cashRebate - loanAmount);

  const monthlyA = principalA > 0 ? pmt(principalA, standardRate / 1200, n) : 0;
  const monthlyB = pmt(principalB, promoRate / 1200, n);
  const interestA = monthlyA * n - principalA;
  const interestB = monthlyB * n - principalB;
  const totalPaidA = monthlyA * n + downPayment - excessRebate;
  const totalPaidB = monthlyB * n + downPayment;

  const diff = totalPaidB - totalPaidA; // > 0: A cheaper
  const tie = Math.abs(diff) < 0.005;
  return {
    n, downPayment, standardRate, promoRate, principalA, principalB, excessRebate, monthlyA, monthlyB,
    interestA, interestB, totalPaidA, totalPaidB, tie, aWins: diff > 0, savings: Math.abs(diff),
  };
}
