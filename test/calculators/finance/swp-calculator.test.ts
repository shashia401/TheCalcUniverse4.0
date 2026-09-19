import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/swp-calculator';
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

describe('SWP Calculator', () => {
  it('corpus of ₹1,00,00,000 @ 8% with ₹50,000/mo withdrawal lasts 30+ years', () => {
    const r = config.calculate({
      corpus: '10000000',
      expectedReturn: '8',
      monthlyWithdrawal: '50000',
      withdrawalPeriod: '30',
    });
    expect(parseInr(getValue(r, 'finalValue'))).toBeGreaterThan(0);
    expect(parseInr(getValue(r, 'totalWithdrawn'))).toBeGreaterThan(0);
  });

  it('corpus of ₹50,00,000 @ 6% with ₹1,00,000/mo withdrawal depletes before 5 years', () => {
    const r = config.calculate({
      corpus: '5000000',
      expectedReturn: '6',
      monthlyWithdrawal: '100000',
      withdrawalPeriod: '5',
    });
    expect(parseInr(getValue(r, 'finalValue'))).toBeLessThan(0);
  });

  it('zero return: corpus depletes exactly at corpus / monthly', () => {
    const r = config.calculate({
      corpus: '1200000',
      expectedReturn: '0',
      monthlyWithdrawal: '10000',
      withdrawalPeriod: '10',
    });
    near(parseInr(getValue(r, 'finalValue')), 0, 500);
  });

  it('zero return with exact depletion: corpus lasts exactly N years', () => {
    const r = config.calculate({
      corpus: '600000',
      expectedReturn: '0',
      monthlyWithdrawal: '10000',
      withdrawalPeriod: '5',
    });
    near(parseInr(getValue(r, 'finalValue')), 0, 500);
  });

  it('withdrawal larger than corpus: fails immediately', () => {
    const r = config.calculate({
      corpus: '100000',
      expectedReturn: '8',
      monthlyWithdrawal: '500000',
      withdrawalPeriod: '5',
    });
    expect(parseInr(getValue(r, 'finalValue'))).toBeLessThan(0);
  });

  it('very small withdrawal relative to corpus: final value positive', () => {
    const r = config.calculate({
      corpus: '10000000',
      expectedReturn: '8',
      monthlyWithdrawal: '1000',
      withdrawalPeriod: '30',
    });
    expect(parseInr(getValue(r, 'finalValue'))).toBeGreaterThan(0);
  });

  it('computes correctly for decimal return rate', () => {
    const r = config.calculate({
      corpus: '10000000',
      expectedReturn: '7.5',
      monthlyWithdrawal: '50000',
      withdrawalPeriod: '20',
    });
    expect(parseInr(getValue(r, 'finalValue'))).toBeGreaterThan(0);
  });

  it('returns empty when corpus is 0', () => {
    const r = config.calculate({
      corpus: '0',
      expectedReturn: '8',
      monthlyWithdrawal: '50000',
      withdrawalPeriod: '30',
    });
    expect(r).toEqual([]);
  });

  it('returns empty when withdrawalPeriod is 0', () => {
    const r = config.calculate({
      corpus: '10000000',
      expectedReturn: '8',
      monthlyWithdrawal: '50000',
      withdrawalPeriod: '0',
    });
    expect(r).toEqual([]);
  });

  it('returns empty when monthlyWithdrawal is 0', () => {
    const r = config.calculate({
      corpus: '10000000',
      expectedReturn: '8',
      monthlyWithdrawal: '0',
      withdrawalPeriod: '30',
    });
    expect(r).toEqual([]);
  });

  it('total investment equals corpus', () => {
    const r = config.calculate({
      corpus: '10000000',
      expectedReturn: '8',
      monthlyWithdrawal: '50000',
      withdrawalPeriod: '30',
    });
    expect(parseInr(getValue(r, 'totalInvested'))).toBe(10000000);
  });

  it('withdrawal chart contains year 1 data point', () => {
    const r = config.calculate({
      corpus: '10000000',
      expectedReturn: '8',
      monthlyWithdrawal: '50000',
      withdrawalPeriod: '30',
    });
    const chart = getValue(r, '_withdrawalChart');
    expect(chart.length).toBeGreaterThan(10);
    expect(chart).toContain('year');
    expect(chart).toContain('1');
  });
});
