import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/log/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Log calculator', () => {
  it('log base 2 of 8 = 3', () => {
    const r = config.calculate({ base: '2', value: '8' });
    near(parseNumber(getValue(r, 'result')), 3);
  });

  it('log base 10 of 100 = 2', () => {
    const r = config.calculate({ base: '10', value: '100' });
    near(parseNumber(getValue(r, 'result')), 2);
  });

  it('shows exponential form for exact logarithm', () => {
    const r = config.calculate({ base: '2', value: '8' });
    const expForm = r.find(x => x.id === 'exponentForm');
    expect(expForm).toBeTruthy();
    expect(expForm!.value).toContain('2^3');
  });

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

  it('shows change of base formula', () => {
    const r = config.calculate({ base: '2', value: '8' });
    expect(getValue(r, 'changeOfBase')).toContain('log');
  });

  it('returns empty for base = 1', () => {
    const r = config.calculate({ base: '1', value: '100' });
    expect(r).toEqual([]);
  });

  it('returns empty for negative value', () => {
    const r = config.calculate({ base: '2', value: '-8' });
    expect(r).toEqual([]);
  });

  it('returns empty for NaN input', () => {
    const r = config.calculate({ base: 'abc', value: '100' });
    expect(r).toEqual([]);
  });

  it('handles non-integer base', () => {
    const r = config.calculate({ base: '2.718', value: '10' });
    expect(r.length).toBeGreaterThan(0);
    expect(parseNumber(getValue(r, 'result'))).toBeGreaterThan(0);
  });
});
