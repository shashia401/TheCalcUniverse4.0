import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/average-return/index';
import { getValue, parseNumber } from '../../helpers';

describe('average return calculator', () => {
  it('calculates CAGR from start/end values', () => {
    const r = config.calculate({
      inputMode: 'simple',
      startingValue: '10000',
      endingValue: '20000',
      years: '5',
      returnsInput: '',
    });
    const cagr = parseNumber(getValue(r, 'cagr'));
    expect(cagr).toBeGreaterThan(14);
    expect(cagr).toBeLessThan(15);
  });

  it('calculates from annual returns list', () => {
    const r = config.calculate({
      inputMode: 'annual',
      startingValue: '',
      endingValue: '',
      years: '',
      returnsInput: '10, 20, -5, 15, 8',
    });
    const cagr = parseNumber(getValue(r, 'cagr'));
    expect(cagr).toBeGreaterThan(8);
    expect(cagr).toBeLessThan(10);
    const simpleAvg = parseNumber(getValue(r, 'simpleAvg'));
    expect(simpleAvg).toBeGreaterThan(cagr);
  });

  it('shows best/worst year in annual mode', () => {
    const r = config.calculate({
      inputMode: 'annual',
      startingValue: '',
      endingValue: '',
      years: '',
      returnsInput: '25, -10, 15, 30, 5',
    });
    const bestYear = parseNumber(getValue(r, 'bestYear'));
    expect(bestYear).toBe(30);
    const positiveYears = parseNumber(getValue(r, 'positiveYears'));
    expect(positiveYears).toBe(4);
  });

  it('returns empty for missing or too few inputs', () => {
    const r = config.calculate({
      inputMode: 'simple',
      startingValue: '',
      endingValue: '',
      years: '',
      returnsInput: '',
    });
    expect(r).toEqual([]);
  });
});

describe('average-return – audit regressions', () => {
  it('annual mode: impossible return below -100% yields no result (was "NaN%")', () => {
    expect(config.calculate({ inputMode: 'annual', returnsInput: '10, -150, 5' })).toEqual([]);
  });
  it('annual mode: +50,-50,+35,+45,-10 -> arithmetic 14.00%, CAGR 5.73% (product 1.3213^(1/5)-1), not 7.4%', () => {
    const r = config.calculate({ inputMode: 'annual', returnsInput: '50, -50, 35, 45, -10' });
    expect(r.find((x: any) => x.id === 'simpleAvg')!.value).toBe('14.00%');
    expect(r.find((x: any) => x.id === 'cagr')!.value).toBe('5.73%');
  });
  it('Marcus example: 22,-8,15,5,-3 -> CAGR 5.62%, average 6.20%', () => {
    const r = config.calculate({ inputMode: 'annual', returnsInput: '22, -8, 15, 5, -3' });
    expect(r.find((x: any) => x.id === 'cagr')!.value).toBe('5.62%');
    expect(r.find((x: any) => x.id === 'simpleAvg')!.value).toBe('6.20%');
  });
});
