import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/payment-calculator';
import { getValue, parseMoney, near, pmtFormula } from '../../helpers';

describe('payment-calculator', () => {
  it('payment mode: $25,000 @ 7% for 5 years matches PMT formula', () => {
    const r = config.calculate({
      solveFor: 'payment',
      loanAmount: '25000',
      interestRate: '7',
      termUnit: 'years',
      loanTerm: '5',
    });
    const expected = pmtFormula(25000, 7, 60);
    near(parseMoney(getValue(r, 'payment')), expected, 0.01);
  });

  it('payment mode: zero interest rate', () => {
    const r = config.calculate({
      solveFor: 'payment',
      loanAmount: '12000',
      interestRate: '0',
      termUnit: 'months',
      loanTerm: '24',
    });
    near(parseMoney(getValue(r, 'payment')), 500);
    near(parseMoney(getValue(r, 'totalInterest')), 0);
  });

  it('loan amount mode: $500/mo @ 7% for 5 years', () => {
    const r = config.calculate({
      solveFor: 'loanAmount',
      monthlyPayment: '500',
      interestRate: '7',
      termUnit: 'years',
      loanTerm: '5',
    });
    // P = (500 * ((1 + 0.07/12)^60 - 1)) / ((0.07/12) * (1 + 0.07/12)^60)
    const monthlyRate = 0.07 / 12;
    const expectedP = (500 * (Math.pow(1 + monthlyRate, 60) - 1)) / (monthlyRate * Math.pow(1 + monthlyRate, 60));
    near(parseMoney(getValue(r, 'loanAmount')), expectedP, 0.5);
    // Should show the +$50 option
    expect(getValue(r, 'increaseBy50')).toContain('more');
  });

  it('loan amount mode: zero interest', () => {
    const r = config.calculate({
      solveFor: 'loanAmount',
      monthlyPayment: '500',
      interestRate: '0',
      termUnit: 'years',
      loanTerm: '5',
    });
    // P = 500 * 60 = 30000
    near(parseMoney(getValue(r, 'loanAmount')), 30000);
  });

  it('term mode: $25,000 @ 7% with $500/mo', () => {
    const r = config.calculate({
      solveFor: 'term',
      loanAmount: '25000',
      monthlyPayment: '500',
      interestRate: '7',
    });
    // Payment should be enough to cover interest and principal
    expect(getValue(r, 'term')).toContain('year');
    expect(getValue(r, 'totalPayments')).toMatch(/payments/);
  });

  it('term mode: payment too low to cover interest', () => {
    const r = config.calculate({
      solveFor: 'term',
      loanAmount: '25000',
      monthlyPayment: '50',
      interestRate: '7',
    });
    // 7% APR = 0.583% monthly -> min interest = 25000 * 0.07/12 ≈ 145.83
    // 50 < 145.83, so should show an error
    expect(getValue(r, 'error')).toContain('Monthly payment must exceed');
  });

  it('returns empty when interest rate is missing', () => {
    const r = config.calculate({
      solveFor: 'payment',
      loanAmount: '25000',
      interestRate: '',
      termUnit: 'years',
      loanTerm: '5',
    });
    expect(r).toEqual([]);
  });

  it('returns empty when loan amount is missing in payment mode', () => {
    const r = config.calculate({
      solveFor: 'payment',
      loanAmount: '',
      interestRate: '7',
      termUnit: 'years',
      loanTerm: '5',
    });
    expect(r).toEqual([]);
  });

  it('term mode: zero interest rate', () => {
    const r = config.calculate({
      solveFor: 'term',
      loanAmount: '12000',
      monthlyPayment: '500',
      interestRate: '0',
    });
    // 12000 / 500 = 24 months = 2 years
    expect(getValue(r, 'term')).toBe('2 years');
  });

  it('payment mode shows interest as percentage of total', () => {
    const r = config.calculate({
      solveFor: 'payment',
      loanAmount: '10000',
      interestRate: '12',
      termUnit: 'months',
      loanTerm: '12',
    });
    const pct = getValue(r, 'interestPct');
    expect(pct).toMatch(/%$/);
  });
});

// ── Edge-input regression: no NaN / Infinity / ∞ in any output ──
const noGarbage = (r: unknown) => expect(JSON.stringify(r)).not.toMatch(/NaN|Infinity|∞/);

describe('edge inputs: tiny loan term', () => {
  it('payment mode: term rounding to 0 payments returns []', () => {
    expect(config.calculate({ solveFor: 'payment', loanAmount: '25000', interestRate: '7', termUnit: 'years', loanTerm: '0.0001' })).toEqual([]);
    expect(config.calculate({ solveFor: 'payment', loanAmount: '25000', interestRate: '7', termUnit: 'months', loanTerm: '0.4' })).toEqual([]);
  });
  it('loanAmount mode: term rounding to 0 payments returns []', () => {
    expect(config.calculate({ solveFor: 'loanAmount', monthlyPayment: '500', interestRate: '7', termUnit: 'years', loanTerm: '0.0001' })).toEqual([]);
  });
  it('normal input unchanged', () => {
    const r = config.calculate({ solveFor: 'payment', loanAmount: '25000', interestRate: '7', termUnit: 'years', loanTerm: '5' });
    noGarbage(r);
    expect(getValue(r, 'payment')).toBe('$495.03');
  });
});

describe('payment-calculator audit', () => {
  // All expected values derived independently (node month-by-month simulation / closed forms).
  const term = (loanAmount: string, monthlyPayment: string, interestRate = '7') =>
    config.calculate({ solveFor: 'term', loanAmount, monthlyPayment, interestRate });

  it('+$50 on $25k @ 7% / 60 months: payoff 54 payments, interest $4,179.18 (was 4,701.80) -> saves $522.62', () => {
    // 60-month payment = 495.0300; +50 = 545.0300; simulated: 54 payments, total 29,179.18
    const r = term('25000', '545.03');
    expect(getValue(r, 'term')).toBe('4 years and 6 months');
    expect(getValue(r, 'totalPayments')).toContain('54 payments');
    expect(parseMoney(getValue(r, 'totalInterest'))).toBeCloseTo(4179.18, 0);
  });
  it('final payment is smaller than M: $25k @ 7%, $500/mo -> 60 payments, interest $4,644.18 (not 500*n - P)', () => {
    const r = term('25000', '500');
    expect(getValue(r, 'totalPayments')).toContain('60 payments');
    expect(parseMoney(getValue(r, 'totalInterest'))).toBeCloseTo(4644.18, 1);
  });
  it('0% term: 12,500 / 500 = 25 payments, total paid is exactly the principal', () => {
    const r = term('12500', '500', '0');
    expect(getValue(r, 'term')).toBe('2 years and 1 month');
    expect(getValue(r, 'totalCost')).toBe('$12,500.00');
  });
  it('a payment that would take over 50 years is rejected', () => {
    const r = term('100000', '584', '7'); // interest-only is 583.33
    expect(getValue(r, 'error')).toContain('more than 50 years');
  });
  it('FAQ numbers: $500/mo borrowing power at 7% is $16,193 / $25,251 / $33,129 for 3 / 5 / 7 years', () => {
    const bp = (years: string) => parseMoney(getValue(config.calculate({ solveFor: 'loanAmount', monthlyPayment: '500', interestRate: '7', loanTerm: years, termUnit: 'years' }), 'loanAmount'));
    expect(bp('3')).toBeCloseTo(16193.23, 1);
    expect(bp('5')).toBeCloseTo(25250.997, 1);
    expect(bp('7')).toBeCloseTo(33128.64, 1);
  });
  it('FAQ numbers: $35k @ 7% 48 vs 72 months -> $838.12 / $596.72, interest $5,229.69 / $7,963.50', () => {
    const run = (m: string) => config.calculate({ solveFor: 'payment', loanAmount: '35000', interestRate: '7', loanTerm: m, termUnit: 'months' });
    expect(getValue(run('48'), 'payment')).toBe('$838.12');
    expect(getValue(run('72'), 'payment')).toBe('$596.72');
    expect(getValue(run('48'), 'totalInterest')).toBe('$5,229.69');
    expect(getValue(run('72'), 'totalInterest')).toBe('$7,963.50');
  });
});
