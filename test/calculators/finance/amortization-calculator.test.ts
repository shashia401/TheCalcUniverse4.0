import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/amortization';
import { getValue, parseMoney, near, pmtFormula } from '../../helpers';

describe('amortization', () => {
  it('matches the canonical PMT formula for $250k @ 6.5% 30yr', () => {
    const r = config.calculate({
      loanAmount: '250000',
      interestRate: '6.5',
      termUnit: 'years',
      loanTerm: '30',
      includeExtra: 'no',
      extraMonthly: '0',
      extraAnnual: '0',
    });
    const expected = pmtFormula(250000, 6.5, 360);
    near(parseMoney(getValue(r, 'basePayment')), expected, 0.01);
  });

  it('extra payments produce nonzero interest savings', () => {
    const baseline = config.calculate({
      loanAmount: '250000',
      interestRate: '6.5',
      termUnit: 'years',
      loanTerm: '30',
      includeExtra: 'no',
      extraMonthly: '0',
      extraAnnual: '0',
    });
    const accelerated = config.calculate({
      loanAmount: '250000',
      interestRate: '6.5',
      termUnit: 'years',
      loanTerm: '30',
      includeExtra: 'yes',
      extraMonthly: '300',
      extraAnnual: '0',
    });
    const baseInt = parseMoney(getValue(baseline, 'totalInterestStandard'));
    const accInt = parseMoney(getValue(accelerated, 'newTotalInterest'));
    expect(accInt).toBeLessThan(baseInt);
    // The "interestSaved" row should equal baseline - accelerated
    near(parseMoney(getValue(accelerated, 'interestSaved')), baseInt - accInt, 1);
  });

  it('returns empty for invalid principal', () => {
    const r = config.calculate({
      loanAmount: '',
      interestRate: '5',
      termUnit: 'years',
      loanTerm: '30',
      includeExtra: 'no',
      extraMonthly: '0',
      extraAnnual: '0',
    });
    expect(r).toEqual([]);
  });

  it('known answer: $300k @ 6% for 30yr has monthly payment of $1,798.65', () => {
    const r = config.calculate({
      loanAmount: '300000',
      interestRate: '6',
      termUnit: 'years',
      loanTerm: '30',
      includeExtra: 'no',
      extraMonthly: '0',
      extraAnnual: '0',
    });
    near(parseMoney(getValue(r, 'basePayment')), 1798.65, 0.5);
  });

  it('known answer: $200k @ 4% for 15yr has monthly payment of $1,479.38', () => {
    const r = config.calculate({
      loanAmount: '200000',
      interestRate: '4',
      termUnit: 'years',
      loanTerm: '15',
      includeExtra: 'no',
      extraMonthly: '0',
      extraAnnual: '0',
    });
    near(parseMoney(getValue(r, 'basePayment')), 1479.38, 0.5);
  });

  it('known answer: total interest for $200k @ 4% for 15yr is $66,287.65', () => {
    const r = config.calculate({
      loanAmount: '200000',
      interestRate: '4',
      termUnit: 'years',
      loanTerm: '15',
      includeExtra: 'no',
      extraMonthly: '0',
      extraAnnual: '0',
    });
    near(parseMoney(getValue(r, 'totalInterestStandard')), 66287.65, 1);
  });

  it('known answer: extra $200/mo on $300k @ 6% reduces total interest significantly', () => {
    const r = config.calculate({
      loanAmount: '300000',
      interestRate: '6',
      termUnit: 'years',
      loanTerm: '30',
      includeExtra: 'yes',
      extraMonthly: '200',
      extraAnnual: '0',
    });
    const stdInt = parseMoney(getValue(r, 'totalInterestStandard'));
    const newInt = parseMoney(getValue(r, 'newTotalInterest'));
    const saved = parseMoney(getValue(r, 'interestSaved'));
    expect(newInt).toBeLessThan(stdInt);
    near(saved, stdInt - newInt, 1);
    expect(saved).toBeGreaterThan(50000);
  });
});
