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

describe('annuity-payout – audit regressions', () => {
  const pay = {
    solveFor: 'payout', principal: '500000', annualReturn: '5', payoutFrequency: 'monthly',
    desiredYears: '30', inflationAdjust: 'adjusted',
  };
  it('inflation-adjusted payout deflates by 1.03^years (3% ANNUAL inflation)', () => {
    const r = config.calculate(pay);
    // independent: 2684.1081 / 1.03^30 = 1105.82 (old monthly-compounded 1.0025^360 gave 1092.50)
    expect(getValue(r, 'infAdjPmt')).toBe('$1,105.82/mo');
  });
  it('duration: $400k @6%, $3,000/mo lasts n = ln(3000/(3000-2000))/ln(1.005) = 220.27 mo = 18y 4m', () => {
    const r = config.calculate({
      solveFor: 'duration', principal: '400000', annualReturn: '6', payoutFrequency: 'monthly',
      payoutAmount: '3000', inflationAdjust: 'nominal',
    });
    expect(getValue(r, 'duration')).toBe('18 years and 4 months');
  });
  it('duration never renders "12 months" (59.7 months -> 5 years)', () => {
    const r = config.calculate({
      solveFor: 'duration', principal: '59700', annualReturn: '0', payoutFrequency: 'monthly',
      payoutAmount: '1000', inflationAdjust: 'nominal',
    });
    expect(getValue(r, 'duration')).toBe('5 years');
  });
  it('annual payout duration keeps the fractional year (100k @5%, 20k/yr = 5.896 yr -> 5y 11m)', () => {
    const r = config.calculate({
      solveFor: 'duration', principal: '100000', annualReturn: '5', payoutFrequency: 'annually',
      payoutAmount: '20000', inflationAdjust: 'nominal',
    });
    // independent: ln(20000/15000)/ln(1.05) = 5.8963 yr = 70.76 mo -> 71 mo
    expect(getValue(r, 'duration')).toBe('5 years and 11 months');
  });
});
