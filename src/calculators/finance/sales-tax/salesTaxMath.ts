const roundCents = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * Sales tax add / extract. Tax is rounded to the cent (as retailers do) so that pre-tax + tax = total always holds.
 * add: tax = round(net x r), total = net + tax.   extract: net = round(total / (1 + r)), tax = total - net.
 */
export function salesTaxFigures(mode: string, amount: number, rate: number) {
  if (mode !== 'add') {
    const net = roundCents(amount / (1 + rate));
    return { net, tax: amount - net, gross: amount };
  }
  const tax = roundCents(amount * rate);
  return { net: amount, tax, gross: amount + tax };
}
