import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/log/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Log calculator', () => {
  // ── Exact integer results ──
  it('log base 2 of 8 = 3', () => {
    const r = config.calculate({ base: '2', value: '8' });
    near(parseNumber(getValue(r, 'result')), 3);
  });

  it('log base 10 of 100 = 2', () => {
    const r = config.calculate({ base: '10', value: '100' });
    near(parseNumber(getValue(r, 'result')), 2);
  });

  it('log base 2 of 1024 = 10', () => {
    const r = config.calculate({ base: '2', value: '1024' });
    near(parseNumber(getValue(r, 'result')), 10);
  });

  it('log base 3 of 27 = 3', () => {
    const r = config.calculate({ base: '3', value: '27' });
    near(parseNumber(getValue(r, 'result')), 3);
  });

  it('log base 5 of 125 = 3', () => {
    const r = config.calculate({ base: '5', value: '125' });
    near(parseNumber(getValue(r, 'result')), 3);
  });

  it('log base 10 of 1 = 0', () => {
    const r = config.calculate({ base: '10', value: '1' });
    near(parseNumber(getValue(r, 'result')), 0);
  });

  // ── Non-integer results ──
  it('log base 2 of 10 ≈ 3.322', () => {
    const r = config.calculate({ base: '2', value: '10' });
    near(parseNumber(getValue(r, 'result')), 3.322, 0.001);
  });

  it('log base 10 of 2 ≈ 0.301', () => {
    const r = config.calculate({ base: '10', value: '2' });
    near(parseNumber(getValue(r, 'result')), 0.301, 0.001);
  });

  it('log base e of 10 ≈ 2.303', () => {
    const r = config.calculate({ base: '2.718281828', value: '10' });
    near(parseNumber(getValue(r, 'result')), 2.303, 0.01);
  });

  // ── Exponential form for exact logs ──
  it('shows exponential form for exact logarithm', () => {
    const r = config.calculate({ base: '2', value: '8' });
    const expForm = r.find(x => x.id === 'exponentForm');
    expect(expForm).toBeTruthy();
    expect(expForm!.value).toContain('2^3');
  });

  it('shows exponential form for base 10 exact log', () => {
    const r = config.calculate({ base: '10', value: '1000' });
    const expForm = r.find(x => x.id === 'exponentForm');
    expect(expForm).toBeTruthy();
    expect(expForm!.value).toContain('10^3');
  });

  it('no exponential form for non-exact log', () => {
    const r = config.calculate({ base: '2', value: '10' });
    const expForm = r.find(x => x.id === 'exponentForm');
    expect(expForm).toBeFalsy();
  });

  // ── Standard log outputs ──
  it('shows log10(x)', () => {
    const r = config.calculate({ base: '2', value: '8' });
    expect(getValue(r, 'log10')).toBeTruthy();
  });

  it('shows ln(x)', () => {
    const r = config.calculate({ base: '2', value: '8' });
    expect(getValue(r, 'naturalLog')).toBeTruthy();
  });

  it('shows log2(x)', () => {
    const r = config.calculate({ base: '2', value: '8' });
    expect(getValue(r, 'log2')).toBeTruthy();
  });

  it('log10(1000) = 3', () => {
    const r = config.calculate({ base: '2', value: '1000' });
    near(parseNumber(getValue(r, 'log10')), 3);
  });

  it('ln(e^2) ≈ 2', () => {
    const r = config.calculate({ base: '10', value: '7.389056' });
    near(parseNumber(getValue(r, 'naturalLog')), 2, 0.001);
  });

  it('log2(8) = 3', () => {
    const r = config.calculate({ base: '10', value: '8' });
    near(parseNumber(getValue(r, 'log2')), 3);
  });

  // ── Change of base formula display ──
  it('shows change of base formula', () => {
    const r = config.calculate({ base: '2', value: '8' });
    expect(getValue(r, 'changeOfBase')).toContain('log');
    expect(getValue(r, 'changeOfBase')).toContain('=');
  });

  // ── Invalid input tests ──
  it('returns empty for base = 1', () => {
    const r = config.calculate({ base: '1', value: '100' });
    expect(r).toEqual([]);
  });

  it('returns empty for base = 0', () => {
    const r = config.calculate({ base: '0', value: '100' });
    expect(r).toEqual([]);
  });

  it('returns empty for negative base', () => {
    const r = config.calculate({ base: '-2', value: '8' });
    expect(r).toEqual([]);
  });

  it('returns empty for negative value', () => {
    const r = config.calculate({ base: '2', value: '-8' });
    expect(r).toEqual([]);
  });

  it('returns empty for zero value', () => {
    const r = config.calculate({ base: '2', value: '0' });
    expect(r).toEqual([]);
  });

  it('returns empty for NaN input', () => {
    const r = config.calculate({ base: 'abc', value: '100' });
    expect(r).toEqual([]);
  });

  it('returns empty for NaN value', () => {
    const r = config.calculate({ base: '2', value: 'xyz' });
    expect(r).toEqual([]);
  });

  it('returns empty for missing base', () => {
    const r = config.calculate({ value: '8' } as unknown as Record<string, string>);
    expect(r).toEqual([]);
  });

  it('returns empty for missing value', () => {
    const r = config.calculate({ base: '2' } as unknown as Record<string, string>);
    expect(r).toEqual([]);
  });

  // ── Decimal.js precision tests ──
  it('handles non-integer base', () => {
    const r = config.calculate({ base: '2.718', value: '10' });
    expect(r.length).toBeGreaterThan(0);
    expect(parseNumber(getValue(r, 'result'))).toBeGreaterThan(0);
  });

  it('handles fractional value between 0 and 1', () => {
    const r = config.calculate({ base: '10', value: '0.01' });
    near(parseNumber(getValue(r, 'result')), -2);
  });

  it('log10(0.1) = -1', () => {
    const r = config.calculate({ base: '10', value: '0.1' });
    near(parseNumber(getValue(r, 'result')), -1);
  });

  it('log2(0.5) = -1', () => {
    const r = config.calculate({ base: '2', value: '0.5' });
    near(parseNumber(getValue(r, 'result')), -1);
  });

  // ── Large value tests ──
  it('handles very large value', () => {
    const r = config.calculate({ base: '2', value: '1000000000' });
    expect(r.length).toBeGreaterThan(0);
    expect(parseNumber(getValue(r, 'result'))).toBeGreaterThan(0);
  });

  it('handles very small positive value', () => {
    const r = config.calculate({ base: '10', value: '0.000000001' });
    near(parseNumber(getValue(r, 'result')), -9);
  });

  // ── Result structure tests ──
  it('returns all expected result fields', () => {
    const r = config.calculate({ base: '2', value: '8' });
    const ids = r.map(x => x.id);
    expect(ids).toContain('result');
    expect(ids).toContain('log10');
    expect(ids).toContain('naturalLog');
    expect(ids).toContain('log2');
    expect(ids).toContain('changeOfBase');
  });

  it('highlights the logarithm result', () => {
    const r = config.calculate({ base: '2', value: '8' });
    const mainResult = r.find(x => x.id === 'result');
    expect(mainResult).toBeTruthy();
    expect(mainResult!.highlight).toBe(true);
  });

  // ── Known log identities ──
  it('satisfies log_b(b) = 1 for any valid base', () => {
    const bases = ['2', '3', '5', '10', '17'];
    for (const b of bases) {
      const r = config.calculate({ base: b, value: b });
      near(parseNumber(getValue(r, 'result')), 1);
    }
  });

  it('satisfies log_b(1) = 0 for any valid base', () => {
    const bases = ['2', '3', '10', '2.5', '100'];
    for (const b of bases) {
      const r = config.calculate({ base: b, value: '1' });
      near(parseNumber(getValue(r, 'result')), 0);
    }
  });
});
