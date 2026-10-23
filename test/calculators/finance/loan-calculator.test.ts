import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/loan-calculator';
import { getValue, parseMoney, near, pmtFormula } from '../../helpers';

describe('loan-calculator', () => {
  it('classic case: $250,000 @ 6% for 30 years matches Excel PMT() to the cent', () => {
    const r = config.calculate({
      loanAmount: '250000',
      interestRate: '6',
      termUnit: 'years',
      loanTerm: '30',
    });
    // Excel: PMT(0.06/12, 360, -250000) = $1,499.21
    const expected = pmtFormula(250000, 6, 360);
    near(parseMoney(getValue(r, 'monthlyPayment')), expected, 0.01);
    near(parseMoney(getValue(r, 'totalInterest')), expected * 360 - 250000, 0.5);
    near(parseMoney(getValue(r, 'totalCost')), expected * 360, 0.5);
  });

  it('matches the canonical PMT formula for several loans', () => {
    const cases = [
      { p: 100000, rate: 5, years: 15 },
      { p: 30000, rate: 7.25, years: 5 },
      { p: 500000, rate: 6.875, years: 30 },
      { p: 12000, rate: 12, years: 3 },
    ];
    for (const c of cases) {
      const r = config.calculate({
        loanAmount: String(c.p),
        interestRate: String(c.rate),
        termUnit: 'years',
        loanTerm: String(c.years),
      });
      const expected = pmtFormula(c.p, c.rate, c.years * 12);
      near(parseMoney(getValue(r, 'monthlyPayment')), expected, 0.01);
    }
  });

  it('zero-rate loan: payment = principal / months', () => {
    const r = config.calculate({
      loanAmount: '12000',
      interestRate: '0',
      termUnit: 'months',
      loanTerm: '24',
    });
    near(parseMoney(getValue(r, 'monthlyPayment')), 500);
    near(parseMoney(getValue(r, 'totalInterest')), 0);
  });

  it('term in months works the same as term in years', () => {
    const r1 = config.calculate({
      loanAmount: '10000',
      interestRate: '8',
      termUnit: 'years',
      loanTerm: '5',
    });
    const r2 = config.calculate({
      loanAmount: '10000',
      interestRate: '8',
      termUnit: 'months',
      loanTerm: '60',
    });
    near(parseMoney(getValue(r1, 'monthlyPayment')), parseMoney(getValue(r2, 'monthlyPayment')));
  });

  it('returns empty when loan amount is invalid', () => {
    const r = config.calculate({
      loanAmount: '',
      interestRate: '5',
      termUnit: 'years',
      loanTerm: '10',
    });
    expect(r).toEqual([]);
  });

  it('known answer: $10k @ 5% for 3yr has monthly payment of $299.71', () => {
    const r = config.calculate({
      loanAmount: '10000',
      interestRate: '5',
      termUnit: 'years',
      loanTerm: '3',
    });
    near(parseMoney(getValue(r, 'monthlyPayment')), 299.71, 0.5);
  });

  it('known answer: $10k @ 5% for 3yr has total interest of $789.52', () => {
    const r = config.calculate({
      loanAmount: '10000',
      interestRate: '5',
      termUnit: 'years',
      loanTerm: '3',
    });
    near(parseMoney(getValue(r, 'totalInterest')), 789.52, 1);
  });

  it('known answer: shorter term has higher monthly but lower total interest', () => {
    const r3yr = config.calculate({
      loanAmount: '10000',
      interestRate: '5',
      termUnit: 'years',
      loanTerm: '3',
    });
    const r1yr = config.calculate({
      loanAmount: '10000',
      interestRate: '5',
      termUnit: 'years',
      loanTerm: '1',
    });
    const pmt3yr = parseMoney(getValue(r3yr, 'monthlyPayment'));
    const pmt1yr = parseMoney(getValue(r1yr, 'monthlyPayment'));
    const int3yr = parseMoney(getValue(r3yr, 'totalInterest'));
    const int1yr = parseMoney(getValue(r1yr, 'totalInterest'));
    expect(pmt1yr).toBeGreaterThan(pmt3yr);
    expect(int1yr).toBeLessThan(int3yr);
  });

  it('known answer: $10k @ 5% for 3yr has total cost of $10,789.52', () => {
    const r = config.calculate({
      loanAmount: '10000',
      interestRate: '5',
      termUnit: 'years',
      loanTerm: '3',
    });
    near(parseMoney(getValue(r, 'totalCost')), 10789.52, 1);
  });
});

describe('loan-calculator audit', () => {
  const base = { loanAmount: '20000', interestRate: '8', termUnit: 'years', loanTerm: '3' };
  // Independent: r=0.08/12, n=36 -> PMT = 626.727309; interest = 626.727309*36 - 20000 = 2,562.18 (FAQ says ~$2,560)
  it('FAQ example $20k @ 8% 3y: payment $626.73, interest $2,562.18', () => {
    const r = config.calculate(base);
    expect(getValue(r, 'monthlyPayment')).toBe('$626.73');
    expect(getValue(r, 'totalInterest')).toBe('$2,562.18');
  });
  // 5y: PMT=405.527886, interest 4,331.67 (FAQ says ~$4,300)
  it('FAQ example $20k @ 8% 5y: interest $4,331.67', () => {
    expect(getValue(config.calculate({ ...base, loanTerm: '5' }), 'totalInterest')).toBe('$4,331.67');
  });
  it('months unit and fractional months round up (1.1 y = 14 payments)', () => {
    const r = config.calculate({ ...base, loanTerm: '1.1' });
    expect(getValue(r, 'termMonths')).toContain('14 payments');
    expect(getValue(config.calculate({ ...base, termUnit: 'months', loanTerm: '36' }), 'monthlyPayment')).toBe('$626.73');
  });
  it('0% APR divides evenly', () => {
    expect(getValue(config.calculate({ ...base, interestRate: '0' }), 'monthlyPayment')).toBe('$555.56');
  });
  it('terms beyond 50 years return no result instead of a 600-year schedule', () => {
    expect(config.calculate({ ...base, loanTerm: '600' })).toEqual([]);
  });
  it('gauge label matches its rounded percentage', () => {
    const g = config.gauge!({ ...base })!;
    // interest share = 2562.18 / 22562.18 = 11.36% -> "11%" Low
    expect(g.valueLabel).toBe('Interest is 11% of total cost — Low');
  });
});

describe('loan-calculator solve-for modes (absorbed from the retired payment-calculator page)', () => {
  const visible = (v: Record<string, string>) =>
    config.inputs.filter((i) => !i.showWhen || i.showWhen(v)).map((i) => i.id);

  it('defaults to monthly payment and shows only the payment inputs', () => {
    expect(config.inputs.find((i) => i.id === 'solveFor')!.defaultValue).toBe('payment');
    expect(visible({})).toEqual(['solveFor', 'loanAmount', 'interestRate', 'termUnit', 'loanTerm']);
    expect(visible({ solveFor: 'payment' })).toEqual(['solveFor', 'loanAmount', 'interestRate', 'termUnit', 'loanTerm']);
  });
  it('loan-amount mode hides the loan amount and asks for a payment', () => {
    expect(visible({ solveFor: 'loanAmount' })).toEqual(['solveFor', 'monthlyPayment', 'interestRate', 'termUnit', 'loanTerm']);
  });
  it('term mode hides the term and asks for a payment', () => {
    expect(visible({ solveFor: 'term' })).toEqual(['solveFor', 'loanAmount', 'monthlyPayment', 'interestRate']);
  });
  it('loan amount: $500/mo at 7% for 5 years borrows $25,251.00 and shows the +$50 line', () => {
    const r = config.calculate({ solveFor: 'loanAmount', monthlyPayment: '500', interestRate: '7', termUnit: 'years', loanTerm: '5' });
    expect(getValue(r, 'loanAmount')).toBe('$25,251.00');
    expect(getValue(r, 'increaseBy50')).toContain('more');
  });
  it('loan amount at 0% is payment x months', () => {
    near(parseMoney(getValue(config.calculate({ solveFor: 'loanAmount', monthlyPayment: '500', interestRate: '0', termUnit: 'years', loanTerm: '5' }), 'loanAmount')), 30000);
  });
  it('term: $12,000 at 0% paying $500 takes exactly 2 years; $50 on $25,000 at 7% never pays off', () => {
    expect(getValue(config.calculate({ solveFor: 'term', loanAmount: '12000', monthlyPayment: '500', interestRate: '0' }), 'term')).toBe('2 years');
    expect(getValue(config.calculate({ solveFor: 'term', loanAmount: '25000', monthlyPayment: '50', interestRate: '7' }), 'error')).toContain('Monthly payment must exceed');
  });
  it('the chart, donut and gauge only describe the payment scenario', () => {
    const v = { solveFor: 'term', loanAmount: '25000', monthlyPayment: '600', interestRate: '7', termUnit: 'years', loanTerm: '5' };
    expect(config.chart!(v)).toBeNull();
    expect(config.donut!(v)).toBeNull();
    expect(config.gauge!(v)).toBeNull();
    expect(config.chart!({ ...v, solveFor: 'payment' })).not.toBeNull();
  });
  it('the educational content documents all three directions', () => {
    expect(config.educational.formula).toContain('n = −ln');
    expect(config.educational.faqs!.some((f) => /afford to borrow/i.test(f.question))).toBe(true);
  });
});
