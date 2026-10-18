import { describe, it, expect } from 'vitest';
import type { CalculatorConfig } from '../../../src/types/calculator';
import { seedDefaults } from '../../../src/lib/initialForm';
import savings from '../../../src/calculators/finance/savings';
import roi from '../../../src/calculators/finance/roi';
import presentValue from '../../../src/calculators/finance/present-value';
import apr from '../../../src/calculators/finance/apr-calculator';
import cd from '../../../src/calculators/finance/cd-calculator';
import interest from '../../../src/calculators/finance/interest-calculator';
import creditCard from '../../../src/calculators/finance/credit-card-payoff';
import sip from '../../../src/calculators/finance/sip-calculator';
import averageReturn from '../../../src/calculators/finance/average-return';
import inflation from '../../../src/calculators/finance/inflation';

// Oracle: every pinned number below was computed independently in Python's
// decimal module (60-digit precision, `python -I`), not by re-running the
// calculators. APR is solved by bisection rather than the calculator's Newton
// iteration; credit-card payoff is a month-by-month Decimal simulation.

const defaults = (c: CalculatorConfig) => seedDefaults(c.inputs);
const blank = (c: CalculatorConfig) => Object.fromEntries(c.inputs.map((i) => [i.id, '']));
const steps = (c: CalculatorConfig, v: Record<string, string>) => c.explainSteps!(v);
const resultValue = (c: CalculatorConfig, v: Record<string, string>, id: string) =>
  c.calculate(v).find((r) => r.id === id)!.value;

/** One array of required substrings per step; the step count must match exactly. */
function expectSteps(c: CalculatorConfig, v: Record<string, string>, expected: string[][]) {
  const out = steps(c, v);
  expect(out).toHaveLength(expected.length);
  expected.forEach((subs, i) => {
    for (const s of subs) expect(out[i].expr, `step ${i + 1} (${out[i].label})`).toContain(s);
  });
  for (const s of out) {
    expect(s.label.length).toBeGreaterThan(0);
    expect(`${s.label} ${s.expr} ${s.note ?? ''}`).not.toMatch(/NaN|Infinity|undefined/);
  }
}

describe('explainSteps — finance batch', () => {
  describe('savings-calculator', () => {
    const base = { solveFor: 'balance', initialDeposit: '5000', monthlyContribution: '500', timePeriod: '5', timeUnit: 'years', apy: '5' };

    it('final step equals the displayed result (defaults)', () => {
      const v = defaults(savings);
      expect(steps(savings, v).at(-1)!.expr).toContain(resultValue(savings, v, 'finalBalance'));
    });
    it('pins intermediate numbers (balance mode)', () => {
      expectSteps(savings, base, [
        ['i = (1 + 5.00%)^(1/12) − 1', '0.4074%', '0.004074'],
        ['n = 5 years × 12 = 60 months'],
        ['$5,000.00 × (1 + 0.004074)^60 = $6,381.41'],
        ['$500.00 ×', '= $33,906.87'],
        ['$6,381.41 + $33,906.87 = $40,288'],
      ]);
    });
    it('deposits only, month units', () => {
      const v = { ...base, initialDeposit: '0', monthlyContribution: '300', timePeriod: '18', timeUnit: 'months', apy: '4' };
      expectSteps(savings, v, [
        ['0.003274'],
        ['n = 18 months'],
        ['= $5,552.92'],
        ['$5,552.92 = $5,553'],
      ]);
      expect(steps(savings, v).at(-1)!.expr).toContain(resultValue(savings, v, 'finalBalance'));
    });
    it('goal mode matches the required monthly deposit', () => {
      const v = { solveFor: 'goal', initialDeposit: '5000', savingsGoal: '25000', timePeriod: '5', timeUnit: 'years', apy: '5' };
      expectSteps(savings, v, [
        ['0.004074'],
        ['n = 5 years × 12 = 60 months'],
        ['$5,000.00 × (1 + 0.004074)^60 = $6,381.41'],
        ['$25,000 goal − $6,381.41 = $18,618.59'],
        ['$18,618.59 ×', '= $274.55/mo'],
      ]);
      expect(resultValue(savings, v, 'requiredMonthly')).toBe('$274.55/mo');
    });
    it('0% APY avoids dividing by zero', () => {
      const v = { solveFor: 'balance', initialDeposit: '1000', monthlyContribution: '100', timePeriod: '12', timeUnit: 'months', apy: '0' };
      expectSteps(savings, v, [['0.000000'], ['n = 12 months'], ['= $1,000.00'], ['$100.00 × 12 = $1,200.00'], ['$1,000.00 + $1,200.00 = $2,200']]);
    });
    it('returns [] for blank / invalid / already-reached input', () => {
      expect(steps(savings, blank(savings))).toEqual([]);
      expect(steps(savings, { ...base, timePeriod: '0' })).toEqual([]);
      expect(steps(savings, { ...base, apy: 'abc' })).toEqual([]);
      expect(steps(savings, { ...base, initialDeposit: '0', monthlyContribution: '0' })).toEqual([]);
      expect(steps(savings, { ...base, solveFor: 'goal', savingsGoal: '' })).toEqual([]);
      expect(steps(savings, { ...base, solveFor: 'goal', savingsGoal: '1000' })).toEqual([]);
    });
  });

  describe('roi-calculator', () => {
    it('final step equals the displayed result (defaults)', () => {
      const v = defaults(roi);
      expect(steps(roi, v).at(-1)!.expr).toContain(resultValue(roi, v, 'annualizedRoi'));
    });
    it('pins intermediate numbers (gain)', () => {
      expectSteps(roi, defaults(roi), [
        ['$15,000.00 − $10,000.00 = +$5,000.00'],
        ['+$5,000.00 ÷ $10,000.00 × 100 = +50.00%'],
        ['= 1.50x'],
        ['(1.5000)^(1 ÷ 5) − 1 = +8.45% per year'],
      ]);
    });
    it('pins intermediate numbers (loss, fractional years)', () => {
      const v = { amountInvested: '10000', amountReturned: '8000', years: '2.5' };
      expectSteps(roi, v, [
        ['$8,000.00 − $10,000.00 = -$2,000.00'],
        ['-$2,000.00 ÷ $10,000.00 × 100 = -20.00%'],
        ['$8,000.00 ÷ $10,000.00 = 0.80x'],
        ['(0.8000)^(1 ÷ 2.5) − 1 = -8.54% per year'],
      ]);
      expect(steps(roi, v).at(-1)!.expr).toContain(resultValue(roi, v, 'annualizedRoi'));
    });
    it('skips the annualized step without a holding period', () => {
      expect(steps(roi, { amountInvested: '10000', amountReturned: '15000', years: '' })).toHaveLength(3);
    });
    it('returns [] for blank / invalid input', () => {
      expect(steps(roi, blank(roi))).toEqual([]);
      expect(steps(roi, { amountInvested: '0', amountReturned: '5', years: '1' })).toEqual([]);
      expect(steps(roi, { amountInvested: '100', amountReturned: '-5', years: '1' })).toEqual([]);
    });
  });

  describe('present-value-calculator', () => {
    it('final step equals the displayed result (defaults)', () => {
      const v = defaults(presentValue);
      expect(steps(presentValue, v).at(-1)!.expr).toContain(resultValue(presentValue, v, 'presentValueResult'));
    });
    it('pins intermediate numbers (annual)', () => {
      expectSteps(presentValue, defaults(presentValue), [
        ['r = 7% ÷ 1 = 7.0000% = 0.070000'],
        ['N = 1 × 10 years = 10'],
        ['= 1.967151'],
        ['PV = $100,000.00 ÷ 1.967151 = $50,834.93'],
      ]);
    });
    it('pins intermediate numbers (monthly compounding)', () => {
      const v = { futureValue: '50000', periods: '15', discountRate: '8', compoundingFrequency: '12' };
      expectSteps(presentValue, v, [
        ['r = 8% ÷ 12 = 0.6667% = 0.006667'],
        ['N = 12 × 15 years = 180'],
        ['(1 + 0.006667)^180 = 3.306921'],
        ['$50,000.00 ÷ 3.306921 = $15,119.80'],
      ]);
      expect(steps(presentValue, v).at(-1)!.expr).toContain(resultValue(presentValue, v, 'presentValueResult'));
    });
    it('0% discount rate leaves the value unchanged', () => {
      expectSteps(presentValue, { futureValue: '1000', periods: '5', discountRate: '0', compoundingFrequency: '1' }, [
        ['0.000000'], ['N = 1 × 5 years = 5'], ['= 1.000000'], ['= $1,000.00'],
      ]);
    });
    it('returns [] for blank / invalid input', () => {
      expect(steps(presentValue, blank(presentValue))).toEqual([]);
      expect(steps(presentValue, { futureValue: '0', periods: '5', discountRate: '5', compoundingFrequency: '1' })).toEqual([]);
      expect(steps(presentValue, { futureValue: '100', periods: '5', discountRate: '-1', compoundingFrequency: '1' })).toEqual([]);
      expect(steps(presentValue, { futureValue: '100', periods: '', discountRate: '5', compoundingFrequency: '1' })).toEqual([]);
    });
  });

  describe('apr-calculator', () => {
    it('final step equals the displayed result (defaults)', () => {
      const v = defaults(apr);
      expect(steps(apr, v).at(-1)!.expr).toContain(resultValue(apr, v, 'aprResult'));
    });
    it('pins intermediate numbers (fees, years)', () => {
      expectSteps(apr, defaults(apr), [
        ['r = 6.5% ÷ 12 = 0.5417% per month'],
        ['n = 30 years × 12 = 360 monthly payments'],
        ['6.9918', '= $1,264.14'],
        ['$200,000.00 − $4,000.00 = $196,000.00'],
        ['a = 0.55794% per month'],
        ['APR = 0.55794% × 12 = 6.695%'],
      ]);
    });
    it('pins intermediate numbers (fees, months)', () => {
      const v = { loanAmount: '15000', nominalRate: '7.9', loanTermValue: '48', loanTermUnit: 'months', upfrontFees: '1200' };
      expectSteps(apr, v, [
        ['r = 7.9% ÷ 12 = 0.6583% per month'],
        ['n = 48 monthly payments'],
        ['1.3702', '= $365.49'],
        ['$15,000.00 − $1,200.00 = $13,800.00'],
        ['a = 1.02558% per month'],
        ['= 12.307%'],
      ]);
      expect(steps(apr, v).at(-1)!.expr).toContain(resultValue(apr, v, 'aprResult'));
    });
    it('no fees means APR equals the quoted rate', () => {
      const v = { loanAmount: '100000', nominalRate: '5', loanTermValue: '20', loanTermUnit: 'years', upfrontFees: '0' };
      expectSteps(apr, v, [['0.4167%'], ['n = 20 years × 12 = 240'], ['= $659.96'], ['APR = 5.000%']]);
      expect(steps(apr, v).at(-1)!.expr).toContain(resultValue(apr, v, 'aprResult'));
    });
    it('0% rate divides the loan evenly', () => {
      const v = { loanAmount: '12000', nominalRate: '0', loanTermValue: '12', loanTermUnit: 'months', upfrontFees: '0' };
      expectSteps(apr, v, [['0.0000%'], ['n = 12 monthly payments'], ['$12,000.00 ÷ 12 = $1,000.00'], ['APR = 0.000%']]);
    });
    it('returns [] for blank / invalid input', () => {
      expect(steps(apr, blank(apr))).toEqual([]);
      expect(steps(apr, { ...defaults(apr), loanTermValue: '0' })).toEqual([]);
      expect(steps(apr, { ...defaults(apr), loanAmount: '1000', upfrontFees: '1000' })).toEqual([]);
      expect(steps(apr, { ...defaults(apr), nominalRate: '-2' })).toEqual([]);
    });
  });

  describe('cd-calculator', () => {
    it('final step equals the displayed result (defaults)', () => {
      const v = defaults(cd);
      expect(steps(cd, v).at(-1)!.expr).toContain(resultValue(cd, v, 'balance'));
    });
    it('pins intermediate numbers (lump sum only)', () => {
      expectSteps(cd, defaults(cd), [
        ['t = 12 months ÷ 12 = 1 year'],
        ['(1 + 4.25%)^1 = 1.042500'],
        ['$10,000.00 × 1.042500 = $10,425'],
      ]);
    });
    it('pins intermediate numbers (with monthly deposits)', () => {
      const v = { initialDeposit: '10000', termUnit: 'months', termLength: '24', apy: '4.5', compounding: 'monthly', additionalDeposit: '100' };
      expectSteps(cd, v, [
        ['t = 24 months ÷ 12 = 2 years'],
        ['= 1.092025'],
        ['$10,000.00 × 1.092025 = $10,920.25'],
        ['i = (1 + 4.5%)^(1/12) − 1 = 0.3675% = 0.003675'],
        ['= $2,504.21'],
        ['$10,920.25 + $2,504.21 = $13,424'],
      ]);
      expect(steps(cd, v).at(-1)!.expr).toContain(resultValue(cd, v, 'balance'));
    });
    it('compounding frequency does not change the steps (APY is already effective)', () => {
      const v = { initialDeposit: '10000', termUnit: 'years', termLength: '2', apy: '4.5', additionalDeposit: '0' };
      expect(steps(cd, { ...v, compounding: 'daily' })).toEqual(steps(cd, { ...v, compounding: 'annually' }));
    });
    it('0% APY adds deposits without growth', () => {
      const v = { initialDeposit: '1000', termUnit: 'months', termLength: '12', apy: '0', compounding: 'monthly', additionalDeposit: '50' };
      expectSteps(cd, v, [['t = 12 months ÷ 12 = 1 year'], ['= 1.000000'], ['= $1,000.00'], ['0.000000'], ['$50.00 × 12 = $600.00'], ['$1,000.00 + $600.00 = $1,600']]);
    });
    it('returns [] for blank / invalid input', () => {
      expect(steps(cd, blank(cd))).toEqual([]);
      expect(steps(cd, { ...defaults(cd), initialDeposit: '0' })).toEqual([]);
      expect(steps(cd, { ...defaults(cd), apy: '-1' })).toEqual([]);
      expect(steps(cd, { ...defaults(cd), termLength: '0' })).toEqual([]);
    });
  });

  describe('interest-calculator', () => {
    it('final step equals the displayed result (defaults)', () => {
      const v = defaults(interest);
      expect(steps(interest, v).at(-1)!.expr).toContain(resultValue(interest, v, 'totalAmount'));
    });
    it('pins intermediate numbers (simple, years)', () => {
      expectSteps(interest, defaults(interest), [
        ['t = 5 years'],
        ['I = $10,000.00 × 5% × 5 = $2,500.00'],
        ['A = $10,000.00 + $2,500.00 = $12,500.00'],
      ]);
    });
    it('pins intermediate numbers (simple, days)', () => {
      const v = { principal: '5000', interestRate: '8', timeUnit: 'days', timePeriod: '90', interestType: 'simple', compoundFrequency: '1' };
      expectSteps(interest, v, [
        ['t = 90 days ÷ 365 = 0.246575 years'],
        ['× 0.246575 = $98.63'],
        ['A = $5,000.00 + $98.63 = $5,098.63'],
      ]);
      expect(steps(interest, v).at(-1)!.expr).toContain(resultValue(interest, v, 'totalAmount'));
    });
    it('pins intermediate numbers (compound, monthly)', () => {
      const v = { principal: '10000', interestRate: '6', timeUnit: 'years', timePeriod: '3', interestType: 'compound', compoundFrequency: '12' };
      expectSteps(interest, v, [
        ['t = 3 years'],
        ['r ÷ n = 6% ÷ 12 = 0.5%'],
        ['n × t = 12 × 3 = 36'],
        ['(1 + 0.005)^36 = $11,966.81'],
        ['I = $11,966.81 − $10,000.00 = $1,966.81'],
      ]);
      expect(steps(interest, v).at(-1)!.expr).toContain(resultValue(interest, v, 'totalInterest'));
    });
    it('0% rate never prints NaN', () => {
      const v = { principal: '1000', interestRate: '0', timeUnit: 'years', timePeriod: '2', interestType: 'compound', compoundFrequency: '12' };
      expectSteps(interest, v, [['t = 2 years'], ['= 0%'], ['= 24'], ['= $1,000.00'], ['= $0.00']]);
    });
    it('returns [] for blank / invalid / overflowing input', () => {
      expect(steps(interest, blank(interest))).toEqual([]);
      expect(steps(interest, { ...defaults(interest), principal: '0' })).toEqual([]);
      expect(steps(interest, { ...defaults(interest), timePeriod: '0' })).toEqual([]);
      expect(steps(interest, { principal: '1000000000000', interestRate: '100', timeUnit: 'days', timePeriod: '36500', interestType: 'compound', compoundFrequency: '365' })).toEqual([]);
    });
  });

  describe('credit-card-payoff-calculator', () => {
    it('final step equals the displayed result (defaults)', () => {
      const v = defaults(creditCard);
      const last = steps(creditCard, v).at(-1)!.expr;
      expect(last).toContain(resultValue(creditCard, v, 'totalInterest'));
      expect(last).toContain(resultValue(creditCard, v, 'totalPaid'));
    });
    it('pins intermediate numbers (fixed payment, defaults)', () => {
      expectSteps(creditCard, defaults(creditCard), [
        ['r = 21.99% ÷ 12 = 1.8325% per month'],
        ['= $108.38'],
        ['= 33.74 → 34 payments (2yr 10mo)'],
        ['$1,748.69', 'total paid $6,748.69'],
      ]);
      expect(resultValue(creditCard, defaults(creditCard), 'payoffTime')).toBe('2yr 10mo');
    });
    it('pins intermediate numbers (fixed payment, no rounding ties)', () => {
      const v = { balance: '4000', apr: '18', payoffMode: 'fixed', monthlyPayment: '150', targetMonths: '24' };
      expectSteps(creditCard, v, [
        ['r = 18.00% ÷ 12 = 1.5000% per month'],
        ['Interest: $4,000.00 × 0.015000 = $60.00', 'principal: $150.00 − $60.00 = $90.00'],
        ['= 34.31 → 35 payments (2yr 11mo)'],
        ['$1,146.71', 'total paid $5,146.71'],
      ]);
      expect(resultValue(creditCard, v, 'totalInterest')).toBe('$1,146.71');
    });
    it('pins intermediate numbers (pay off by a date)', () => {
      const v = { balance: '5000', apr: '21.99', payoffMode: 'bydate', monthlyPayment: '', targetMonths: '24' };
      expectSteps(creditCard, v, [
        ['1.8325%'],
        ['(1 + 0.018325)^24 = 1.5462'],
        ['= $259.37/mo'],
        ['$1,224.79', 'total paid $6,224.79'],
      ]);
      expect(resultValue(creditCard, v, 'requiredPayment')).toBe('$259.37/mo');
      expect(resultValue(creditCard, v, 'totalInterest')).toBe('$1,224.79');
    });
    it('0% APR just divides the balance by the payment', () => {
      const v = { balance: '1000', apr: '0', payoffMode: 'fixed', monthlyPayment: '250', targetMonths: '' };
      expectSteps(creditCard, v, [['0.0000%'], ['Interest: $1,000.00 × 0.000000 = $0.00', 'principal: $250.00 − $0.00 = $250.00'], ['= 4.00 → 4 payments (0yr 4mo)'], ['$0.00', 'total paid $1,000.00']]);
    });
    it('returns [] for blank / invalid input, and when the payment cannot beat interest', () => {
      expect(steps(creditCard, blank(creditCard))).toEqual([]);
      expect(steps(creditCard, { ...defaults(creditCard), balance: '0' })).toEqual([]);
      expect(steps(creditCard, { ...defaults(creditCard), monthlyPayment: '' })).toEqual([]);
      expect(steps(creditCard, { balance: '10000', apr: '24', payoffMode: 'fixed', monthlyPayment: '100', targetMonths: '' })).toEqual([]);
      expect(steps(creditCard, { ...defaults(creditCard), payoffMode: 'bydate', targetMonths: '0' })).toEqual([]);
    });
  });

  describe('sip-calculator', () => {
    it('final step equals the displayed result (defaults)', () => {
      const v = defaults(sip);
      expect(steps(sip, v).at(-1)!.expr).toContain(resultValue(sip, v, 'futureValue'));
    });
    it('pins intermediate numbers (lump sum + SIP)', () => {
      expectSteps(sip, defaults(sip), [
        ['i = 12.00% ÷ 12 = 1.0000% = 0.010000'],
        ['n = 10 years × 12 = 120 months'],
        ['= 3.3004'],
        ['₹1,00,000.00 × 3.3004 = ₹3,30,038.69'],
        ['= ₹23,23,390.76'],
        ['₹3,30,038.69 + ₹23,23,390.76 = ₹26,53,429.45', '(₹26.53L)'],
      ]);
    });
    it('honours the active tab (lump sum only)', () => {
      const v = { shape: 'lumpsum', lumpsum: '250000', monthlyInvestment: '9999', expectedReturn: '10', timePeriod: '5' };
      expectSteps(sip, v, [
        ['i = 10.00% ÷ 12 = 0.8333% = 0.008333'],
        ['n = 5 years × 12 = 60 months'],
        ['= 1.6453'],
        ['₹2,50,000.00 × 1.6453 = ₹4,11,327.23'],
        ['₹4,11,327.23 = ₹4,11,327.23', '(₹4.11L)'],
      ]);
      expect(steps(sip, v).at(-1)!.expr).toContain(resultValue(sip, v, 'futureValue'));
    });
    it('0% return adds instalments without growth', () => {
      const v = { shape: 'sip', monthlyInvestment: '1000', expectedReturn: '0', timePeriod: '2' };
      expectSteps(sip, v, [['0.000000'], ['n = 2 years × 12 = 24 months'], ['= 1.0000'], ['₹1,000.00 × 24 = ₹24,000.00'], ['= ₹24,000.00']]);
    });
    it('returns [] for blank / invalid input', () => {
      expect(steps(sip, blank(sip))).toEqual([]);
      expect(steps(sip, { ...defaults(sip), lumpsum: '0', monthlyInvestment: '0' })).toEqual([]);
      expect(steps(sip, { ...defaults(sip), timePeriod: '0' })).toEqual([]);
      expect(steps(sip, { ...defaults(sip), expectedReturn: '' })).toEqual([]);
    });
  });

  describe('average-return-calculator', () => {
    it('final step equals the displayed result (defaults)', () => {
      const v = defaults(averageReturn);
      expect(steps(averageReturn, v).at(-1)!.expr).toContain(resultValue(averageReturn, v, 'cagr'));
    });
    it('pins intermediate numbers (start and end values)', () => {
      expectSteps(averageReturn, defaults(averageReturn), [
        ['($18,000.00 − $10,000.00) ÷ $10,000.00 = 80.00%'],
        ['80.00% ÷ 5 = 16.00% per year'],
        ['= 1.8000x'],
        ['(1.8000)^(1 ÷ 5) − 1 = 12.47%'],
      ]);
    });
    it('pins intermediate numbers (list of annual returns)', () => {
      const v = { inputMode: 'annual', returnsInput: '12, -5, 8, 15, 3' };
      expectSteps(averageReturn, v, [
        ['(12% − 5% + 8% + 15% + 3%) ÷ 5 = 6.60%'],
        ['(1 + 0.12) × (1 − 0.05) × (1 + 0.08) × (1 + 0.15) × (1 + 0.03) = 1.3611'],
        ['1.3611 − 1 = 36.11%'],
        ['(1.3611)^(1 ÷ 5) − 1 = 6.36%'],
      ]);
      expect(steps(averageReturn, v).at(-1)!.expr).toContain(resultValue(averageReturn, v, 'cagr'));
    });
    it('returns [] for blank / invalid input', () => {
      expect(steps(averageReturn, blank(averageReturn))).toEqual([]);
      expect(steps(averageReturn, { ...defaults(averageReturn), startingValue: '0' })).toEqual([]);
      expect(steps(averageReturn, { ...defaults(averageReturn), years: '0' })).toEqual([]);
      expect(steps(averageReturn, { inputMode: 'annual', returnsInput: '5' })).toEqual([]);
      expect(steps(averageReturn, { inputMode: 'annual', returnsInput: '5, -150' })).toEqual([]);
      expect(steps(averageReturn, { inputMode: 'annual', returnsInput: 'abc' })).toEqual([]);
    });
  });

  describe('inflation-calculator', () => {
    it('final step equals the displayed result (defaults)', () => {
      const v = defaults(inflation);
      const last = steps(inflation, v).at(-1)!.expr;
      expect(last).toContain(resultValue(inflation, v, 'cumulativeRate'));
      expect(steps(inflation, v).at(-2)!.expr).toContain(resultValue(inflation, v, 'adjustedAmount'));
    });
    it('pins intermediate numbers (CPI read from the data file by the oracle)', () => {
      const v = { amount: '250', startYear: '1980', endYear: '2000' };
      expectSteps(inflation, v, [
        ['CPI 1980 = 82.4;  CPI 2000 = 172.2'],
        ['172.2 ÷ 82.4 = 2.089806'],
        ['$250.00 × 2.089806 = $522.45'],
        ['= +108.98%'],
      ]);
      expect(resultValue(inflation, v, 'adjustedAmount')).toBe('$522.45');
    });
    it('returns [] for blank / invalid input', () => {
      expect(steps(inflation, blank(inflation))).toEqual([]);
      expect(steps(inflation, { amount: '0', startYear: '1980', endYear: '2000' })).toEqual([]);
      expect(steps(inflation, { amount: '100', startYear: '1800', endYear: '2000' })).toEqual([]);
    });
  });
});
