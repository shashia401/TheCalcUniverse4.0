import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/limit-calculator/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Limit calculator', () => {
  it('limit of (x^2-1)/(x-1) as x → 1 = 2', () => {
    const r = config.calculate({ expression: '(x^2-1)/(x-1)', approachValue: '1', direction: 'both' });
    near(parseNumber(getValue(r, 'limit')), 2, 0.01);
  });

  it('limit of sin(x)/x as x → 0 = 1', () => {
    const r = config.calculate({ expression: 'sin(x)/x', approachValue: '0', direction: 'both' });
    near(parseNumber(getValue(r, 'limit')), 1, 0.01);
  });

  it('limit of x^2 as x → 3 = 9', () => {
    const r = config.calculate({ expression: 'x^2', approachValue: '3', direction: 'both' });
    near(parseNumber(getValue(r, 'limit')), 9, 0.01);
  });

  it('left-hand limit of x^2 as x → 3 = 9', () => {
    const r = config.calculate({ expression: 'x^2', approachValue: '3', direction: 'left' });
    near(parseNumber(getValue(r, 'limit')), 9, 0.01);
  });

  it('right-hand limit of x^2 as x → 3 = 9', () => {
    const r = config.calculate({ expression: 'x^2', approachValue: '3', direction: 'right' });
    near(parseNumber(getValue(r, 'limit')), 9, 0.01);
  });

  it('limit of cos(x) as x → 0 = 1', () => {
    const r = config.calculate({ expression: 'cos(x)', approachValue: '0', direction: 'both' });
    near(parseNumber(getValue(r, 'limit')), 1, 0.01);
  });

  it('limit of tan(x) as x → 0 = 0', () => {
    const r = config.calculate({ expression: 'tan(x)', approachValue: '0', direction: 'both' });
    near(parseNumber(getValue(r, 'limit')), 0, 0.01);
  });

  it('limit of sqrt(x) as x → 4 = 2', () => {
    const r = config.calculate({ expression: 'sqrt(x)', approachValue: '4', direction: 'both' });
    near(parseNumber(getValue(r, 'limit')), 2, 0.01);
  });

  it('limit of (x^2-4)/(x-2) as x → 2 = 4', () => {
    const r = config.calculate({ expression: '(x^2-4)/(x-2)', approachValue: '2', direction: 'both' });
    near(parseNumber(getValue(r, 'limit')), 4, 0.01);
  });

  it('returns empty for empty expression', () => {
    const r = config.calculate({ expression: '', approachValue: '1', direction: 'both' });
    expect(r).toEqual([]);
  });

  it('returns empty for NaN approach value', () => {
    const r = config.calculate({ expression: 'x^2', approachValue: 'abc', direction: 'both' });
    expect(r).toEqual([]);
  });

  it('returns empty for invalid expression', () => {
    const r = config.calculate({ expression: 'bad!!!', approachValue: '1', direction: 'both' });
    expect(r).toEqual([]);
  });

  it('reports left and right limits for both sides', () => {
    const r = config.calculate({ expression: 'x^2', approachValue: '2', direction: 'both' });
    expect(getValue(r, 'leftLimit')).toBeTruthy();
    expect(getValue(r, 'rightLimit')).toBeTruthy();
  });

  it('reports isContinuous for continuous functions', () => {
    const r = config.calculate({ expression: 'x^2', approachValue: '2', direction: 'both' });
    const cont = getValue(r, 'isContinuous');
    expect(cont).toContain('Yes');
  });

  it('includes approach table', () => {
    const r = config.calculate({ expression: 'x^2', approachValue: '2', direction: 'both' });
    expect(getValue(r, 'approachTable')).toContain('x → 2');
  });

  it('uses pi constant: limit of sin(pi * x) / (pi * x) as x → 0', () => {
    const r = config.calculate({ expression: 'sin(pi*x)/(pi*x)', approachValue: '0', direction: 'both' });
    near(parseNumber(getValue(r, 'limit')), 1, 0.01);
  });

  it('does not report leftLimit for left-only direction', () => {
    const r = config.calculate({ expression: 'x^2', approachValue: '3', direction: 'left' });
    expect(() => getValue(r, 'leftLimit')).toThrow();
  });

  it('does not report rightLimit for right-only direction', () => {
    const r = config.calculate({ expression: 'x^2', approachValue: '3', direction: 'right' });
    expect(() => getValue(r, 'rightLimit')).toThrow();
  });
});
