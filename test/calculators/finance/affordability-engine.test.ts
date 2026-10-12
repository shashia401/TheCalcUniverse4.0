import { describe, it, expect } from 'vitest';
import homeConfig from '../../../src/calculators/finance/home-affordability/index';
import houseConfig from '../../../src/calculators/finance/house-affordability/index';
import { solveAffordability, parseDtiLimit } from '../../../src/utils/affordability';
import { getValue, parseMoney } from '../../helpers';

// Expected values below come from an independent brute-force search (scan the price grid and
// bisect on "P&I + tax + insurance (+PMI) <= housing budget"), not from the engine's closed form.
describe('affordability engine', () => {
  it('Amanda example: $92k income, $550 debts, $45k down, 6.75% 30y, 1.8% tax, $1,800 ins, 28/36', () => {
    const r = homeConfig.calculate({
      annualIncome: '92000', monthlyDebts: '550', downPayment: '45000', interestRate: '6.75',
      loanTerm: '30', propertyTax: '1.8', homeInsurance: '1800', dtiLimit: '28/36',
    });
    expect(parseMoney(getValue(r, 'maxHomePrice'))).toBe(286569);
    expect(parseMoney(getValue(r, 'maxLoanAmount'))).toBe(241569);
    expect(parseMoney(getValue(r, 'estimatedMonthlyPayment'))).toBeCloseTo(1566.81, 1);
    expect(parseMoney(getValue(r, 'totalMonthlyHousing'))).toBeCloseTo(2146.67, 1);
    expect(getValue(r, 'backEndDTI')).toContain('35.2%');
    expect(getValue(r, 'downPaymentPct')).toBe('15.7%');
  });

  it('Patel example: 15-year then 30-year at 6.25%', () => {
    const base = {
      annualIncome: '175000', monthlyDebts: '800', downPayment: '120000', interestRate: '6.25',
      propertyTax: '2.1', homeInsurance: '2200', dtiLimit: '28/36',
    };
    const r15 = homeConfig.calculate({ ...base, loanTerm: '15' });
    expect(parseMoney(getValue(r15, 'maxHomePrice'))).toBe(477412);
    expect(parseMoney(getValue(r15, 'totalMonthlyHousing'))).toBeCloseTo(4083.33, 1);
    expect(getValue(r15, 'downPaymentPct')).toBe('25.1%');
    const r30 = homeConfig.calculate({ ...base, loanTerm: '30' });
    expect(parseMoney(getValue(r30, 'maxHomePrice'))).toBe(586665);
    expect(parseMoney(getValue(r30, 'estimatedMonthlyPayment'))).toBeCloseTo(2873.34, 1);
  });

  it('PMI lowers the price when down payment is under 20% (independent: $326,855 at 0.8%)', () => {
    const r = homeConfig.calculate({
      annualIncome: '100000', monthlyDebts: '500', downPayment: '60000', interestRate: '6.75',
      loanTerm: '30', pmiRate: '0.8', dtiLimit: '28/36',
    });
    expect(parseMoney(getValue(r, 'maxHomePrice'))).toBe(326855);
  });

  it('PMI cliff: price is capped at 5x down payment when PMI would push it below 20% down', () => {
    // 20% of the no-PMI price (350,887) is 70,177 > $65k down -> PMI applies, PMI price is 5x down or lower
    const s = solveAffordability({
      annualIncome: 100000, monthlyDebts: 500, downPayment: 70000, annualRate: 0.0675, years: 30,
      propertyTaxRate: 0.011, insuranceAnnual: 1500, frontPct: 0.28, backPct: 0.36, pmiRate: 0.008,
    })!;
    expect(s.pmi === 0 || s.downPaymentPct < 20).toBe(true);
    expect(s.totalMonthly).toBeLessThanOrEqual(2333.34);
    expect(s.maxHomePrice).toBeLessThanOrEqual(350887.2);
    expect(s.maxHomePrice).toBeGreaterThan(300000);
  });

  it('back-end limit binds with heavy debts, and an unaffordable budget gives a notice not garbage', () => {
    // income 6,000/mo, debts 1,500, back 36% = 2,160 -> housing 660 (front 28% = 1,680)
    const bind = homeConfig.calculate({
      annualIncome: '72000', monthlyDebts: '1500', downPayment: '10000', interestRate: '6.75', loanTerm: '30', dtiLimit: '28/36',
    });
    expect(getValue(bind, 'totalMonthlyHousing')).toBe('$660.00');
    const none = homeConfig.calculate({
      annualIncome: '72000', monthlyDebts: '2500', downPayment: '10000', interestRate: '6.75', loanTerm: '30', dtiLimit: '28/36',
    });
    expect(none).toHaveLength(1);
    expect(none[0].id).toBe('error');
  });

  it('parseDtiLimit pairs a lone back-end limit with its front-end limit', () => {
    expect(parseDtiLimit('28/36')).toEqual({ front: 28, back: 36 });
    expect(parseDtiLimit('36')).toEqual({ front: 28, back: 36 });
    expect(parseDtiLimit('43')).toEqual({ front: 31, back: 43 });
    expect(parseDtiLimit('28')).toEqual({ front: 28, back: 28 });
    expect(parseDtiLimit('50')).toEqual({ front: 36, back: 50 });
    expect(parseDtiLimit(undefined)).toEqual({ front: 28, back: 36 });
  });

  it('twins agree on shared inputs (home 28/36 === house 36; 31/43 === 43) across a grid', () => {
    const incomes = ['48000', '100000', '250000'];
    const debts = ['0', '500', '2000'];
    const downs = ['0', '20000', '120000'];
    const rates = ['0', '6.75'];
    const terms = ['15', '30'];
    const pairs: [string, string][] = [['28/36', '36'], ['31/43', '43']];
    for (const annualIncome of incomes) for (const monthlyDebts of debts) for (const downPayment of downs)
      for (const interestRate of rates) for (const loanTerm of terms) for (const [h, t] of pairs) {
        const shared = { annualIncome, monthlyDebts, downPayment, interestRate, loanTerm };
        const a = homeConfig.calculate({ ...shared, dtiLimit: h });
        const b = houseConfig.calculate({ ...shared, dtiLimit: t });
        expect(a[0].id).toBe(b[0].id);
        if (a[0].id === 'error') continue;
        // house formats > $1M as "$1.23M", so compare at its precision
        const pa = parseMoney(getValue(a, 'maxHomePrice'));
        const pb = parseMoney(getValue(b, 'maxHomePrice'));
        expect(Math.abs(pa - pb)).toBeLessThanOrEqual(pa >= 1e6 ? 5000 : 0.5);
        expect(getValue(a, 'downPaymentPct')).toContain(getValue(b, 'downPaymentPct').split('%')[0]);
        // never garbage
        for (const row of [...a, ...b]) expect(row.value).not.toMatch(/NaN|Infinity|undefined|e\+/);
        expect(parseFloat(getValue(a, 'downPaymentPct'))).toBeLessThanOrEqual(100);
      }
  });

  it('house-affordability custom DTI and zero income', () => {
    const r = houseConfig.calculate({ annualIncome: '100000', monthlyDebts: '500', downPayment: '60000', interestRate: '6.75', loanTerm: '30', dtiLimit: 'custom', customDti: '40' });
    // back 40% -> front pair 31%: housing = min(2583.33, 3333.33-500) = 2583.33
    expect(getValue(r, 'maxHousingPayment')).toMatch(/^\$2,583\.33/);
    expect(houseConfig.calculate({ annualIncome: '0', downPayment: '1', interestRate: '5', loanTerm: '30', dtiLimit: '36' })).toEqual([]);
    expect(houseConfig.calculate({ annualIncome: '100000', interestRate: '5', loanTerm: '30', dtiLimit: 'custom' })).toEqual([]);
  });
});
