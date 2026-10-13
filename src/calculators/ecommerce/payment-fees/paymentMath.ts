/**
 * Payment-processor fee math shared by index.ts and PaymentFeesPanel.tsx
 * (the panel must never re-parse formatted result strings).
 *
 * Rates are published US standard card rates:
 *  - Stripe (stripe.com/pricing, checked Oct 2026): 2.9% + $0.30 domestic cards; +1.5% for international cards.
 *  - PayPal (paypal.com/us/business/paypal-business-fees, checked Oct 2026): PayPal Checkout 3.49% + $0.49;
 *    standard credit/debit card payments 2.99% + $0.49; +1.50% for international commercial transactions.
 *  - Square in-person (tap/dip/swipe) 2.6% + $0.15 on the Free plan: taken from 2026 fee guides, NOT confirmed on
 *    Square's own page (it did not load for automated reading), so treat as indicative. Square online is 3.3% + $0.30.
 * Processors round the fee to the cent.
 */
export interface FeeStructure {
  rate: number;
  fixed: number;
  label: string;
}

export const FEE_MAP: Record<string, FeeStructure> = {
  'stripe-domestic': { rate: 0.029, fixed: 0.3, label: 'Stripe (domestic card)' },
  'stripe-international': { rate: 0.044, fixed: 0.3, label: 'Stripe (international card)' },
  'paypal-domestic': { rate: 0.0349, fixed: 0.49, label: 'PayPal Checkout (domestic)' },
  'paypal-cards': { rate: 0.0299, fixed: 0.49, label: 'PayPal standard card payment' },
  'paypal-international': { rate: 0.0499, fixed: 0.49, label: 'PayPal Checkout (international)' },
  square: { rate: 0.026, fixed: 0.15, label: 'Square (in-person)' },
};

/** Half-up to the cent, immune to binary noise. */
export const roundCents = (x: number): number => Math.round((x + (x < 0 ? -1e-9 : 1e-9)) * 100) / 100;

export const feeOn = (amount: number, f: FeeStructure): number => roundCents(amount * f.rate + f.fixed);

export interface PaymentFigures {
  /** Amount the customer pays. */
  charged: number;
  fee: number;
  net: number;
  /** Fee as a percent of the amount charged (effective rate). */
  effectivePct: number;
}

/** Forward: customer pays `amount`, you receive amount - fee. */
export function forwardFee(amount: number, f: FeeStructure): PaymentFigures {
  const fee = feeOn(amount, f);
  return { charged: amount, fee, net: amount - fee, effectivePct: (fee / amount) * 100 };
}

/** Reverse: smallest invoice (whole cents) whose net payout is at least `target`. */
export function reverseInvoice(target: number, f: FeeStructure): PaymentFigures {
  let invoice = Math.ceil(((target + f.fixed) / (1 - f.rate)) * 100 - 1e-6) / 100;
  const netOf = (inv: number) => roundCents(inv - feeOn(inv, f));
  while (netOf(invoice) < roundCents(target)) invoice = roundCents(invoice + 0.01);
  while (invoice > 0.01 && netOf(roundCents(invoice - 0.01)) >= roundCents(target)) invoice = roundCents(invoice - 0.01);
  const fee = feeOn(invoice, f);
  return { charged: invoice, fee, net: invoice - fee, effectivePct: (fee / invoice) * 100 };
}
