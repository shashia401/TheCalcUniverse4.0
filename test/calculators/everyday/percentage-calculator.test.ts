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

  it('"add": 200 + 15% = 230', () => {
    const r = config.calculate({ mode: 'add', x: '15', y: '200' });
    near(parseNumber(getValue(r, 'result')), 230);
  });

  it('"subtract": 200 − 15% = 170', () => {
    const r = config.calculate({ mode: 'subtract', x: '15', y: '200' });
    near(parseNumber(getValue(r, 'result')), 170);
  });

  it('"whatpct" returns empty when divisor is zero', () => {
    const r = config.calculate({ mode: 'whatpct', x: '5', y: '0' });
    expect(r).toEqual([]);
  });

  it('returns empty when y is missing', () => {
    const r = config.calculate({ mode: 'of', x: '25', y: '' });
    expect(r).toEqual([]);
  });
});
