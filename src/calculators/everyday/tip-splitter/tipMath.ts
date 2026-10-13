// Pure bill-split maths in whole cents, shared by index.ts and the panel (the panel used to parse "÷4" out of a label).
// Money is handled as integer cents so the shares add up EXACTLY to the grand total: every person pays the rounded-down
// share and the leftover cents are handed out one each to the first people.

export interface TipSplit {
  people: number;
  billCents: number;
  taxCents: number;
  tipCents: number;
  totalCents: number;
  /** what each person pays, in cents; sums exactly to totalCents */
  shares: number[];
  /** each person's share of the tip, in cents; sums exactly to tipCents */
  tipShares: number[];
  lowShare: number;
  highShare: number;
  /** how many people pay the higher share */
  highCount: number;
}

/** Distribute `total` cents over n people: floor share each, remainder cents (one each) to the first people. */
export function allocate(total: number, n: number): number[] {
  const base = Math.floor(total / n);
  const extra = total - base * n;
  return Array.from({ length: n }, (_, i) => base + (i < extra ? 1 : 0));
}

export function splitBill(values: Record<string, string>): TipSplit | null {
  const bill = parseFloat(values.billAmount);
  const pct = parseFloat(values.tipPercent || '18');
  const people = values.numPeople?.trim() ? parseInt(values.numPeople, 10) : 1;
  const tax = values.taxAmount?.trim() ? parseFloat(values.taxAmount) : 0;
  if (!(bill > 0) || !Number.isFinite(pct) || pct < 0 || !Number.isInteger(people) || people < 1 || !Number.isFinite(tax) || tax < 0) return null;
  const billCents = Math.round(bill * 100);
  const taxCents = Math.round(tax * 100);
  if (taxCents >= billCents) return null; // tax cannot be the whole bill: nothing left to tip on
  const tipCents = Math.round(((billCents - taxCents) * pct) / 100);
  const totalCents = billCents + tipCents;
  const shares = allocate(totalCents, people);
  const tipShares = allocate(tipCents, people);
  const lowShare = shares[shares.length - 1];
  const highShare = shares[0];
  return {
    people, billCents, taxCents, tipCents, totalCents, shares, tipShares, lowShare, highShare,
    highCount: highShare === lowShare ? 0 : shares.filter((s) => s === highShare).length,
  };
}
