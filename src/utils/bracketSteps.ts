interface Bracket {
  rate: number;
  min: number;
  max: number;
}

/**
 * Bracket-by-bracket slices of a taxable amount, e.g. "10% × $12,400.00 = $1,240.00 + 12% × …".
 * Uses the same min/max/rate rows as the calculators' own tax functions; returns '' when nothing is taxable.
 */
export function bracketSlices(taxable: number, brackets: readonly Bracket[], money: (n: number) => string): string {
  const parts: string[] = [];
  for (const b of brackets) {
    if (taxable <= b.min) break;
    const slice = Math.min(taxable, b.max) - b.min;
    parts.push(`${+(b.rate * 100).toFixed(2)}% × ${money(slice)} = ${money(slice * b.rate)}`);
  }
  return parts.join(' + ');
}
