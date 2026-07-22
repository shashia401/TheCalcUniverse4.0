import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/integral-calculator/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Integral calculator', () => {
  it('integrates x^2 from 0 to 1 — result ~ 1/3', () => {
    const r = config.calculate({ expression: 'x^2', lowerBound: '0', upperBound: '1', n: '100' });
    near(parseNumber(getValue(r, 'result')), 1 / 3, 0.001);
  });

  it('integrates x from 0 to 2 — result = 2', () => {
    const r = config.calculate({ expression: 'x', lowerBound: '0', upperBound: '2', n: '100' });
    near(parseNumber(getValue(r, 'result')), 2, 0.001);
  });

  it('integrates 3x^2 from 0 to 2 — result = 8', () => {
    const r = config.calculate({ expression: '3*x^2', lowerBound: '0', upperBound: '2', n: '100' });
    near(parseNumber(getValue(r, 'result')), 8, 0.01);
  });

  it('integrates 1 (constant) from 0 to 5 — result = 5', () => {
    const r = config.calculate({ expression: '1', lowerBound: '0', upperBound: '5', n: '100' });
    near(parseNumber(getValue(r, 'result')), 5, 0.001);
  });

  it('handles reversed bounds (a > b) — same absolute area', () => {
    const r = config.calculate({ expression: 'x^2', lowerBound: '1', upperBound: '0', n: '100' });
    near(parseNumber(getValue(r, 'result')), -1 / 3, 0.001);
  });

  it('returns empty for empty expression', () => {
    const r = config.calculate({ expression: '', lowerBound: '0', upperBound: '1', n: '100' });
    expect(r).toEqual([]);
  });

  it('returns empty for NaN lower bound', () => {
    const r = config.calculate({ expression: 'x^2', lowerBound: 'abc', upperBound: '1', n: '100' });
    expect(r).toEqual([]);
  });

  it('returns empty for NaN upper bound', () => {
    const r = config.calculate({ expression: 'x^2', lowerBound: '0', upperBound: 'abc', n: '100' });
    expect(r).toEqual([]);
  });

  it('returns empty when a === b', () => {
    const r = config.calculate({ expression: 'x^2', lowerBound: '3', upperBound: '3', n: '100' });
    expect(r).toEqual([]);
  });

  it('returns empty for invalid expression', () => {
    const r = config.calculate({ expression: 'bad input!', lowerBound: '0', upperBound: '1', n: '100' });
    expect(r).toEqual([]);
  });

  it('defaults n to 100 when not provided', () => {
    const r = config.calculate({ expression: 'x^2', lowerBound: '0', upperBound: '1' });
    near(parseNumber(getValue(r, 'result')), 1 / 3, 0.001);
  });

  it('uses Simpson method in output', () => {
    const r = config.calculate({ expression: 'x^2', lowerBound: '0', upperBound: '1', n: '100' });
    expect(getValue(r, 'method')).toContain('Simpson');
  });

  it('reports subdivisions', () => {
    const r = config.calculate({ expression: 'x^2', lowerBound: '0', upperBound: '1', n: '50' });
    const sub = getValue(r, 'subdivisions');
    expect(parseInt(sub)).toBe(50);
  });

  it('includes trapezoidal result for comparison', () => {
    const r = config.calculate({ expression: 'x^2', lowerBound: '0', upperBound: '1', n: '100' });
    expect(getValue(r, 'trapResult')).toBeTruthy();
  });

  it('includes step-by-step work', () => {
    const r = config.calculate({ expression: 'x^2', lowerBound: '0', upperBound: '1', n: '100' });
    expect(getValue(r, 'work')).toContain('Step size');
  });

  it('forces n even when odd is provided', () => {
    const r = config.calculate({ expression: 'x^2', lowerBound: '0', upperBound: '1', n: '51' });
    const sub = parseInt(getValue(r, 'subdivisions'));
    expect(sub % 2).toBe(0);
  });

  it('integrates linear function (x + 1) from 0 to 3 — result = 7.5', () => {
    const r = config.calculate({ expression: 'x + 1', lowerBound: '0', upperBound: '3', n: '100' });
    near(parseNumber(getValue(r, 'result')), 7.5, 0.01);
  });

  it('handles expression with multiplication: 2*x', () => {
    const r = config.calculate({ expression: '2*x', lowerBound: '0', upperBound: '4', n: '100' });
    near(parseNumber(getValue(r, 'result')), 16, 0.01);
  });
});
