// Single pure payoff simulation shared by index.ts (result rows) and DebtPayoffPanel.tsx (chart + per-card table),
// so the two can never disagree.
import Decimal from 'decimal.js';

export interface PayoffCard {
  name: string;
  balance: number;
  rate: number; // APR, percent
  min: number; // minimum monthly payment
}

export type PayoffStrategy = 'snowball' | 'avalanche';

export const MAX_PAYOFF_MONTHS = 600;

/** Cards with a balance and an APR typed in (0% is allowed; a blank APR means the card is not filled in). */
export function parseCards(values: Record<string, string>): PayoffCard[] {
  return [1, 2, 3]
    .map((n) => ({
      name: values[`card${n}name`] || `Card ${n}`,
      balance: parseFloat(values[`card${n}balance`]) || 0,
      rate: parseFloat(values[`card${n}rate`]),
      min: Math.max(0, parseFloat(values[`card${n}min`]) || 0),
    }))
    .filter((c) => c.balance > 0 && Number.isFinite(c.rate) && c.rate >= 0);
}

/** Snowball: smallest balance first (ties: higher APR). Avalanche: highest APR first (ties: smaller balance). */
export function orderCards(cards: PayoffCard[], strategy: PayoffStrategy): PayoffCard[] {
  return [...cards].sort((a, b) =>
    strategy === 'snowball' ? a.balance - b.balance || b.rate - a.rate : b.rate - a.rate || a.balance - b.balance,
  );
}

export interface PayoffResult {
  months: number;
  totalInterest: number;
  /** false when payments never outrun interest within MAX_PAYOFF_MONTHS */
  paidOff: boolean;
  /** Total remaining balance at month 0..months */
  timeline: number[];
  /** Per card in payoff-priority order: month it reached zero (null = never) and interest paid on it */
  perCard: Array<{ name: string; month: number | null; interest: number }>;
}

/**
 * Month by month: add interest, pay every minimum (capped at the balance), then pool the extra payment plus
 * the unused minimums of cleared cards and apply the pool to cards in priority order ("rollover").
 */
export function simulatePayoff(cards: PayoffCard[], extraPayment: number, strategy: PayoffStrategy): PayoffResult {
  const order = orderCards(cards, strategy);
  const balances = order.map((c) => c.balance);
  const cardInterest = order.map(() => new Decimal(0));
  const clearedAt: Array<number | null> = order.map(() => null);
  const timeline = [balances.reduce((s, b) => s + b, 0)];
  let month = 0;

  while (balances.some((b) => b > 0) && month < MAX_PAYOFF_MONTHS) {
    month++;
    let pool = Math.max(0, extraPayment);
    const paid = balances.map((b, i) => {
      let minPaid = 0;
      if (b > 0) {
        const interest = new Decimal(b).mul(order[i].rate).div(100).div(12).toNumber();
        cardInterest[i] = cardInterest[i].plus(interest);
        balances[i] = b + interest;
        minPaid = Math.min(order[i].min, balances[i]);
      }
      pool += order[i].min - minPaid; // a cleared card's unused minimum rolls into the pool
      return minPaid;
    });

    for (let i = 0; i < balances.length && pool > 0; i++) {
      if (balances[i] <= 0) continue;
      const pay = Math.min(pool, balances[i] - paid[i]);
      pool -= pay;
      paid[i] += pay;
    }

    for (let i = 0; i < balances.length; i++) {
      balances[i] = Math.max(0, balances[i] - paid[i]);
      if (balances[i] === 0 && clearedAt[i] === null) clearedAt[i] = month;
    }
    timeline.push(balances.reduce((s, b) => s + b, 0));
  }

  const totalInterest = cardInterest.reduce((s, d) => s.plus(d), new Decimal(0)).toNumber();
  return {
    months: month,
    totalInterest,
    paidOff: !balances.some((b) => b > 0),
    timeline,
    perCard: order.map((c, i) => ({ name: c.name, month: clearedAt[i], interest: cardInterest[i].toNumber() })),
  };
}
