import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/annuity-payout';
import { getValue, parseMoney, parseNumber, near } from '../../helpers';

describe('annuity-payout', () => {
  it('payout mode: computes monthly payout from principal', () => {
    const r = config.calculate({
      solveFor: 'payout',
      principal: '500000',
      annualReturn: '5',
      payoutFrequency: 'monthly',
      desiredYears: '25',
      inflationAdjust: 'nominal',
    });
    expect(r.length).toBeGreaterThanOrEqual(6);
    expect(getValue(r, 'pmt')).toMatch(/\$/);
    const pmt = parseNumber(getValue(r, 'pmt'));
    expect(pmt).toBeGreaterThan(2500);
    expect(pmt).toBeLessThan(3500);
  });

  it('payout mode: computes annual payout when frequency is annually', () => {
    const r = config.calculate({
      solveFor: 'payout',
      principal: '500000',
      annualReturn: '5',
      payoutFrequency: 'annually',
      desiredYears: '20',
      inflationAdjust: 'nominal',
    });
    expect(getValue(r, 'pmt')).toMatch(/\$/);
    const pmt = parseNumber(getValue(r, 'pmt'));
    expect(pmt).toBeGreaterThan(35000);
    expect(pmt).toBeLessThan(45000);
  });

  it('duration mode: computes how long money lasts', () => {
    const r = config.calculate({
      solveFor: 'duration',
      principal: '500000',
      annualReturn: '5',
      payoutFrequency: 'monthly',
      payoutAmount: '2500',
      inflationAdjust: 'nominal',
    });
    expect(getValue(r, 'duration')).toMatch(/years/);
    expect(parseNumber(getValue(r, 'duration'))).toBeGreaterThan(0);
  });

  it('duration mode: infinite result when payout <= interest', () => {
    const r = config.calculate({
      solveFor: 'duration',
      principal: '500000',
      annualReturn: '5',
      payoutFrequency: 'monthly',
      payoutAmount: '500',
      inflationAdjust: 'nominal',
    });
    expect(r).toHaveLength(1);
    expect(getValue(r, 'infinite')).toMatch(/indefinitely/);
  });

  it('payout mode: inflation adjusted result includes infAdjPmt', () => {
    const r = config.calculate({
      solveFor: 'payout',
      principal: '500000',
      annualReturn: '5',
      payoutFrequency: 'monthly',
      desiredYears: '25',
      inflationAdjust: 'adjusted',
    });
    expect(getValue(r, 'infAdjPmt')).toMatch(/\$\S+\/mo/);
  });

  it('zero-rate: payout = principal / months', () => {
    const r = config.calculate({
      solveFor: 'payout',
      principal: '120000',
      annualReturn: '0',
      payoutFrequency: 'monthly',
      desiredYears: '10',
      inflationAdjust: 'nominal',
    });
    near(parseNumber(getValue(r, 'pmt')), 1000);
  });

  it('returns empty when principal is missing', () => {
    const r = config.calculate({ solveFor: 'payout' });
    expect(r).toHaveLength(0);
  });
});
