import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/percentage/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Percentage calculator', () => {
  it('what is X% of Y — 20% of 200 = 40', () => {
    const r = config.calculate({ mode: 'percentOf', x: '20', y: '200' });
    near(parseNumber(getValue(r, 'result')), 40);
  });

  it('X is what percent of Y — 30 is what % of 150 = 20%', () => {
    const r = config.calculate({ mode: 'whatPercent', x: '30', y: '150' });
    expect(getValue(r, 'result')).toContain('20%');
  });

  it('percent change — 50 to 75 = 50% increase', () => {
    const r = config.calculate({ mode: 'pctChange', x: '50', y: '75' });
    expect(getValue(r, 'result')).toContain('increase');
    expect(getValue(r, 'result')).toContain('50');
  });

  it('percent change — decrease', () => {
    const r = config.calculate({ mode: 'pctChange', x: '100', y: '80' });
    expect(getValue(r, 'result')).toContain('decrease');
  });

  it('add X% to Y', () => {
    const r = config.calculate({ mode: 'addPct', x: '10', y: '200' });
    near(parseNumber(getValue(r, 'result')), 220);
  });

  it('subtract X% from Y', () => {
    const r = config.calculate({ mode: 'subPct', x: '25', y: '200' });
    near(parseNumber(getValue(r, 'result')), 150);
  });

  it('returns empty when y is 0', () => {
    const r = config.calculate({ mode: 'percentOf', x: '50', y: '0' });
    expect(r).toEqual([]);
  });

  it('returns all result fields for each mode', () => {
    const r = config.calculate({ mode: 'percentOf', x: '10', y: '100' });
    expect(getValue(r, 'formula')).toBeTruthy();
    expect(getValue(r, 'example')).toBeTruthy();
  });
});
