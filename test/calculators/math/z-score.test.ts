import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/z-score/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Z-score calculator', () => {
  it('calculates Z = 1.5 for x=85, μ=70, σ=10', () => {
    const r = config.calculate({ rawScore: '85', mean: '70', stddev: '10' });
    near(parseNumber(getValue(r, 'zscore')), 1.5);
  });

  it('shows formula applied', () => {
    const r = config.calculate({ rawScore: '85', mean: '70', stddev: '10' });
    expect(getValue(r, 'formula')).toContain('z =');
    expect(getValue(r, 'formula')).toContain('85');
  });

  it('calculates cumulative probability', () => {
    const r = config.calculate({ rawScore: '85', mean: '70', stddev: '10' });
    const prob = parseFloat(getValue(r, 'probability'));
    expect(prob).toBeGreaterThan(0.9);
    expect(prob).toBeLessThan(1);
  });

  it('shows percentile rank', () => {
    const r = config.calculate({ rawScore: '85', mean: '70', stddev: '10' });
    expect(getValue(r, 'percentile')).toContain('%');
  });

  it('shows above probability', () => {
    const r = config.calculate({ rawScore: '85', mean: '70', stddev: '10' });
    expect(getValue(r, 'aboveProb')).toContain('%');
  });

  it('shows interpretation for close to average', () => {
    const r = config.calculate({ rawScore: '100', mean: '100', stddev: '10' });
    expect(getValue(r, 'interpretation')).toContain('average');
  });

  it('shows interpretation for significantly above', () => {
    const r = config.calculate({ rawScore: '130', mean: '100', stddev: '10' });
    expect(getValue(r, 'interpretation')).toContain('Significantly');
  });

  it('shows chart data', () => {
    const r = config.calculate({ rawScore: '85', mean: '70', stddev: '10' });
    const chart = r.find(x => x.id === '_chartData');
    expect(chart).toBeTruthy();
    expect(chart!.value).toContain('z');
  });

  it('returns empty for sigma <= 0', () => {
    const r = config.calculate({ rawScore: '85', mean: '70', stddev: '0' });
    expect(r).toEqual([]);
  });

  it('returns empty for NaN input', () => {
    const r = config.calculate({ rawScore: 'abc', mean: '70', stddev: '10' });
    expect(r).toEqual([]);
  });
});
