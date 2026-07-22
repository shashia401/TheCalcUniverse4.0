import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/slope/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Slope calculator', () => {
  it('slope between (2,3) and (5,7) = 4/3', () => {
    const r = config.calculate({ x1: '2', y1: '3', x2: '5', y2: '7' });
    near(parseNumber(getValue(r, 'slope')), 1.3333, 0.001);
  });

  it('shows slope as fraction', () => {
    const r = config.calculate({ x1: '2', y1: '3', x2: '5', y2: '7' });
    expect(getValue(r, 'slopeFraction')).toContain('4/3');
  });

  it('shows slope-intercept form', () => {
    const r = config.calculate({ x1: '2', y1: '3', x2: '5', y2: '7' });
    expect(getValue(r, 'slopeIntercept')).toContain('y =');
  });

  it('shows point-slope form', () => {
    const r = config.calculate({ x1: '2', y1: '3', x2: '5', y2: '7' });
    expect(getValue(r, 'pointSlope')).toContain('=');
  });

  it('shows standard form', () => {
    const r = config.calculate({ x1: '2', y1: '3', x2: '5', y2: '7' });
    expect(getValue(r, 'standardForm')).toContain('=');
  });

  it('vertical line returns undefined slope', () => {
    const r = config.calculate({ x1: '3', y1: '1', x2: '3', y2: '5' });
    expect(getValue(r, 'slope')).toContain('Undefined');
  });

  it('horizontal line returns slope of 0', () => {
    const r = config.calculate({ x1: '1', y1: '4', x2: '5', y2: '4' });
    near(parseNumber(getValue(r, 'slope')), 0);
  });

  it('returns distance between points', () => {
    const r = config.calculate({ x1: '0', y1: '0', x2: '3', y2: '4' });
    near(parseNumber(getValue(r, 'distance')), 5);
  });

  it('returns y-intercept', () => {
    const r = config.calculate({ x1: '1', y1: '2', x2: '3', y2: '6' });
    expect(getValue(r, 'yIntercept')).toContain('0,');
  });

  it('returns empty for NaN input', () => {
    const r = config.calculate({ x1: 'a', y1: '2', x2: '3', y2: '4' });
    expect(r).toEqual([]);
  });
});
