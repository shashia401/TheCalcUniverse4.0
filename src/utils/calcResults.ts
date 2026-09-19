import type { CalculatorResult } from '../types/calculator';

export function findResult(results: CalculatorResult[], id: string): CalculatorResult | undefined {
  return results.find((r) => r.id === id);
}

export function getResultValue(results: CalculatorResult[], id: string): string {
  return findResult(results, id)?.value ?? '';
}
