import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/everyday/percentage-calculator';
import { getValue, parseNumber, parsePercent, near } from '../../helpers';

describe('percentage-calculator', () => {
  it('"of": 25% of 200 = 50', () => {
    const r = config.calculate({ mode: 'of', x: '25', y: '200' });
    near(parseNumber(getValue(r, 'result')), 50);
    near(parseNumber(getValue(r, 'remainder')), 150);
  });

  it('"whatpct": 50 is what % of 200 = 25%', () => {
    const r = config.calculate({ mode: 'whatpct', x: '50', y: '200' });
    near(parsePercent(getValue(r, 'result')), 25);
  });

  it('"change": 100 → 150 = +50%', () => {
    const r = config.calculate({ mode: 'change', x: '100', y: '150' });
    near(parsePercent(getValue(r, 'result')), 50);
  });

  it('"change": 100 → 75 = -25%', () => {
    const r = config.calculate({ mode: 'change', x: '100', y: '75' });
    near(parsePercent(getValue(r, 'result')), -25);
  });

  it('matches the worked example for adding 8.75% tax to $65 (regression: narrative previously said $70.69/$5.69, but the formatter shows up to 4 decimal places, giving 70.6875/5.6875)', () => {
    const r = config.calculate({ mode: 'add', x: '8.75', y: '65' });
    expect(getValue(r, 'result')).toBe('70.6875');
    expect(getValue(r, 'added')).toBe('+5.6875');
  });

  it('"add": 200 + 15% = 230', () => {
    const r = config.calculate({ mode: 'add', x: '15', y: '200' });
    near(parseNumber(getValue(r, 'result')), 230);
  });

  it('"subtract": 200 − 15% = 170', () => {
    const r = config.calculate({ mode: 'subtract', x: '15', y: '200' });
    near(parseNumber(getValue(r, 'result')), 170);
  });

  it('"whatpct" explains that dividing by zero is undefined', () => {
    const r = config.calculate({ mode: 'whatpct', x: '5', y: '0' });
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ id: 'error', value: 'Undefined' });
  });

  it('"change" from zero explains that the percent change is undefined', () => {
    const r = config.calculate({ mode: 'change', x: '0', y: '50' });
    expect(getValue(r, 'error')).toBe('Undefined');
    expect(getValue(r, 'explanation')).toContain('division by zero');
    expect(config.explainSteps!({ mode: 'change', x: '0', y: '50' })).toEqual([]);
  });

  it('returns empty when y is missing', () => {
    const r = config.calculate({ mode: 'of', x: '25', y: '' });
    expect(r).toEqual([]);
  });
});

// Values below came from the retired /math/math-percentage-calculator/ audit (exact-fraction oracle); the same
// questions now run through the surviving calculator.
describe('percentage-calculator: cases absorbed from the retired math percentage page', () => {
  const run = (mode: string, x: string, y: string) => config.calculate({ mode, x, y });

  it('small results are not rounded away: 0.5% of 3 = 0.015, 20% of 0.07 = 0.014 (float 0.014000000000000002)', () => {
    expect(getValue(run('of', '0.5', '3'), 'result')).toBe('0.015');
    expect(getValue(run('of', '20', '0.07'), 'result')).toBe('0.014');
  });
  it('quick-reference values', () => {
    expect(getValue(run('of', '10', '200'), 'result')).toBe('20');
    expect(getValue(run('of', '25', '80'), 'result')).toBe('20');
    expect(getValue(run('whatpct', '50', '200'), 'result')).toBe('25%');
    expect(getValue(run('add', '25', '100'), 'result')).toBe('125');
    expect(getValue(run('subtract', '25', '100'), 'result')).toBe('75');
    expect(getValue(run('change', '50', '75'), 'result')).toBe('+50%');
    expect(getValue(run('change', '75', '50'), 'result')).toBe('-33.3333%');
  });
  it('+25% then -25% does not return to 100 (FAQ: 93.75); undoing +25% takes a 20% cut', () => {
    expect(getValue(run('subtract', '25', '125'), 'result')).toBe('93.75');
    expect(getValue(run('subtract', '20', '125'), 'result')).toBe('100');
  });
  it('no change reads as +0%, and subtracting more than 100% is not clamped (100 - 150% = -50)', () => {
    expect(getValue(run('change', '40', '40'), 'result')).toBe('+0%');
    expect(getValue(run('subtract', '150', '100'), 'result')).toBe('-50');
  });
  it('Y = 0 only breaks "X is what % of Y"', () => {
    expect(getValue(run('of', '20', '0'), 'result')).toBe('0');
    expect(getValue(run('add', '20', '0'), 'result')).toBe('0');
  });
  it('FAQ numbers: 15% of 200 = 30; markup vs margin on $50 cost / $100 price is 100% vs 50%', () => {
    expect(getValue(run('of', '15', '200'), 'result')).toBe('30');
    expect(getValue(run('change', '50', '100'), 'result')).toBe('+100%');
    expect(getValue(run('whatpct', '50', '100'), 'result')).toBe('50%');
  });
  it('explainSteps uses the same numbers as the result', () => {
    const steps = config.explainSteps!({ mode: 'of', x: '15', y: '200' });
    expect(steps[0].expr).toBe('15% = 15 ÷ 100 = 0.15');
    expect(steps[1].expr).toBe('0.15 × 200 = 30');
  });
  it('invalid input is incomplete', () => {
    expect(run('of', 'abc', '5')).toEqual([]);
  });
  it('has the FAQs and quick reference carried over from the retired page', () => {
    expect(config.educational.faqs!.length).toBeGreaterThanOrEqual(9);
    expect(config.educational.faqs!.some((f) => /markup and a margin/i.test(f.question))).toBe(true);
    expect(config.educational.quickReference!.length).toBeGreaterThanOrEqual(10);
  });
});
