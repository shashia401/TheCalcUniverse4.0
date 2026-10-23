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
import loanSolve from '../../../src/calculators/finance/loan-calculator';
import repayment from '../../../src/calculators/finance/repayment';
import boatLoan from '../../../src/calculators/finance/boat-loan';
import businessLoan from '../../../src/calculators/finance/business-loan';
import homeAff from '../../../src/calculators/finance/home-affordability';
import houseAff from '../../../src/calculators/finance/house-affordability';
import rentAff from '../../../src/calculators/finance/rent-affordability';
import depreciation from '../../../src/calculators/finance/asset-depreciation';
import percentOff from '../../../src/calculators/finance/percent-off';
import commission from '../../../src/calculators/finance/commission';

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
        ['$5,552.92 (shown as $5,553)'],
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

// ---------------------------------------------------------------------------
// Batch 2: payment, repayment, boat, business loan; affordability; depreciation;
// percent-off; commission. Oracle: Python `decimal` (60 digits, python -I). The
// affordability price is solved by bisection on the payment constraint, not by the
// closed form the calculator uses; the payoff months with extra payments come from
// a month-by-month Decimal simulation.
// ---------------------------------------------------------------------------

/** No step may ever print NaN / Infinity / undefined, whatever the input. */
const printsClean = (c: CalculatorConfig, v: Record<string, string>) =>
  JSON.stringify(steps(c, v)).match(/NaN|Infinity|∞|undefined/) === null;

describe('explainSteps — finance batch 2', () => {
  describe('loan-calculator solve-for modes (moved from the retired payment-calculator)', () => {
    const pay = { solveFor: 'payment', loanAmount: '25000', interestRate: '7', termUnit: 'years', loanTerm: '5' };
    it('loan-amount mode', () => {
      const v = { solveFor: 'loanAmount', monthlyPayment: '500', interestRate: '7', termUnit: 'years', loanTerm: '5' };
      expectSteps(loanSolve, v, [['0.005833'], ['n = 5 years × 12 = 60'], ['= 50.5020'], ['P = $500.00 × 50.5020 = $25,251.00']]);
      expect(steps(loanSolve, v).at(-1)!.expr).toContain(resultValue(loanSolve, v, 'loanAmount'));
    });
    it('term mode', () => {
      const v = { solveFor: 'term', loanAmount: '25000', monthlyPayment: '600', interestRate: '7' };
      expectSteps(loanSolve, v, [['0.005833'], ['$25,000.00 × 0.005833 = $145.83'], ['= 47.88'], ['⌈47.88⌉ = 48 payments = 4 years']]);
      expect(steps(loanSolve, v).at(-1)!.expr).toContain(resultValue(loanSolve, v, 'term'));
    });
    it('0% rate: loan amount is payment x months, term is loan / payment', () => {
      expectSteps(loanSolve, { solveFor: 'loanAmount', monthlyPayment: '250', interestRate: '0', termUnit: 'months', loanTerm: '48' },
        [['0.000000'], ['n = 48 monthly payments'], ['factor = n = 48'], ['P = $250.00 × 48.0000 = $12,000.00']]);
      expectSteps(loanSolve, { solveFor: 'term', loanAmount: '10000', monthlyPayment: '250', interestRate: '0' },
        [['0.000000'], ['n = $10,000.00 ÷ $250.00 = 40.00 payments'], ['⌈40.00⌉ = 40 payments']]);
    });
    it('returns [] for blank, invalid, or an impossible payment; the default payment mode keeps its own steps', () => {
      expect(steps(loanSolve, { solveFor: 'loanAmount', monthlyPayment: '', interestRate: '7', loanTerm: '5' })).toEqual([]);
      expect(steps(loanSolve, { solveFor: 'loanAmount', monthlyPayment: '500', interestRate: '7', loanTerm: '0' })).toEqual([]);
      expect(steps(loanSolve, { solveFor: 'term', loanAmount: '25000', monthlyPayment: '100', interestRate: '7' })).toEqual([]);
      expect(printsClean(loanSolve, { solveFor: 'term', loanAmount: '1e999', monthlyPayment: '500', interestRate: '7' })).toBe(true);
      expect(steps(loanSolve, pay)[0].expr).toContain('r = 7.00% ÷ 12');
    });
  });

  describe('repayment', () => {
    const base = { loanAmount: '25000', interestRate: '7.5', termUnit: 'years', loanTerm: '5', extraPayment: '' };
    it('pins the payment and total (no extra)', () => {
      expectSteps(repayment, base, [
        ['r = 7.5% ÷ 12', '0.006250'],
        ['n = 5 years × 12 = 60'],
        ['= 1.4533'],
        ['= $500.95'],
        ['$500.95 × 60 = $30,057', 'interest $5,057'],
      ]);
      expect(resultValue(repayment, base, 'monthlyPayment')).toBe('$500.95');
    });
    it('extra payment: simulated payoff and interest saved', () => {
      const v = { ...base, extraPayment: '100' };
      const out = steps(repayment, v);
      expect(out).toHaveLength(6);
      expect(out[5].expr).toContain('$500.95 + $100.00 = $600.95/month');
      expect(out[5].expr).toContain('49 payments');
      expect(out[5].expr).toContain('interest saved $1,014');
      expect(out[5].expr).toContain(resultValue(repayment, v, 'interestSaved'));
    });
    it('returns [] for blank / invalid input', () => {
      expect(steps(repayment, blank(repayment))).toEqual([]);
      expect(steps(repayment, { ...base, loanAmount: '0' })).toEqual([]);
      expect(printsClean(repayment, { ...base, loanAmount: '1e999' })).toBe(true);
    });
  });

  describe('boat-loan', () => {
    const base = { boatPrice: '50000', downPayment: '10000', loanTerm: '180', interestRate: '8', monthlyMaintenance: '300' };
    it('pins the payment, interest and true monthly cost', () => {
      expectSteps(boatLoan, base, [
        ['$50,000.00 − $10,000.00 down = $40,000.00'],
        ['r = 8% ÷ 12', '0.006667'],
        ['^180 = 3.3069'],
        ['$40,000.00 ×', '= $382.26'],
        ['$382.26 × 180 − $40,000.00 = $28,806.95'],
        ['$382.26 + $300.00 = $682.26'],
      ]);
      expect(resultValue(boatLoan, base, 'trueMonthly')).toBe('$682.26');
      expect(steps(boatLoan, base).at(-1)!.expr).toContain(resultValue(boatLoan, base, 'trueMonthly'));
    });
    it('without maintenance the last step is the interest line', () => {
      const v = { ...base, monthlyMaintenance: '' };
      const out = steps(boatLoan, v);
      expect(out).toHaveLength(5);
      expect(out.at(-1)!.expr).toContain(resultValue(boatLoan, v, 'totalInterest'));
    });
    it('returns [] for blank, a down payment above the price, or junk', () => {
      expect(steps(boatLoan, blank(boatLoan))).toEqual([]);
      expect(steps(boatLoan, { ...base, downPayment: '60000' })).toEqual([]);
      expect(printsClean(boatLoan, { ...base, boatPrice: '1e999' })).toBe(true);
    });
  });

  describe('business-loan', () => {
    const base = { loanAmount: '250000', loanTermMonths: '60', interestRate: '8.5', originationFee: '2', monthlyNOI: '8500' };
    it('pins payment, DSCR and total cost', () => {
      expectSteps(businessLoan, base, [
        ['r = 8.5% ÷ 12', '0.007083'],
        ['= 0.6547'],
        ['= $5,129.13'],
        ['$8,500.00 NOI ÷ $5,129.13 payment = 1.66'],
        ['$5,129.13 × 60 = $307,747.97', 'interest $57,747.97', '+ $5,000.00 fee = $312,747.97'],
      ]);
      expect(resultValue(businessLoan, base, 'monthlyPayment')).toBe('$5,129.13');
      expect(steps(businessLoan, base).at(-1)!.expr).toContain(resultValue(businessLoan, base, 'totalCost'));
    });
    it('0% rate, no fee and no NOI', () => {
      const v = { loanAmount: '100000', loanTermMonths: '36', interestRate: '0', originationFee: '', monthlyNOI: '' };
      expectSteps(businessLoan, v, [['r = 0%'], ['M = $100,000.00 ÷ 36 = $2,777.78'], ['$2,777.78 × 36 = $100,000.00']]);
    });
    it('returns [] for blank / invalid input', () => {
      expect(steps(businessLoan, blank(businessLoan))).toEqual([]);
      expect(steps(businessLoan, { ...base, loanAmount: '-5' })).toEqual([]);
      expect(printsClean(businessLoan, { ...base, loanAmount: '1e999' })).toBe(true);
    });
  });

  describe('home-affordability and house-affordability', () => {
    const home = { annualIncome: '100000', monthlyDebts: '500', downPayment: '60000', interestRate: '6.75', loanTerm: '30', propertyTax: '1.2', homeInsurance: '1500', pmiRate: '', dtiLimit: '28/36' };
    it('home: 28/36 arithmetic and the solved price (bisection oracle: $346,981)', () => {
      expectSteps(homeAff, home, [
        ['$100,000.00 ÷ 12 = $8,333.33'],
        ['$8,333.33 × 28% = $2,333.33', '$8,333.33 × 36% − $500.00 debts = $2,500.00'],
        ['min($2,333.33, $2,500.00) = $2,333.33', '− $125.00 insurance = $2,208.33'],
        ['k = r(1+r)ⁿ', '0.00648598', 'n = 360', 't = 1.2% ÷ 12 = 0.00100000'],
        ['P = ($2,208.33 + $60,000.00 × 0.00648598) ÷ (0.00648598 + 0.00100000) = $346,981'],
      ]);
      expect(steps(homeAff, home).at(-1)!.expr).toContain(resultValue(homeAff, home, 'maxHomePrice'));
    });
    it('home with PMI uses k + PMI (oracle $288,420)', () => {
      const v = { ...home, downPayment: '20000', pmiRate: '0.8' };
      const out = steps(homeAff, v);
      expect(out[2].expr).toContain('(and PMI)');
      expect(out[4].expr).toContain('0.00715265');
      expect(out[4].expr).toContain('$288,420');
      expect(out[4].expr).toContain(resultValue(homeAff, v, 'maxHomePrice'));
    });
    it('house: same engine, its own $ formatter and DTI select', () => {
      const v = { annualIncome: '100000', monthlyDebts: '500', downPayment: '60000', dtiLimit: '36', interestRate: '6.75', loanTerm: '30', propertyTax: '1.2', homeInsurance: '1500', pmiRate: '' };
      const out = steps(houseAff, v);
      expect(out).toHaveLength(5);
      expect(out[4].expr).toContain('= $346,981');
      expect(out.at(-1)!.expr).toContain(resultValue(houseAff, v, 'maxHomePrice'));
    });
    it('returns [] when debts leave no room, or input is blank', () => {
      expect(steps(homeAff, { ...home, monthlyDebts: '5000' })).toEqual([]);
      expect(steps(homeAff, blank(homeAff))).toEqual([]);
      expect(steps(houseAff, blank(houseAff))).toEqual([]);
      expect(printsClean(homeAff, { ...home, annualIncome: '1e999' })).toBe(true);
    });
  });

  describe('rent-affordability', () => {
    it('30% rule on annual income', () => {
      const v = { grossIncome: '75000', incomeFrequency: 'annual', monthlyDebts: '350', rentRule: '30' };
      expectSteps(rentAff, v, [
        ['$75,000.00 ÷ 12 = $6,250.00'],
        ['$6,250.00 × 30% = $1,875.00'],
        ['$6,250.00 − $1,875.00 rent − $350.00 debts = $4,025.00/mo'],
      ]);
      expect(steps(rentAff, v)[1].expr).toContain(resultValue(rentAff, v, 'maxRent'));
    });
    it('40x rule on an hourly wage', () => {
      const v = { grossIncome: '30', incomeFrequency: 'hourly', monthlyDebts: '0', rentRule: '40x' };
      expectSteps(rentAff, v, [
        ['$30.00/hr × 40 hrs × 52 weeks ÷ 12 = $5,200.00'],
        ['$5,200.00 × 12 ÷ 40 = $1,560.00'],
        ['= $3,640.00/mo'],
      ]);
    });
    it('returns [] for blank / zero income', () => {
      expect(steps(rentAff, blank(rentAff))).toEqual([]);
      expect(steps(rentAff, { grossIncome: '0', incomeFrequency: 'annual', rentRule: '30' })).toEqual([]);
      expect(printsClean(rentAff, { grossIncome: '1e999', incomeFrequency: 'annual', rentRule: '30' })).toBe(true);
    });
  });

  describe('asset-depreciation', () => {
    const base = { assetCost: '50000', salvageValue: '5000', usefulLife: '5' };
    it('straight-line', () => {
      const v = { ...base, depreciationMethod: 'sl' };
      expectSteps(depreciation, v, [['$50,000.00 cost − $5,000.00 salvage = $45,000.00'], ['$45,000.00 ÷ 5 years = $9,000.00 per year'], ['$50,000.00 − $9,000.00 = $41,000.00']]);
      expect(steps(depreciation, v).at(-1)!.expr).toContain(resultValue(depreciation, v, 'firstYearDepreciation'));
    });
    it('double declining balance', () => {
      const v = { ...base, depreciationMethod: 'ddb' };
      expectSteps(depreciation, v, [
        ['= $45,000.00'],
        ['rate = 2 ÷ 5 = 40%'],
        ['$50,000.00 × 40% = $20,000.00', '($50,000.00 − $5,000.00) ÷ 5 = $9,000.00'],
        ['Year 1 expense = $20,000.00', '= $30,000.00'],
      ]);
      expect(steps(depreciation, v).at(-1)!.expr).toContain(resultValue(depreciation, v, 'firstYearDepreciation'));
    });
    it("sum-of-the-years' digits", () => {
      const v = { ...base, depreciationMethod: 'syd' };
      expectSteps(depreciation, v, [['= $45,000.00'], ['SYD sum = 5 × 6 ÷ 2 = 15'], ['Fraction = 5 ÷ 15'], ['$45,000.00 × 5/15 = $15,000.00']]);
      expect(steps(depreciation, v).at(-1)!.expr).toContain(resultValue(depreciation, v, 'firstYearDepreciation'));
    });
    it('returns [] when salvage is not below cost, or input is blank', () => {
      expect(steps(depreciation, blank(depreciation))).toEqual([]);
      expect(steps(depreciation, { ...base, salvageValue: '50000', depreciationMethod: 'sl' })).toEqual([]);
      expect(printsClean(depreciation, { ...base, assetCost: '1e999', depreciationMethod: 'ddb' })).toBe(true);
    });
  });

  describe('percent-off', () => {
    const base = { price: '120', discount1: '20', discount2: '15', tax: '8.25' };
    it('stacked discounts plus tax', () => {
      expectSteps(percentOff, base, [
        ['$120.00 × (1 − 20/100) = $96.00'],
        ['$96.00 × (1 − 15/100) = $81.60'],
        ['$120.00 − $81.60 = $38.40 = 32.00% off'],
        ['$81.60 + $81.60 × 8.25% = $88.33'],
      ]);
      expect(resultValue(percentOff, base, 'final')).toBe('$88.33');
    });
    it('single discount, no tax', () => {
      const v = { price: '120', discount1: '25', discount2: '', tax: '' };
      expectSteps(percentOff, v, [['$120.00 × (1 − 25/100) = $90.00'], ['$30.00 = 25.00% off'], ['$90.00 (no sales tax entered) = $90.00']]);
    });
    it('returns [] for blank or out-of-range input', () => {
      expect(steps(percentOff, blank(percentOff))).toEqual([]);
      expect(steps(percentOff, { ...base, discount1: '150' })).toEqual([]);
      expect(printsClean(percentOff, { ...base, price: '1e999' })).toBe(true);
    });
  });

  describe('commission', () => {
    it('flat rate with a base salary', () => {
      const v = { structure: 'flat', saleAmount: '250000', baseSalary: '40000', flatRate: '10' };
      expectSteps(commission, v, [
        ['10% ÷ 100 = 0.1'],
        ['$250,000.00 × 0.1 = $25,000.00'],
        ['$25,000.00 ÷ $250,000.00 = 10.00%'],
        ['$40,000.00 + $25,000.00 = $65,000.00'],
      ]);
      expect(steps(commission, v)[1].expr).toContain(resultValue(commission, v, 'net'));
    });
    it('tiered: one step per tier, then the blended rate', () => {
      const v = { structure: 'tiered', saleAmount: '200000', tier1Limit: '50000', tier1Rate: '5', tier2Limit: '150000', tier2Rate: '8', tier3Rate: '12', baseSalary: '' };
      expectSteps(commission, v, [
        ['$50,000.00 × 5% = $2,500.00'],
        ['$100,000.00 × 8% = $8,000.00'],
        ['$50,000.00 × 12% = $6,000.00'],
        ['$2,500.00 + $8,000.00 + $6,000.00 = $16,500.00'],
        ['$16,500.00 ÷ $200,000.00 = 8.25%'],
      ]);
      expect(steps(commission, v).at(-1)!.expr).toContain(resultValue(commission, v, 'net'));
    });
    it('real-estate split', () => {
      const v = { structure: 'realestate', saleAmount: '400000', reGrossPct: '6', reAgentSplitPct: '60', reFranchisePct: '6', baseSalary: '' };
      expectSteps(commission, v, [
        ['$400,000.00 × 6% = $24,000.00'],
        ['$24,000.00 ÷ 2 = $12,000.00'],
        ['$12,000.00 − $12,000.00 × 6% = $11,280.00'],
        ['$11,280.00 × 60% = $6,768.00'],
      ]);
      expect(steps(commission, v).at(-1)!.expr).toContain(resultValue(commission, v, 'net'));
    });
    it('returns [] for blank / invalid configuration', () => {
      expect(steps(commission, blank(commission))).toEqual([]);
      expect(steps(commission, { structure: 'flat', saleAmount: '1000', flatRate: '150' })).toEqual([]);
      expect(steps(commission, { structure: 'tiered', saleAmount: '1000', tier1Limit: '500', tier1Rate: '5', tier2Limit: '300', tier2Rate: '8' })).toEqual([]);
      expect(printsClean(commission, { structure: 'flat', saleAmount: '1e999', flatRate: '10' })).toBe(true);
    });
  });
});
