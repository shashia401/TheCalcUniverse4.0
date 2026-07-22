import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/percentage/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('math-percentage-calculator', () => {
  it('computes X% of Y: 20% of 200 = 40', () => {
    const r = config.calculate({ mode: 'percentOf', x: '20', y: '200' });
    near(parseNumber(getValue(r, 'result')), 40);
  });

  it('computes what percent: 50 is 25% of 200', () => {
    const r = config.calculate({ mode: 'whatPercent', x: '50', y: '200' });
    expect(getValue(r, 'result')).toContain('25');
  });

  it('computes percent change: 50 to 75 is 50% increase', () => {
    const r = config.calculate({ mode: 'pctChange', x: '50', y: '75' });
    expect(getValue(r, 'result')).toContain('50');
    expect(getValue(r, 'result')).toContain('increase');
  });

  it('computes percent change: 75 to 50 is 33.3% decrease', () => {
    const r = config.calculate({ mode: 'pctChange', x: '75', y: '50' });
    expect(getValue(r, 'result')).toContain('decrease');
  });

  it('adds X% to Y: 25% added to 200 = 250', () => {
    const r = config.calculate({ mode: 'addPct', x: '25', y: '200' });
    near(parseNumber(getValue(r, 'result')), 250);
  });

  it('subtracts X% from Y: 20% off 100 = 80', () => {
    const r = config.calculate({ mode: 'subPct', x: '20', y: '100' });
    near(parseNumber(getValue(r, 'result')), 80);
  });

  it('handles division by zero in whatPercent mode', () => {
    const r = config.calculate({ mode: 'whatPercent', x: '50', y: '0' });
    expect(r).toHaveLength(1);
    expect(r[0].id).toBe('error');
  });

  it('handles undefined percent change from zero', () => {
    const r = config.calculate({ mode: 'pctChange', x: '0', y: '50' });
    expect(r[0].id).toBe('error');
  });

  it('returns empty for NaN inputs', () => {
    expect(config.calculate({})).toHaveLength(0);
    expect(config.calculate({ mode: 'percentOf', x: 'abc', y: '200' })).toHaveLength(0);
  });

  it('has educational content', () => {
    expect(config.educational.formula).toBeTruthy();
    expect(config.educational.faqs!.length).toBeGreaterThanOrEqual(5);
    expect(config.educational.variables!.length).toBeGreaterThanOrEqual(3);
    expect(config.educational.citations!.length).toBeGreaterThanOrEqual(1);
    expect(config.educational.diagram).toBeTruthy();
  });
});
