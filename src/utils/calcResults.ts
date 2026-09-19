import type { CalculatorResult } from '../types/calculator';

export function findResult(results: CalculatorResult[], id: string): CalculatorResult | undefined {
  return results.find((r) => r.id === id);
}

export function getResultValue(results: CalculatorResult[], id: string): string {
  return findResult(results, id)?.value ?? '';
}

/** Parses a displayed result value ("$1,234.56") back into a number. */
export function parseAmount(s: string): number {
  return parseFloat(s.replace(/[$%,+\s]/g, '').replace(/,/g, '')) || 0;
}
