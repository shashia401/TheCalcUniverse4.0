import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/sip-calculator';
import { getValue, near } from '../../helpers';

function parseInr(s: string): number {
  let str = s.replace(/[₹,]/g, '').trim();
  let sign = 1;
  if (str.startsWith('-')) { sign = -1; str = str.slice(1); }
  const m = str.match(/^([\d.]+)(Cr|L)?$/);
  if (!m) throw new Error(`Cannot parse INR: "${s}"`);
  let n = parseFloat(m[1]);
  if (m[2] === 'Cr') n *= 1e7;
  else if (m[2] === 'L') n *= 1e5;
  return n * sign;
}

function sipFv(monthly: number, annualRate: number, years: number, lumpsum = 0): number {
  const mr = annualRate / 100 / 12;
  const months = years * 12;
  if (mr === 0) return lumpsum + monthly * months;
  const fvLumpsum = lumpsum * Math.pow(1 + mr, months);
  const fvSip = monthly * ((Math.pow(1 + mr, months) - 1) / mr) * (1 + mr);
  return fvLumpsum + fvSip;
}

describe('SIP Calculator', () => {
  it('SIP only: ₹10,000/mo @ 12% for 10 years', () => {
    const r = config.calculate({
      lumpsum: '', monthlyInvestment: '10000', expectedReturn: '12', timePeriod: '10',
    });
    const fv = parseInr(getValue(r, 'futureValue'));
    near(fv, sipFv(10000, 12, 10), 500);
  });

  it('SIP only: ₹5,000/mo @ 15% for 5 years', () => {
    const r = config.calculate({
      lumpsum: '', monthlyInvestment: '5000', expectedReturn: '15', timePeriod: '5',
    });
    const fv = parseInr(getValue(r, 'futureValue'));
    near(fv, sipFv(5000, 15, 5), 1000);
  });

  it('SIP only: ₹5,000/mo @ 12% for 30 years', () => {
    const r = config.calculate({
      lumpsum: '', monthlyInvestment: '5000', expectedReturn: '12', timePeriod: '30',
    });
    const fv = parseInr(getValue(r, 'futureValue'));
    near(fv, sipFv(5000, 12, 30), 50000);
  });

  it('SIP only: ₹100/mo @ 8% for 5 years', () => {
    const r = config.calculate({
      lumpsum: '', monthlyInvestment: '100', expectedReturn: '8', timePeriod: '5',
    });
    const fv = parseInr(getValue(r, 'futureValue'));
    near(fv, sipFv(100, 8, 5), 10);
  });

  it('SIP only: decimal return ₹10,000/mo @ 12.5% for 10 years', () => {
    const r = config.calculate({
      lumpsum: '', monthlyInvestment: '10000', expectedReturn: '12.5', timePeriod: '10',
    });
    const fv = parseInr(getValue(r, 'futureValue'));
    near(fv, sipFv(10000, 12.5, 10), 500);
  });

  it('Lumpsum only: ₹10,00,000 @ 12% for 10 years', () => {
    const r = config.calculate({
      lumpsum: '1000000', monthlyInvestment: '', expectedReturn: '12', timePeriod: '10',
    });
    const fv = parseInr(getValue(r, 'futureValue'));
    near(fv, sipFv(0, 12, 10, 1000000), 20000);
    const result = r.find(x => x.id === 'futureValue');
    expect(result?.label).toContain('Lumpsum Only');
  });

  it('Lumpsum + SIP: ₹5,00,000 + ₹5,000/mo @ 12% for 10 years', () => {
    const r = config.calculate({
      lumpsum: '500000', monthlyInvestment: '5000', expectedReturn: '12', timePeriod: '10',
    });
    const fv = parseInr(getValue(r, 'futureValue'));
    near(fv, sipFv(5000, 12, 10, 500000), 5000);
    const result = r.find(x => x.id === 'futureValue');
    expect(result?.label).toContain('Lumpsum + SIP');
  });

  it('zero return: total invested equals final value', () => {
    const r = config.calculate({
      lumpsum: '50000', monthlyInvestment: '5000', expectedReturn: '0', timePeriod: '5',
    });
    near(parseInr(getValue(r, 'futureValue')), 50000 + 5000 * 12 * 5);
    near(parseInr(getValue(r, 'totalInvested')), 50000 + 5000 * 12 * 5);
    near(parseInr(getValue(r, 'totalReturns')), 0);
  });

  it('returns empty when both lumpsum and monthly are 0', () => {
    const r = config.calculate({
      lumpsum: '0', monthlyInvestment: '0', expectedReturn: '12', timePeriod: '10',
    });
    expect(r).toEqual([]);
  });

  it('returns empty when timePeriod is missing', () => {
    const r = config.calculate({
      lumpsum: '', monthlyInvestment: '5000', expectedReturn: '12', timePeriod: '',
    });
    expect(r).toEqual([]);
  });

  it('totalReturns equals futureValue minus totalInvested', () => {
    const r = config.calculate({
      lumpsum: '500000', monthlyInvestment: '10000', expectedReturn: '12', timePeriod: '10',
    });
    const fv = parseInr(getValue(r, 'futureValue'));
    const invested = parseInr(getValue(r, 'totalInvested'));
    const returns = parseInr(getValue(r, 'totalReturns'));
    near(returns, fv - invested, 1);
  });

  it('wealth chart contains year 1 data point', () => {
    const r = config.calculate({
      lumpsum: '500000', monthlyInvestment: '10000', expectedReturn: '12', timePeriod: '10',
    });
    const chart = getValue(r, 'wealthChart');
    expect(chart.length).toBeGreaterThan(10);
    expect(chart).toContain('1');
  });
});
