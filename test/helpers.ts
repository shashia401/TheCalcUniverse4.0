import { expect } from 'vitest';
import type { CalculatorResult } from '../src/types/calculator';
import type { InputField } from '../src/types/calculator';
import { inferDemoValues } from '../src/utils/demoValues';

/**
 * Build a demo values record from calculator input fields.
 * Uses the same inferDemoValues logic as the production CalculatorLayout,
 * correctly extracting leading numbers from placeholders like "e.g., 350".
 */
export function buildDemoValues(inputs: InputField[]): Record<string, string> {
  const values: Record<string, string> = {};
  inferDemoValues(inputs, values);
  // Fallback for any field still without a value after inferDemoValues
  for (const input of inputs) {
    if (values[input.id] !== undefined) continue;
    if (input.type === 'number' || input.type === 'percentage') {
      values[input.id] = '10';
    } else if (input.type === 'select' && input.options?.length > 0) {
      values[input.id] = input.options[0].value;
    } else if (input.type === 'date') {
      values[input.id] = '2026-06-15';
    } else {
      values[input.id] = 'test';
    }
  }
  return values;
}

/**
 * Find a result row by id. Throws with a helpful message listing available ids
 * if not found — much nicer than getting `undefined.value`.
 */
export function getResult(results: CalculatorResult[], id: string): CalculatorResult {
  const r = results.find((x) => x.id === id);
  if (!r) {
    throw new Error(
      `No result with id "${id}". Available ids: [${results.map((x) => x.id).join(', ')}]`,
    );
  }
  return r;
}

export function getValue(results: CalculatorResult[], id: string): string {
  return getResult(results, id).value;
}

/**
 * Parse a money string the calculators emit. Handles:
 *   "$1,234.56", "$5.50M", "$-100", "-$100", "+$50", "$0.0001"
 */
export function parseMoney(s: string): number {
  let str = s.trim();
  let sign = 1;
  if (str.startsWith('-') || str.startsWith('+')) {
    if (str.startsWith('-')) sign = -1;
    str = str.slice(1);
  }
  // strip leading $ then any internal $
  str = str.replace(/\$/g, '').replace(/,/g, '').replace(/\s/g, '');
  if (str.startsWith('-')) {
    sign *= -1;
    str = str.slice(1);
  }
  const m = /^([\d.]+)(M|K)?$/i.exec(str);
  if (!m) throw new Error(`Cannot parse money: "${s}"`);
  let n = parseFloat(m[1]);
  const suffix = m[2]?.toUpperCase();
  if (suffix === 'M') n *= 1_000_000;
  if (suffix === 'K') n *= 1_000;
  return n * sign;
}

/** Parse "12.5%" or "+5.25%" or "-3%" → number */
export function parsePercent(s: string): number {
  return parseFloat(s.replace(/[%+\s,]/g, ''));
}

/** Pull the first number out of "365 days" or "1.234567 years" */
export function parseNumber(s: string): number {
  const m = /(-?[\d.,]+)/.exec(s);
  if (!m) throw new Error(`Cannot parse number: "${s}"`);
  return parseFloat(m[1].replace(/,/g, ''));
}

/**
 * Floating-point assertion. tol is absolute tolerance.
 * For money values default to 1 cent; for ratios use a smaller tol.
 */
export function near(actual: number, expected: number, tol = 0.01): void {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tol);
}

/** Standard amortized-loan monthly payment formula */
export function pmtFormula(principal: number, annualRatePct: number, months: number): number {
  const r = annualRatePct / 100 / 12;
  if (r === 0) return principal / months;
  return (principal * (r * Math.pow(1 + r, months))) / (Math.pow(1 + r, months) - 1);
}

/** Future value of a single lump sum at periodic compounding */
export function fvLump(principal: number, annualRate: number, years: number, n: number): number {
  return principal * Math.pow(1 + annualRate / n, n * years);
}

/** Future value of a series of monthly contributions (ordinary annuity, monthly compounding) */
export function fvMonthlyContrib(monthly: number, annualRate: number, years: number): number {
  const i = annualRate / 12;
  const months = years * 12;
  if (i === 0) return monthly * months;
  return monthly * ((Math.pow(1 + i, months) - 1) / i);
}
