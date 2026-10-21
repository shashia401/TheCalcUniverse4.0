import { describe, it, expect } from 'vitest';
import type { CalculatorConfig } from '../../../src/types/calculator';
import { seedDefaults } from '../../../src/lib/initialForm';
import k401 from '../../../src/calculators/finance/401k';
import annuity from '../../../src/calculators/finance/annuity-payout';
import arv from '../../../src/calculators/finance/arv-flipping';
import bond from '../../../src/calculators/finance/bond-calculator';
import budget from '../../../src/calculators/finance/budget-calculator';
import caMortgage from '../../../src/calculators/finance/california-mortgage-calculator';
import canadian from '../../../src/calculators/finance/canadian-mortgage';
import capGains from '../../../src/calculators/finance/capital-gains-tax';
import college from '../../../src/calculators/finance/college-cost';
import debtCon from '../../../src/calculators/finance/debt-consolidation';
import debtPayoff from '../../../src/calculators/finance/debt-payoff';
import depreciation from '../../../src/calculators/finance/depreciation';
import discount from '../../../src/calculators/finance/discount-calculator';
import downPayment from '../../../src/calculators/finance/down-payment';
import estate from '../../../src/calculators/finance/estate-tax';
import fire from '../../../src/calculators/finance/fire-calculator';

// Oracle: every pinned number below was computed independently in Python's decimal module
// (60-digit precision, `python -I`) from the textbook formulas, not by re-running the calculators:
// month-by-month Decimal simulations for 401(k), debt payoff / consolidation, savings, FIRE and the Canadian
// amortization; bisection for the bond yield; bracket stacking for the capital gains and estate tax.

const defaults = (c: CalculatorConfig) => seedDefaults(c.inputs);
const blank = (c: CalculatorConfig) => Object.fromEntries(c.inputs.map((i) => [i.id, '']));
const steps = (c: CalculatorConfig, v: Record<string, string>) => c.explainSteps!(v);
const rowValue = (c: CalculatorConfig, v: Record<string, string>, id: string) => c.calculate(v).find((r) => r.id === id)!.value;

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

describe('explainSteps: finance batch F1', () => {
  it('every F1 calculator declares explainSteps', () => {
    for (const c of [k401, annuity, arv, bond, budget, caMortgage, canadian, capGains, college, debtCon, debtPayoff, depreciation, discount, downPayment, estate, fire]) {
      expect(typeof c.explainSteps).toBe('function');
    }
  });

  describe('401k', () => {
    const base = { currentAge: '30', retirementAge: '65', currentBalance: '25000', annualSalary: '80000', salaryIncrease: '3', yourContribution: '6', employerMatch: '50', employerMatchLimit: '6', rateOfReturn: '7' };
    it('demo values: pinned intermediates and totals', () => {
      expect(defaults(k401)).toMatchObject(base);
      expectSteps(k401, defaults(k401), [
        ['65 − 30 = 35 years (420 months)', '7% ÷ 12 = 0.5833% per month'],
        ['$80,000.00 × 6% = $4,800.00 a year'],
        ['min(6%, 6% limit) = 6% of salary matched at 50%', '= $2,400.00 a year'],
        ['($4,800.00 + $2,400.00) ÷ 12 = $600.00 per month in year 1'],
        ['repeated 420 times from $25,000.00', '$1.82M at age 65'],
        ['exactly $290,217.99', 'exactly $145,109.00', '$1.36M', '74.7% of the balance'],
        ['$6,053/mo'],
      ]);
      expect(steps(k401, base)[3].note).toContain('final-year salary: $218,552.42');
    });
    it('final steps quote the displayed answer', () => {
      expect(steps(k401, base)[4].expr).toContain(rowValue(k401, base, 'totalBalance'));
      expect(steps(k401, base).at(-1)!.expr).toContain(rowValue(k401, base, 'monthlyRetirement'));
    });
    it('no match and 0% raise', () => {
      const v = { ...base, currentAge: '40', retirementAge: '60', currentBalance: '0', annualSalary: '100000', salaryIncrease: '0', yourContribution: '10', employerMatch: '0', employerMatchLimit: '0', rateOfReturn: '5' };
      expectSteps(k401, v, [
        ['20 years (240 months)'],
        ['$10,000.00 a year'],
        ['No employer match entered'],
        ['$833.33 per month in year 1'],
        ['$342,528 at age 60'],
        ['exactly $200,000.00', 'exactly $0.00', '41.6% of the balance'],
        ['$1,142/mo'],
      ]);
      expect(steps(k401, v)[3].note).toContain('0% raise');
    });
    it('a part-year of contributions counts as a full year (matches the calculator loop)', () => {
      const v = { ...base, currentAge: '30.5', currentBalance: '0', annualSalary: '50000', yourContribution: '5', employerMatch: '100', employerMatchLimit: '3', rateOfReturn: '6' };
      const out = steps(k401, v);
      expect(out[0].expr).toContain('→ 35 (a part-year counts as a full year) (420 months)');
      expect(out[5].expr).toContain('exactly $151,155.20');
      expect(out[5].expr).toContain('exactly $90,693.12');
      expect(out[3].note).toContain('final-year salary: $136,595.26');
      expect(out[4].expr).toContain('$689,210');
    });
    it('returns [] for empty and invalid input', () => {
      expect(steps(k401, blank(k401))).toEqual([]);
      expect(steps(k401, { ...base, retirementAge: '30' })).toEqual([]);
      expect(steps(k401, { ...base, annualSalary: '' })).toEqual([]);
      expect(steps(k401, { ...base, rateOfReturn: 'abc' })).toEqual([]);
    });
  });

  describe('annuity-payout', () => {
    const payout = { solveFor: 'payout', principal: '500000', annualReturn: '5', payoutFrequency: 'monthly', desiredYears: '20', inflationAdjust: 'nominal', payoutAmount: '' };
    it('demo values (payout mode)', () => {
      expect(defaults(annuity)).toMatchObject({ solveFor: 'payout', principal: '500000', desiredYears: '20' });
      expectSteps(annuity, defaults(annuity), [
        ['5% ÷ 12 = 0.416667% per month'],
        ['n = 20 years × 12 = 240 payments'],
        ['÷ 0.63135547 = $3,299.78/mo'],
        ['$791,947 received', '$291,947 of interest', '36.9% of the total'],
      ]);
      expect(steps(annuity, payout).at(-2)!.expr).toContain(rowValue(annuity, payout, 'pmt'));
    });
    it('inflation-adjusted payout adds the deflation step', () => {
      const out = steps(annuity, { ...payout, inflationAdjust: 'adjusted' });
      expect(out).toHaveLength(5);
      expect(out[4].expr).toBe('PMT ÷ 1.03^20 = $1,827.01/mo');
    });
    it('annual payments', () => {
      expectSteps(annuity, { ...payout, principal: '200000', annualReturn: '4', payoutFrequency: 'annually', desiredYears: '15' }, [
        ['4% ÷ 1 = 4% per year'],
        ['n = 15 years × 1 = 15 payments'],
        ['÷ 0.44473550 = $17,988.22/yr'],
        ['$269,823 received', '$69,823 of interest'],
      ]);
    });
    it('0% return splits the principal evenly', () => {
      expectSteps(annuity, { ...payout, principal: '120000', annualReturn: '0' }, [
        ['0% ÷ 12 = 0% per month'],
        ['240 payments'],
        ['$120,000.00 ÷ 240 = $500.00/mo'],
        ['$0 of interest'],
      ]);
    });
    it('duration mode: payments needed, full payments plus a final one', () => {
      const dur = { solveFor: 'duration', principal: '500000', annualReturn: '5', payoutFrequency: 'monthly', payoutAmount: '2500', desiredYears: '', inflationAdjust: 'nominal' };
      expectSteps(annuity, dur, [
        ['0.416667% per month'],
        ['$2,083.33 < $2,500.00 payout'],
        ['= 430.9175 payments', '35 years and 11 months'],
        ['430 full payments of $2,500.00', 'final payment of $2,294.22', '$1.08M', '$577,294 of interest'],
      ]);
    });
    it('duration mode: 0% return and a payout that outruns the interest', () => {
      expectSteps(annuity, { solveFor: 'duration', principal: '120000', annualReturn: '0', payoutFrequency: 'monthly', payoutAmount: '1000', desiredYears: '', inflationAdjust: 'nominal' }, [
        ['0% ÷ 12'],
        ['$120,000.00 ÷ $1,000.00 = 120 payments → 10 years'],
        ['$120,000 principal'],
      ]);
      const inf = steps(annuity, { solveFor: 'duration', principal: '500000', annualReturn: '5', payoutFrequency: 'monthly', payoutAmount: '2000', desiredYears: '', inflationAdjust: 'nominal' });
      expect(inf).toHaveLength(2);
      expect(inf[1].expr).toContain('$2,083.33/mo of interest ≥ $2,000.00/mo payout');
    });
    it('returns [] for empty and invalid input', () => {
      expect(steps(annuity, blank(annuity))).toEqual([]);
      expect(steps(annuity, { ...payout, desiredYears: '' })).toEqual([]);
      expect(steps(annuity, { ...payout, solveFor: 'duration', payoutAmount: '' })).toEqual([]);
      expect(steps(annuity, { ...payout, principal: '0' })).toEqual([]);
    });
  });

  describe('arv-flipping', () => {
    const base = { afterRepairValue: '300000', repairCosts: '50000', holdingCosts: '15000', targetProfitMargin: '20' };
    it('demo values', () => {
      expect(defaults(arv)).toMatchObject(base);
      expectSteps(arv, defaults(arv), [
        ['$300,000 × (1 − 20%) = $240,000'],
        ['$240,000 − $50,000 repairs − $15,000 holding = $175,000', 'Maximum Allowable Offer $175,000'],
        ['$175,000 + $50,000 + $15,000 = $240,000 cost', '$300,000 − $240,000 = $60,000 profit'],
        ['25.0%'],
        ['$300,000 × 70% − $50,000 repairs = $160,000'],
      ]);
    });
    it('negative offer is floored at $0 and said so', () => {
      const v = { afterRepairValue: '100000', repairCosts: '60000', holdingCosts: '30000', targetProfitMargin: '30' };
      const out = steps(arv, v);
      expect(out[1].expr).toContain('= −$20,000 → Maximum Allowable Offer $0');
      expect(out[1].note).toContain('shown as $0');
      expect(out[2].expr).toContain('$0 + $60,000 + $30,000 = $90,000 cost');
      expect(out[3].expr).toContain('11.1%');
    });
    it('returns [] for empty and invalid input', () => {
      expect(steps(arv, blank(arv))).toEqual([]);
      expect(steps(arv, { ...base, targetProfitMargin: '120' })).toEqual([]);
      expect(steps(arv, { ...base, afterRepairValue: '0' })).toEqual([]);
    });
  });

  describe('bond-calculator', () => {
    const base = { faceValue: '1000', couponRate: '5', marketPrice: '950', yearsToMaturity: '10', paymentFrequency: '2' };
    it('demo values: discount bond', () => {
      expect(defaults(bond)).toMatchObject({ faceValue: '1000', marketPrice: '950', yearsToMaturity: '10', paymentFrequency: '2' });
      expectSteps(bond, defaults(bond), [
        ['10 years × 2 per year = 20 coupon payments'],
        ['$1,000.00 × 5% = $50.00 a year ÷ 2 = $25.00 per payment'],
        ['$50.00 ÷ $950.00 × 100 = 5.2632%'],
        ['y = 2.8308% per period × 2 = 5.6617% (YTM)'],
        ['Present value at y = $950.00'],
        ['$25.00 × 20 = $500.00', '+$50.00', '$550.00'],
      ]);
    });
    it('premium bond, annual coupons', () => {
      expectSteps(bond, { ...base, couponRate: '6', marketPrice: '1080', yearsToMaturity: '5', paymentFrequency: '1' }, [
        ['5 years × 1 per year = 5 coupon payments'],
        ['$60.00 per payment'],
        ['5.5556%'],
        ['y = 4.1932% per period × 1 = 4.1932% (YTM)'],
        ['Present value at y = $1,080.00'],
        ['$300.00', '-$80.00', '$220.00'],
      ]);
    });
    it('years that are not a whole number of coupon periods are rounded, as the calculator does', () => {
      const out = steps(bond, { ...base, couponRate: '4', marketPrice: '900', yearsToMaturity: '2.5', paymentFrequency: '1' });
      expect(out[0].expr).toContain('3 coupon payments (rounded to whole coupon dates = 3 years)');
      expect(out[3].expr).toContain('7.8713% (YTM)');
    });
    it('par bond yields the coupon rate', () => {
      expectSteps(bond, { ...base, marketPrice: '1000', yearsToMaturity: '3', paymentFrequency: '4' }, [
        ['12 coupon payments'],
        ['$12.50 per payment'],
        ['5.0000%'],
        ['y = 1.2500% per period × 4 = 5.0000% (YTM)'],
        ['Present value at y = $1,000.00'],
        ['$150.00', '$0.00'],
      ]);
    });
    it('returns [] for empty and invalid input', () => {
      expect(steps(bond, blank(bond))).toEqual([]);
      expect(steps(bond, { ...base, marketPrice: '0' })).toEqual([]);
      expect(steps(bond, { ...base, yearsToMaturity: '0' })).toEqual([]);
    });
  });

  describe('budget-calculator', () => {
    const base = { monthlyIncome: '6500', rent: '1800', utilities: '200', groceries: '500', autoGas: '450', insurance: '300', childcare: '0', otherNeeds: '150', diningOut: '300', entertainment: '150', subscriptions: '80', shopping: '200', travel: '100', otherWants: '0', emergencyFund: '200', retirement401k: '300', investmentBrokerage: '100', extraDebtPayoff: '0', otherSavings: '0' };
    it('demo values', () => {
      expect(defaults(budget)).toMatchObject(base);
      expectSteps(budget, defaults(budget), [
        ['$1,800.00 + $200.00 + $500.00 + $450.00 + $300.00 + $150.00 = $3,400.00'],
        ['$300.00 + $150.00 + $80.00 + $200.00 + $100.00 = $830.00'],
        ['$200.00 + $300.00 + $100.00 = $600.00'],
        ['$4,830.00', '$6,500.00 − $4,830.00 = $1,670.00'],
        ['$3,400.00 ÷ $6,500.00 = 52.3%', 'Wants 12.8%', 'Savings 9.2%'],
        ['needs 50% = $3,250.00', 'wants 30% = $1,950.00', 'savings 20% = $1,300.00'],
      ]);
    });
    it('deficit and empty groups', () => {
      const v = { ...blank(budget), monthlyIncome: '3000', rent: '2000', groceries: '600', diningOut: '500' };
      expectSteps(budget, v, [
        ['$2,000.00 + $600.00 = $2,600.00'],
        ['$500.00 = $500.00'],
        ['$0.00 = $0.00'],
        ['$3,100.00', '-$100.00'],
        ['86.7%', 'Wants 16.7%', 'Savings 0.0%'],
        ['$1,500.00', '$900.00', '$600.00'],
      ]);
    });
    it('returns [] for empty and invalid input', () => {
      expect(steps(budget, blank(budget))).toEqual([]);
      expect(steps(budget, { ...base, monthlyIncome: '0' })).toEqual([]);
    });
  });

  describe('california-mortgage-calculator', () => {
    const base = { homePrice: '750000', downPayment: '150000', interestRate: '6.9', loanTerm: '15', propertyTaxRate: '1.1' };
    it('demo values: 20% down, no PMI', () => {
      expect(defaults(caMortgage)).toMatchObject({ homePrice: '750000', downPayment: '150000', interestRate: '6.9', loanTerm: '15' });
      expectSteps(caMortgage, defaults(caMortgage), [
        ['$750,000.00 − $150,000.00 down (20.0%) = $600,000.00'],
        ['r = 6.9% ÷ 12 = 0.5750% per month', 'n = 15 × 12 = 180 payments'],
        ['2.806774', '= $5,359.48'],
        ['$687.50 per month', '$8,250/yr'],
        ['no PMI is added'],
        ['$5,359.48 + $687.50 tax = $6,046.98'],
        ['$364,707 of interest', '$964,707'],
      ]);
    });
    it('under 20% down adds PMI at 0.5% of the loan per year', () => {
      expectSteps(caMortgage, { ...base, downPayment: '37500', interestRate: '7.25', loanTerm: '30' }, [
        ['= $712,500.00'],
        ['n = 30 × 12 = 360 payments'],
        ['8.744772', '= $4,860.51'],
        ['$687.50 per month'],
        ['$712,500.00 × 0.5% ÷ 12 = $296.88 per month'],
        ['$4,860.51 + $687.50 tax + $296.88 PMI = $5,844.88'],
        ['$1,037,282 of interest', '$1,749,782'],
      ]);
    });
    it('0% rate', () => {
      const out = steps(caMortgage, { ...base, homePrice: '500000', downPayment: '100000', interestRate: '0', loanTerm: '20', propertyTaxRate: '1' });
      expect(out[2].expr).toContain('$400,000.00 ÷ 240 = $1,666.67');
      expect(out[3].expr).toContain('$416.67 per month');
      expect(out.at(-1)!.expr).toContain('$0 of interest');
    });
    it('returns [] for empty and invalid input', () => {
      expect(steps(caMortgage, blank(caMortgage))).toEqual([]);
      expect(steps(caMortgage, { ...base, downPayment: '750000' })).toEqual([]);
      expect(steps(caMortgage, { ...base, homePrice: '0' })).toEqual([]);
    });
  });

  describe('canadian-mortgage', () => {
    const base = { price: '750000', downPayment: '75000', province: 'alberta', municipality: 'none', firstTimeBuyer: 'no', amortization: '15', rate: '5.25', frequency: 'monthly', stressTest: 'no' };
    it('demo values: insured, monthly, Alberta', () => {
      expect(defaults(canadian)).toMatchObject({ price: '750000', downPayment: '75000', rate: '5.25', frequency: 'monthly' });
      expectSteps(canadian, { ...defaults(canadian), amortization: '15' }, [
        ['$675,000.00 ÷', 'LTV = $675,000.00 ÷ $750,000.00 = 90.0%'],
        ['3.10%', '+$20,925.00 added to principal', 'principal $695,925.00'],
        ['(1 + 5.25% ÷ 2)² − 1 = 5.3189%'],
        ['0.432790% per month'],
        ['2.175680', '= $5,573.73', 'n = 15 × 12 = 180'],
        ['Monthly: $5,573.73'],
        ['Interest $307,345.83', 'total paid $1,003,270.83', '15.00 years'],
        ['No provincial LTT ($0)'],
      ]);
    });
    it('accelerated bi-weekly shows the savings against monthly', () => {
      expectSteps(canadian, { ...base, price: '500000', downPayment: '50000', amortization: '25', frequency: 'accelbiweekly' }, [
        ['$450,000.00'],
        ['$13,950.00', 'principal $463,950.00'],
        ['5.3189%'],
        ['0.432790%'],
        ['3.653074', '= $2,764.76'],
        ['Accelerated bi-weekly: $2,764.76 ÷ 2 = $1,382.38'],
        ['Interest $304,154.25', 'total paid $768,104.25', '21.38 years'],
        ['Interest saved $61,324.24', 'years saved 3.62 years'],
        ['No provincial LTT'],
      ]);
    });
    it('30-year insured for a first-time buyer adds 0.20% and runs the stress test', () => {
      const out = steps(canadian, { ...base, amortization: '30', firstTimeBuyer: 'yes', stressTest: 'plus2' });
      expect(out[1].expr).toContain('3.30% (tier for 90.0% LTV, +0.20% for an amortization over 25 years)');
      expect(out[1].expr).toContain('principal $697,275.00');
      expect(out[4].expr).toContain('= $3,826.01');
      const stress = out.find((s) => s.label.startsWith('Stress test'))!;
      expect(stress.expr).toContain('$4,706.08/month (qualifying at 7.25%)');
      expect(stress.expr).toContain('~$641,879.17');
    });
    it('uninsured bi-weekly with the 5.25% floor stress test', () => {
      const out = steps(canadian, { ...base, price: '600000', downPayment: '150000', amortization: '25', rate: '4', frequency: 'biweekly', stressTest: 'floor525' });
      expect(out[1].expr).toContain('75.0% LTV is 80% or less');
      expect(out[1].expr).toContain('principal $450,000.00');
      expect(out[5].expr).toBe('Bi-weekly: $2,367.09 × 12 ÷ 26 = $1,092.50');
      expect(out[6].expr).toContain('Interest $259,050.11');
      const stress = out.find((s) => s.label.startsWith('Stress test'))!;
      expect(stress.expr).toContain('$2,879.13/month (qualifying at 6.00%)');
      expect(stress.expr).toContain('~$519,969.74');
    });
    it('Toronto first-time buyer land transfer tax breakdown', () => {
      const out = steps(canadian, { ...base, price: '800000', downPayment: '160000', province: 'ontario', municipality: 'Toronto', firstTimeBuyer: 'yes', amortization: '25' });
      const ltt = out.at(-1)!;
      expect(ltt.expr).toBe('Ontario LTT $12,475.00 · Toronto Municipal LTT $12,475.00 · First-Time Buyer Rebate −$4,000.00 · Toronto First-Time Buyer Refund −$4,475.00 → $16,475.00');
    });
    it('returns [] for empty and invalid input', () => {
      expect(steps(canadian, blank(canadian))).toEqual([]);
      expect(steps(canadian, { ...base, downPayment: '10000' })).toEqual([]); // below the minimum down payment
      expect(steps(canadian, { ...base, amortization: '30' })).toEqual([]); // insured 30-year needs a first-time buyer
      expect(steps(canadian, { ...base, downPayment: '750000' })).toEqual([]);
    });
  });

  describe('capital-gains-tax', () => {
    const base = { assetType: 'Stocks', purchaseDate: '2024-01-15', saleDate: '2025-06-20', costBasis: '10000', saleProceeds: '25000', annualIncome: '80000', filingStatus: 'Single', stateTaxRate: '0' };
    it('demo values: blank dates give no steps, filled-in demo gives the long-term case', () => {
      expect(defaults(capGains)).toMatchObject({ costBasis: '10000', saleProceeds: '25000', annualIncome: '80000' });
      expect(steps(capGains, defaults(capGains))).toEqual([]);
      expectSteps(capGains, base, [
        ['$25,000.00 proceeds − $10,000.00 cost basis = $15,000.00'],
        ['2024-01-15 → 2025-06-20 = 522 days', 'long-term (held more than one year)'],
        ['$15,000.00 × 15% = $2,250.00', '2026 long-term capital gains brackets for Single', '$80,000.00 of ordinary income'],
        ['$95,000.00', 'does not exceed the $200,000.00 threshold → $0.00'],
        ['$2,250.00', '15.00% effective rate', 'you keep $22,750.00'],
      ]);
    });
    it('short-term gain uses the ordinary brackets', () => {
      expectSteps(capGains, { ...base, saleDate: '2024-09-20' }, [
        ['$15,000.00'],
        ['249 days', 'short-term'],
        ['$15,000.00 × 22% = $3,300.00', '2026 ordinary income brackets for Single'],
        ['$95,000.00'],
        ['$3,300.00', '22.00% effective rate', '$21,700.00'],
      ]);
    });
    it('a sale exactly one year (366 days across a leap day) later is still short-term', () => {
      const out = steps(capGains, { ...base, purchaseDate: '2023-03-01', saleDate: '2024-03-01', costBasis: '5000', saleProceeds: '9000', annualIncome: '60000' });
      expect(out[1].expr).toContain('366 days');
      expect(out[1].expr).toContain('short-term');
      expect(out[2].expr).toContain('$4,000.00 × 22% = $880.00');
    });
    it('gain that straddles the 0% and 15% brackets', () => {
      const out = steps(capGains, { ...base, purchaseDate: '2020-05-01', saleDate: '2025-06-01', costBasis: '30000', saleProceeds: '40000', annualIncome: '45000' });
      expect(out[2].expr).toContain('$4,450.00 × 0% + $5,550.00 × 15% = $832.50');
      expect(out.at(-1)!.expr).toContain('8.33% effective rate');
    });
    it('NIIT applies on the part of the gain above the threshold', () => {
      const out = steps(capGains, { ...base, purchaseDate: '2020-05-01', saleDate: '2025-06-01', costBasis: '30000', saleProceeds: '80000', annualIncome: '190000' });
      expect(out[2].expr).toContain('$50,000.00 × 15% = $7,500.00');
      expect(out[3].expr).toContain('$240,000.00 is over the $200,000.00 threshold → 3.8% × min($50,000.00, $40,000.00) = $1,520.00');
      expect(out.at(-1)!.expr).toContain('$9,020.00');
      expect(out.at(-1)!.expr).toContain('18.04% effective rate');
      expect(out.at(-1)!.expr).toContain('$70,980.00');
    });
    it('married filing jointly with state tax', () => {
      const out = steps(capGains, { ...base, purchaseDate: '2020-05-01', saleDate: '2025-06-01', costBasis: '50000', saleProceeds: '150000', annualIncome: '150000', filingStatus: 'Married Filing Jointly', stateTaxRate: '5' });
      expect(out).toHaveLength(6);
      expect(out[2].expr).toContain('$100,000.00 × 15% = $15,000.00');
      expect(out[3].expr).toContain('$250,000.00 does not exceed the $250,000.00 threshold');
      expect(out[4].expr).toBe('$100,000.00 × 5% = $5,000.00');
      expect(out[5].expr).toContain('$20,000.00');
      expect(out[5].expr).toContain('20.00% effective rate');
    });
    it('collectibles use the ordinary brackets capped at 28%', () => {
      const out = steps(capGains, { ...base, assetType: 'Collectibles', purchaseDate: '2021-05-01', saleDate: '2025-06-01', costBasis: '20000', saleProceeds: '70000', annualIncome: '40000' });
      expect(out[2].expr).toContain('$10,400.00 × 12% + $39,600.00 × 22% = $9,960.00');
      expect(out[2].expr).toContain('capped at 28% for collectibles');
      expect(out.at(-1)!.expr).toContain('19.92% effective rate');
    });
    it('a loss owes no tax', () => {
      expectSteps(capGains, { ...base, costBasis: '10000', saleProceeds: '8000' }, [
        ['$8,000.00 proceeds − $10,000.00 cost basis = −$2,000.00'],
        ['522 days', 'long-term'],
        ['A loss creates no capital gains tax'],
      ]);
      expect(steps(capGains, { ...base, saleProceeds: '10000' })[2].expr).toContain('$0.00 gain');
    });
    it('returns [] for empty and invalid input', () => {
      expect(steps(capGains, blank(capGains))).toEqual([]);
      expect(steps(capGains, { ...base, saleDate: '2023-01-01' })).toEqual([]); // sold before bought
      expect(steps(capGains, { ...base, costBasis: '0' })).toEqual([]);
      expect(steps(capGains, { ...base, annualIncome: '-5' })).toEqual([]);
    });
  });

  describe('college-cost', () => {
    const base = { childAge: '8', currentSavings: '10000', monthlyContribution: '200', institutionType: 'in-state', includeRoomBoard: 'yes', additionalCosts: '0', financialAid: '0', tuitionInflation: '5', growthRate: '6', collegeYears: '4' };
    it('demo values', () => {
      expect(defaults(college)).toMatchObject({ childAge: '8', currentSavings: '10000', monthlyContribution: '200', tuitionInflation: '5.0', growthRate: '6', collegeYears: '4' });
      expectSteps(college, defaults(college), [
        ['$11,950.00 tuition + $13,900.00 room & board = $25,850'],
        ['18 − 8 = 10 years (120 months)'],
        ['$25,850.00 × (1 + 5%)^10 = $42,107'],
        ['years 1 to 4 = $181,486'],
        ['$10,000.00 × 1.8194 + $200.00 × 163.8793 = $50,970'],
        ['$130,516', 'covered: 28%'],
        ['× 0.005000 ÷ 0.8194 = $796.42 extra per month', '$996.42 in total'],
      ]);
      expect(steps(college, base)[0].note).toContain('In-State Public');
    });
    it('private school, no room and board, extras and aid', () => {
      expectSteps(college, { ...base, childAge: '10', currentSavings: '50000', monthlyContribution: '500', institutionType: 'private', includeRoomBoard: 'no', additionalCosts: '2000', financialAid: '10000', tuitionInflation: '4', growthRate: '5' }, [
        ['$45,000.00 tuition + $2,000.00 additional − $10,000.00 aid = $37,000'],
        ['18 − 10 = 8 years (96 months)'],
        ['$37,000.00 × (1 + 4%)^8 = $50,637'],
        ['= $215,028'],
        ['$50,000.00 × 1.4906 + $500.00 × 117.7405 = $133,400'],
        ['$81,629', 'covered: 62%'],
        ['$693.29 extra per month', '$1,193.29 in total'],
      ]);
    });
    it('fully funded: no extra-savings step', () => {
      const out = steps(college, { ...base, childAge: '17', currentSavings: '300000', monthlyContribution: '2000', tuitionInflation: '3', growthRate: '4' });
      expect(out).toHaveLength(6);
      expect(out[5].expr).toContain('None — fully funded!');
      expect(out[5].expr).toContain('covered: 100%');
      expect(out[4].expr).toContain('$336,667');
    });
    it('0% growth uses straight division', () => {
      const out = steps(college, { ...base, childAge: '15', currentSavings: '0', monthlyContribution: '0', institutionType: 'out-state', tuitionInflation: '3', growthRate: '0' });
      expect(out[4].expr).toBe('$0.00 + $0.00 × 36 months = $0');
      expect(out[6].expr).toContain('$209,286 ÷ 36 months = $5,813.50 extra per month');
    });
    it('returns [] for empty and invalid input', () => {
      expect(steps(college, blank(college))).toEqual([]);
      expect(steps(college, { ...base, childAge: '30' })).toEqual([]);
      expect(steps(college, { ...base, currentSavings: '' })).toEqual([]);
      expect(steps(college, { ...base, financialAid: '-5' })).toEqual([]);
    });
  });

  describe('debt-consolidation', () => {
    const one = { debts: '[{"name":"Card A","balance":"6500","rate":"23","payment":"200"}]', newRate: '11.99', newTermMonths: '12', originationFee: '2' };
    it('demo values', () => {
      expect(defaults(debtCon)).toMatchObject({ debts: one.debts, newRate: '11.99', newTermMonths: '12', originationFee: '2.00' });
      expectSteps(debtCon, defaults(debtCon), [
        ['Card A $6,500.00 at 23%', 'payments $200.00'],
        ['interest $3,775 over 4yr 4mo', 'total cost $10,275'],
        ['$6,500.00 × 2% = $130.00 fee → loan principal $6,630.00'],
        ['1.126713', '= $589.04'],
        ['$589.04 × 12 = $7,068', '$438 of interest'],
        ['$389.04/mo extra per month'],
        ['− fee $130.00 = $3,206 saved overall'],
      ]);
    });
    it('three debts', () => {
      const v = { debts: '[{"name":"Card A","balance":"6500","rate":"23","payment":"200"},{"name":"Card B","balance":"3200","rate":"20","payment":"120"},{"name":"Loan","balance":"4000","rate":"10","payment":"150"}]', newRate: '11.99', newTermMonths: '60', originationFee: '2' };
      expectSteps(debtCon, v, [
        ['Card A $6,500.00 at 23% + Card B $3,200.00 at 20% + Loan $4,000.00 at 10% = $13,700.00', '$200.00 + $120.00 + $150.00'],
        ['interest $5,385 over 4yr 4mo', 'total cost $19,085'],
        ['= $274.00 fee → loan principal $13,974.00'],
        ['1.815798', '= $310.77'],
        ['$18,646', '$4,672 of interest'],
        ['$159.23/mo saved per month'],
        ['= $438 saved overall'],
      ]);
    });
    it('a longer, costlier loan reads as extra cost overall', () => {
      const out = steps(debtCon, { debts: '[{"name":"Card","balance":"2000","rate":"10","payment":"400"}]', newRate: '20', newTermMonths: '84', originationFee: '5' });
      expect(out[1].expr).toContain('interest $52 over 6mo');
      expect(out[3].expr).toContain('4.008677');
      expect(out[3].expr).toContain('= $46.63');
      expect(out.at(-1)!.expr).toContain('= $1,866 more overall');
    });
    it('flat debt1 keys (API style) work too', () => {
      const out = steps(debtCon, { debt1balance: '9000', debt1rate: '18', debt1payment: '300', debt2balance: '2500', debt2rate: '24', debt2payment: '100', newRate: '14', newTermMonths: '24', originationFee: '5' });
      expect(out[2].expr).toContain('$575.00 fee → loan principal $12,075.00');
      expect(out[3].expr).toContain('$579.76');
      expect(out.at(-1)!.expr).toContain('$1,633 saved overall');
    });
    it('returns [] for empty and invalid input', () => {
      expect(steps(debtCon, blank(debtCon))).toEqual([]);
      expect(steps(debtCon, { ...one, originationFee: '15' })).toEqual([]);
      expect(steps(debtCon, { ...one, debts: '[{"name":"Stuck","balance":"6500","rate":"23","payment":"50"}]' })).toEqual([]); // payment below the monthly interest
      expect(steps(debtCon, { ...one, debts: '[]' })).toEqual([]);
    });
  });

  describe('debt-payoff', () => {
    const base = { extraPayment: '200', card1name: '', card1balance: '4500', card1rate: '22.99', card1min: '85', card2name: '', card2balance: '2100', card2rate: '19.99', card2min: '45', card3name: '', card3balance: '850', card3rate: '28.99', card3min: '25' };
    it('demo values: snowball vs avalanche', () => {
      expect(defaults(debtPayoff)).toMatchObject(base);
      expectSteps(debtPayoff, defaults(debtPayoff), [
        ['Card 1 $4,500.00 at 22.99%', '= $7,450', 'minimums $155/mo + $200.00 extra = $355.00'],
        ['Card 1: 22.99% ÷ 12 = 1.9158% per month', 'Card 3: 28.99% ÷ 12 = 2.4158% per month'],
        ['Card 3 (month 5) → Card 2 (month 13) → Card 1 (month 27)', '2yr 3mo', '$2,119 interest'],
        ['Card 3 (month 5) → Card 1 (month 22) → Card 2 (month 27)', '2yr 3mo', '$2,027 interest'],
        ['$92 saved with Avalanche'],
      ]);
    });
    it('identical cards cost the same either way', () => {
      expectSteps(debtPayoff, { extraPayment: '0', card1name: 'A', card1balance: '3000', card1rate: '15', card1min: '60', card2name: 'B', card2balance: '3000', card2rate: '15', card2min: '60', card3name: '', card3balance: '', card3rate: '', card3min: '' }, [
        ['A $3,000.00 at 15% + B $3,000.00 at 15% = $6,000', '$120/mo + $0.00 extra = $120.00'],
        ['A: 15% ÷ 12 = 1.25% per month'],
        ['A (month 79) → B (month 79)', '6yr 7mo', '$3,475 interest'],
        ['A (month 79) → B (month 79)', '6yr 7mo', '$3,475 interest'],
        ['Both strategies cost the same'],
      ]);
    });
    it('avalanche finishes a month sooner when the big card has the high rate', () => {
      const v = { extraPayment: '100', card1name: 'Big', card1balance: '10000', card1rate: '24', card1min: '200', card2name: 'Small', card2balance: '500', card2rate: '5', card2min: '25', card3name: '', card3balance: '', card3rate: '', card3min: '' };
      const out = steps(debtPayoff, v);
      expect(out[2].expr).toContain('Small (month 5) → Big (month 53)');
      expect(out[2].expr).toContain('4yr 5mo');
      expect(out[2].expr).toContain('$6,496 interest');
      expect(out[3].expr).toContain('Big (month 52) → Small (month 21)');
      expect(out[3].expr).toContain('4yr 4mo');
      expect(out[3].expr).toContain('$6,335 interest');
      expect(out[4].expr).toContain('$161 saved with Avalanche');
    });
    it('returns [] for empty and invalid input', () => {
      expect(steps(debtPayoff, blank(debtPayoff))).toEqual([]);
      // minimum below the monthly interest and no extra: never paid off, the calculator shows N/A
      expect(steps(debtPayoff, { ...blank(debtPayoff), card1balance: '10000', card1rate: '30', card1min: '10' })).toEqual([]);
    });
  });

  describe('depreciation', () => {
    const sl = { assetCost: '50000', salvageValue: '5000', usefulLife: '5', method: 'straight-line' };
    it('demo values: straight line', () => {
      expect(defaults(depreciation)).toMatchObject(sl);
      expectSteps(depreciation, defaults(depreciation), [
        ['$50,000.00 cost − $5,000.00 salvage = $45,000.00'],
        ['$45,000.00 ÷ 5 years = $9,000.00 / year'],
        ['$50,000.00 − $9,000.00 = $41,000.00'],
        ['$9,000.00 × 5 years = $45,000.00', 'ending book value $5,000.00'],
      ]);
    });
    it('MACRS 5-year (200% declining balance)', () => {
      expectSteps(depreciation, { ...sl, method: 'macrs' }, [
        ['Basis = $50,000.00', 'the $5,000.00 salvage you entered has no effect'],
        ['200% declining balance: 2 ÷ 5 = 40%'],
        ['$50,000.00 × 40% × ½ = $10,000.00'],
        ['$40,000.00 × 40% = $16,000.00', '$40,000.00 ÷ (5 − 2 + 1.5) = $8,888.89 → $16,000.00'],
        ['6 tax years (5 + 1 for the half-year convention)', 'total $50,000.00', 'ending book value $0.00'],
      ]);
    });
    it('MACRS 15-year uses 150% declining balance', () => {
      expectSteps(depreciation, { assetCost: '100000', salvageValue: '0', usefulLife: '15', method: 'macrs' }, [
        ['Basis = $100,000.00'],
        ['150% declining balance: 1.5 ÷ 15 = 10%'],
        ['$100,000.00 × 10% × ½ = $5,000.00'],
        ['$95,000.00 × 10% = $9,500.00', '$95,000.00 ÷ (15 − 2 + 1.5) = $6,551.72 → $9,500.00'],
        ['16 tax years'],
      ]);
    });
    it('MACRS 30-year is straight line', () => {
      expectSteps(depreciation, { assetCost: '200000', salvageValue: '0', usefulLife: '30', method: 'macrs' }, [
        ['Basis = $200,000.00'],
        ['Straight line: 1 ÷ 30 = 3.3333% per year'],
        ['$200,000.00 × 3.3333% × ½ = $3,333.33'],
        ['$200,000.00 × 3.3333% = $6,666.67'],
        ['31 tax years'],
      ]);
    });
    it('a 1-year MACRS asset is fully written off in year 1 and has no year-2 step', () => {
      const out = steps(depreciation, { assetCost: '10000', salvageValue: '0', usefulLife: '1', method: 'macrs' });
      expect(out).toHaveLength(4);
      expect(out[2].expr).toContain('$10,000.00 × 200% × ½ = $10,000.00');
      expect(out[3].expr).toContain('1 tax year (1 + 1');
    });
    it('returns [] for empty and invalid input', () => {
      expect(steps(depreciation, blank(depreciation))).toEqual([]);
      expect(steps(depreciation, { ...sl, salvageValue: '50000' })).toEqual([]);
      expect(steps(depreciation, { ...sl, usefulLife: '0' })).toEqual([]);
    });
  });

  describe('discount-calculator', () => {
    it('demo values: one discount plus tax', () => {
      expect(defaults(discount)).toMatchObject({ originalPrice: '49.99', discount1: '20', discount2: '0', salesTaxRate: '8.25' });
      expectSteps(discount, defaults(discount), [
        ['$49.99 × (1 − 20%) = $39.99'],
        ['$39.99 × (1 + 8.25%) = $43.29'],
        ['$49.99 − $39.99 = $10.00 (20.0% off)'],
      ]);
    });
    it('stacked discounts multiply, no tax', () => {
      const v = { originalPrice: '100', discount1: '20', discount2: '10', salesTaxRate: '0' };
      expectSteps(discount, v, [
        ['$100.00 × (1 − 20%) = $80.00'],
        ['$80.00 × (1 − 10%) = $72.00'],
        ['No sales tax entered, so you pay $72.00'],
        ['$100.00 − $72.00 = $28.00 (28.0% off)'],
      ]);
      expect(steps(discount, v)[1].note).toContain('20% + 10% is 28% off, not 30%');
    });
    it('stacked discounts with tax', () => {
      expectSteps(discount, { originalPrice: '250', discount1: '30', discount2: '15', salesTaxRate: '7.5' }, [
        ['$250.00 × (1 − 30%) = $175.00'],
        ['$175.00 × (1 − 15%) = $148.75'],
        ['$148.75 × (1 + 7.5%) = $159.91'],
        ['$250.00 − $148.75 = $101.25 (40.5% off)'],
      ]);
    });
    it('100% off is free', () => {
      const out = steps(discount, { originalPrice: '80', discount1: '100', discount2: '', salesTaxRate: '5' });
      expect(out[0].expr).toBe('$80.00 × (1 − 100%) = $0.00');
      expect(out[1].expr).toContain('= $0.00');
    });
    it('returns [] for empty and invalid input', () => {
      expect(steps(discount, blank(discount))).toEqual([]);
      expect(steps(discount, { originalPrice: '0', discount1: '10', discount2: '', salesTaxRate: '' })).toEqual([]);
      expect(steps(discount, { originalPrice: '50', discount1: '', discount2: '', salesTaxRate: '' })).toEqual([]);
      expect(steps(discount, { originalPrice: '50', discount1: '120', discount2: '', salesTaxRate: '' })).toEqual([]);
    });
  });

  describe('down-payment', () => {
    const base = { homePrice: '350000', targetDownPct: '3.5', currentSavings: '20000', monthlySavings: '1000', expectedReturn: '3', mortgageRate: '6.8' };
    it('demo values: goal already met, PMI applies', () => {
      expect(defaults(downPayment)).toMatchObject(base);
      expectSteps(downPayment, defaults(downPayment), [
        ['$350,000.00 × 3.5% = $12,250'],
        ['$20,000.00 saved already covers the $12,250.00 needed'],
        ['$337,750.00 loan × 0.8% = $2,702.00 a year', '135 months of scheduled payments at 6.8%', '~$30,398 total (about 11.3 years)'],
        ['$337,750.00 over 30 years at 6.8% → $2,202'],
      ]);
    });
    it('20% target with a savings gap: months to goal, no PMI', () => {
      expectSteps(downPayment, { homePrice: '400000', targetDownPct: '20', currentSavings: '30000', monthlySavings: '1500', expectedReturn: '4', mortgageRate: '' }, [
        ['$400,000.00 × 20% = $80,000'],
        ['$80,000.00 − $30,000.00 = $50,000 still to save'],
        ['month 30 (2.5 years)', '× (1 + 0.003333) + $1,500.00'],
        ['20% down is 20% or more, so no PMI'],
        ['$320,000.00 over 30 years at 6.8% → $2,086'],
      ]);
    });
    it('0% return divides the gap by the monthly saving', () => {
      expectSteps(downPayment, { homePrice: '300000', targetDownPct: '10', currentSavings: '5000', monthlySavings: '500', expectedReturn: '0', mortgageRate: '7' }, [
        ['$300,000.00 × 10% = $30,000'],
        ['$25,000'],
        ['$25,000.00 ÷ $500.00 per month, rounded up = 50 months'],
        ['$270,000.00 loan × 0.8% = $2,160.00 a year', '101 months', '~$18,180'],
        ['at 7% → $1,796'],
      ]);
    });
    it('nothing saved and nothing earned never reaches the goal', () => {
      const out = steps(downPayment, { homePrice: '500000', targetDownPct: '25', currentSavings: '10000', monthlySavings: '0', expectedReturn: '0', mortgageRate: '' });
      expect(out[2].expr).toContain('not reached within 50 years');
      expect(out[2].expr).toContain('Increase savings rate');
    });
    it('monthsToReachGoal agrees with the closed form', () => {
      // n = ceil(ln((T r + c) / (S r + c)) / ln(1 + r)) for T = 80,000, S = 30,000, c = 1,500, r = 0.04/12
      const r = 0.04 / 12;
      expect(Math.ceil(Math.log((80000 * r + 1500) / (30000 * r + 1500)) / Math.log(1 + r))).toBe(30);
    });
    it('returns [] for empty and invalid input', () => {
      expect(steps(downPayment, blank(downPayment))).toEqual([]);
      expect(steps(downPayment, { ...base, homePrice: '0' })).toEqual([]);
      expect(steps(downPayment, { ...base, currentSavings: '' })).toEqual([]);
    });
  });

  describe('estate-tax', () => {
    const base = { totalAssets: '5000000', debtsDeductions: '200000', filingStatus: 'single', spouseEstate: '0', stateResidence: 'none' };
    it('demo values: below the exemption', () => {
      expect(defaults(estate)).toMatchObject({ totalAssets: '5000000', debtsDeductions: '200000', filingStatus: 'single', stateResidence: 'none' });
      expectSteps(estate, defaults(estate), [
        ['$5,000,000 − $200,000 debts and deductions = $4,800,000'],
        ['$15,000,000 for one person'],
        ['$4,800,000 − $0 state tax = $4,800,000', '$4,800,000 − $15,000,000 exemption = $0'],
        ['Nothing is above the exemption', '$0'],
        ['$0 federal + $0 state = $0', '$4,800,000 to heirs ($4.80M)'],
      ]);
      expect(steps(estate, base)[1].label).toContain('2026');
    });
    it('over the exemption with a state tax (New York)', () => {
      expectSteps(estate, { ...base, totalAssets: '20000000', debtsDeductions: '500000', stateResidence: 'NY' }, [
        ['$20,000,000 − $500,000 debts and deductions = $19,500,000'],
        ['$15,000,000 for one person'],
        ['max(0, $19,500,000 − $7,350,000 state exemption) × 16% top rate × 0.5 = $972,000'],
        ['$19,500,000 − $972,000 state tax = $18,528,000', '= $3,528,000'],
        ['$3,528,000 × 40% = $1,411,200'],
        ['$1,411,200 federal + $972,000 state = $2,383,200 (shown as $2.38M)', '$17,116,800 to heirs ($17.12M)'],
      ]);
    });
    it('married couple: doubled exemption and the spouse estate added', () => {
      expectSteps(estate, { ...base, totalAssets: '25000000', debtsDeductions: '1000000', filingStatus: 'married', spouseEstate: '12000000' }, [
        ['$25,000,000 + $12,000,000 surviving spouse', '= $36,000,000'],
        ['$15,000,000 × 2 spouses (portability) = $30,000,000'],
        ['$36,000,000 − $0 state tax = $36,000,000', '= $6,000,000'],
        ['$6,000,000 × 40% = $2,400,000'],
        ['$2,400,000 federal + $0 state = $2,400,000', '$33,600,000 to heirs'],
      ]);
    });
    it('state tax even though the federal exemption is not reached (Massachusetts)', () => {
      const out = steps(estate, { ...base, totalAssets: '3000000', debtsDeductions: '0', stateResidence: 'MA' });
      expect(out[2].expr).toContain('× 16% top rate × 0.5 = $80,000');
      expect(out[3].expr).toContain('$3,000,000 − $80,000 state tax = $2,920,000');
      expect(out.at(-1)!.expr).toContain('$0 federal + $80,000 state = $80,000');
    });
    it('returns [] for empty and invalid input', () => {
      expect(steps(estate, blank(estate))).toEqual([]);
      expect(steps(estate, { ...base, totalAssets: '0' })).toEqual([]);
    });
  });

  describe('fire-calculator', () => {
    const base = { currentAge: '30', currentNetWorth: '100000', annualIncome: '80000', annualExpenses: '50000', currentSavingsRate: '', investmentReturn: '7', targetWithdrawalRate: '4', fireType: 'standard' };
    it('demo values: standard FIRE', () => {
      expect(defaults(fire)).toMatchObject({ currentAge: '30', currentNetWorth: '100000', annualIncome: '80000', annualExpenses: '50000', investmentReturn: '7', targetWithdrawalRate: '4', fireType: 'standard' });
      expectSteps(fire, defaults(fire), [
        ['$80,000 income − $50,000 expenses = $30,000', '37.5% savings rate'],
        ['$50,000 ÷ 4% = $1.25M'],
        ['Start $100,000', '× (1 + 7%) + $30,000', 'reaches $1,250,000 → 18 years'],
        ['30 + 18 years = 48 years old', '$1.36M', '$640,000'],
      ]);
      expect(steps(fire, base).at(-1)!.expr).toContain(rowValue(fire, base, 'fireAge'));
    });
    it('Fat FIRE adds the 1.5x cushion', () => {
      expectSteps(fire, { ...base, fireType: 'fat' }, [
        ['$30,000'],
        ['$50,000 ÷ 4% × 1.5 cushion = $1.88M'],
        ['reaches $1,875,000 → 22 years'],
        ['30 + 22 years = 52 years old', '$1.91M', '$760,000'],
      ]);
    });
    it('Coast FIRE discounts the number back from 65', () => {
      expectSteps(fire, { currentAge: '35', currentNetWorth: '250000', annualIncome: '90000', annualExpenses: '60000', currentSavingsRate: '', investmentReturn: '6', targetWithdrawalRate: '4', fireType: 'coast' }, [
        ['$30,000', '33.3% savings rate'],
        ['$60,000 ÷ 4% = $1.50M'],
        ['$1.50M ÷ (1 + 6%)^30 = $261,165'],
        ['reaches $261,165 (the Coast number) → 1 years'],
        ['35 + 1 years = 36 years old', '$295,000', '$280,000'],
      ]);
    });
    it('a savings rate overrides income minus expenses', () => {
      expectSteps(fire, { currentAge: '40', currentNetWorth: '50000', annualIncome: '100000', annualExpenses: '40000', currentSavingsRate: '50', investmentReturn: '5', targetWithdrawalRate: '3.5', fireType: 'lean' }, [
        ['$100,000 × 50% savings rate = $50,000'],
        ['$40,000 ÷ 3.5% = $1.14M'],
        ['× (1 + 5%) + $50,000', '→ 15 years'],
        ['40 + 15 years = 55 years old', '$1.18M', '$800,000'],
      ]);
    });
    it('already past the target', () => {
      const out = steps(fire, { ...base, currentNetWorth: '2000000' });
      expect(out.at(-1)!.expr).toContain('30 + 0 years = 30 years old');
      expect(out.at(-1)!.expr).toContain('$2.00M');
    });
    it('spending above income with nothing invested never gets there', () => {
      const out = steps(fire, { ...base, currentNetWorth: '0', annualIncome: '60000', annualExpenses: '70000' });
      expect(out).toHaveLength(3);
      expect(out[0].expr).toContain('spending exceeds income, so savings are $0');
      expect(out[2].expr).toContain('is not reached within 100 years');
      expect(out[2].expr).toContain('Not achievable');
    });
    it('returns [] for empty and invalid input', () => {
      expect(steps(fire, blank(fire))).toEqual([]);
      expect(steps(fire, { ...base, annualIncome: '0' })).toEqual([]);
      expect(steps(fire, { ...base, currentAge: '' })).toEqual([]);
    });
  });
});
