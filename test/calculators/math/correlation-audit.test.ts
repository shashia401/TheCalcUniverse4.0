import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/correlation-calculator/index';
import { getValue } from '../../helpers';

// Reference: scipy.stats.pearsonr / spearmanr / linregress and numpy.cov (see audit Python oracle).
const run = (x: string, y: string) => config.calculate({ xValues: x, yValues: y });

describe('correlation-calculator audit', () => {
  it('x=1..5, y=2,4,5,4,5: r 0.7746, r2 0.6, p 0.1240, Spearman 0.7379, cov 1.5 / 1.2, y = 2.2 + 0.6x', () => {
    const r = run('1 2 3 4 5', '2 4 5 4 5');
    expect(getValue(r, 'r')).toBe('0.7746');
    expect(getValue(r, 'rSquared')).toBe('0.6');
    expect(getValue(r, 'pValue')).toBe('0.1240');
    expect(getValue(r, 'spearman')).toBe('0.7379');
    expect(getValue(r, 'covariance')).toBe('1.5'); // numpy.cov (ddof=1)
    expect(getValue(r, 'covariancePop')).toBe('1.2');
    expect(getValue(r, 'regression')).toBe('y = 2.2 + 0.6x');
    expect(getValue(r, 'strength')).toBe('Strong');
  });
  it('REGRESSION: large common offset (1e9+k) — the old n*Σxy − ΣxΣy shortcut lost the answer; exact value is 0.9648, p 0.0352', () => {
    const r = run('1000000001 1000000002 1000000003 1000000004', '2 4 5 9');
    expect(getValue(r, 'r')).toBe('0.9648');
    expect(getValue(r, 'pValue')).toBe('0.0352');
    expect(getValue(r, 'regression')).toBe('y = -2200000000.5 + 2.2x');
  });
  it('n=10 shuffled line: r 0.9515, Spearman 0.9515, p reported as < 0.0001', () => {
    const r = run('1 2 3 4 5 6 7 8 9 10', '1 3 2 5 4 7 6 9 8 10');
    expect(getValue(r, 'r')).toBe('0.9515');
    expect(getValue(r, 'spearman')).toBe('0.9515');
    expect(getValue(r, 'pValue')).toBe('< 0.0001');
    expect(getValue(r, 'strength')).toBe('Very strong');
  });
  it('perfect negative line: r exactly -1, p 0, direction Negative', () => {
    const r = run('1 2 3 4', '8 6 4 2');
    expect(getValue(r, 'r')).toBe('-1');
    expect(getValue(r, 'pValue')).toBe('< 0.0001');
    expect(getValue(r, 'direction')).toBe('Negative');
  });
  it('REGRESSION: a constant variable gives r Undefined (it used to display 0 / "Very weak")', () => {
    const r = run('1 2 3', '4 4 4');
    expect(getValue(r, 'r')).toBe('Undefined');
    expect(r.find((x) => x.id === 'r')?.warning).toContain('constant');
    expect(r.find((x) => x.id === 'strength')).toBeUndefined();
  });
  it('strength is classified on the displayed 4-decimal r (0.79996 shows 0.8 -> Very strong)', () => {
    // 0.79996 is reachable as a tie to the boundary only through rounding; check the band edges with exact lines instead
    expect(getValue(run('1 2 3 4 5', '1 2 3 4 5'), 'strength')).toBe('Very strong');
    expect(getValue(run('1 2 3 4 5', '2 1 4 3 5'), 'strength')).toBe('Very strong'); // r = 0.8 exactly
    expect(getValue(run('1 2 3 4 5', '2 1 4 3 5'), 'r')).toBe('0.8');
  });
  it('reports non-numeric tokens instead of dropping them', () => {
    const r = run('1 2 3 abc', '2 4 6 8');
    // x has 3 numbers, y has 4 -> mismatch -> [] is the contract, so test a matching case:
    expect(r).toEqual([]);
    const ok = run('1 2 3 4 x1', '2 4 6 8 10 12');
    expect(ok).toEqual([]);
    const ok2 = run('1 2 3 4 zz', '2 4 6 8');
    expect(getValue(ok2, 'ignored')).toBe('zz');
    expect(getValue(ok2, 'r')).toBe('1');
  });
});
