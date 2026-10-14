// Oracle: python fractions.Fraction (exact).
import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/percentage/index';
import { computePercentage } from '../../../src/calculators/math/percentage/percentageMath';
import { getValue, getResult } from '../../helpers';

const run = (mode: string, x: string, y: string) => config.calculate({ mode, x, y });

describe('percentage audit', () => {
  it('small results are not rounded away: 0.5% of 3 = 0.015, 20% of 0.07 = 0.014 (float 0.014000000000000002)', () => {
    expect(getValue(run('percentOf', '0.5', '3'), 'result')).toBe('0.015');
    expect(getValue(run('percentOf', '20', '0.07'), 'result')).toBe('0.014');
  });
  it('quick-reference values', () => {
    expect(getValue(run('percentOf', '10', '200'), 'result')).toBe('20');
    expect(getValue(run('percentOf', '25', '80'), 'result')).toBe('20');
    expect(getValue(run('whatPercent', '50', '200'), 'result')).toBe('25%');
    expect(getValue(run('addPct', '25', '100'), 'result')).toBe('125');
    expect(getValue(run('subPct', '25', '100'), 'result')).toBe('75');
    expect(getValue(run('pctChange', '50', '75'), 'result')).toBe('50% increase');
    expect(getValue(run('pctChange', '75', '50'), 'result')).toBe('33.3333% decrease');
  });
  it('+25% then -25% does not return to 100 (FAQ: 93.75)', () => {
    expect(getValue(run('subPct', '25', '125'), 'result')).toBe('93.75');
  });
  it('pct change uses |x| as base: -50 -> -25 is a 50% increase (old code said decrease)', () => {
    const r = run('pctChange', '-50', '-25');
    expect(getValue(r, 'result')).toBe('50% increase');
    expect(getResult(r, 'result').color).toBe('positive');
  });
  it('no change reads as no change', () => {
    expect(getValue(run('pctChange', '40', '40'), 'result')).toBe('0% (no change)');
  });
  it('subtracting more than 100% is not clamped to 0 (100 - 150% = -50)', () => {
    const r = run('subPct', '150', '100');
    expect(getValue(r, 'result')).toBe('-50');
    expect(getValue(r, 'decreaseAmount')).toBe('150');
  });
  it('Y = 0 only breaks "X is what % of Y"', () => {
    expect(getValue(run('percentOf', '20', '0'), 'result')).toBe('0');
    expect(getValue(run('addPct', '20', '0'), 'result')).toBe('0');
    expect(getResult(run('whatPercent', '20', '0'), 'error').value).toBe('Undefined');
    expect(getResult(run('pctChange', '0', '5'), 'error').value).toBe('Undefined');
  });
  it('explainSteps uses the same numbers as the result', () => {
    const steps = config.explainSteps!({ mode: 'percentOf', x: '15', y: '200' });
    expect(steps.map((s) => s.expr)).toEqual(['15% = 15 ÷ 100 = 0.15', '0.15 × 200 = 30']);
    expect(config.explainSteps!({ mode: 'pctChange', x: '0', y: '5' })).toEqual([]);
  });
  it('invalid input is incomplete', () => {
    expect(computePercentage('percentOf', 'abc', '5').kind).toBe('incomplete');
    expect(run('percentOf', '1e500', '5')).toEqual([]);
  });
});
