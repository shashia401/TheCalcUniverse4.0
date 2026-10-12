// End-to-end audit regression tests for cap-rate, closing-costs, dti-ratio, fha-loan, mortgage-amortization.
// Every expected number below was derived independently (closed-form / hand-rolled loops in a scratch script),
// not copied from the calculators' own output.
import { describe, it, expect } from 'vitest';
import capRate from '../../../src/calculators/realestate/cap-rate/index';
import closing from '../../../src/calculators/realestate/closing-costs/index';
import { closingCosts } from '../../../src/calculators/realestate/closing-costs/closingMath';
import dti from '../../../src/calculators/realestate/dti-ratio/index';
import { backEndBand, frontEndBand } from '../../../src/calculators/realestate/dti-ratio/dtiMath';
import fha from '../../../src/calculators/realestate/fha-loan/index';
import { parseFha, cumulativeMip, annualMipRate } from '../../../src/calculators/realestate/fha-loan/fhaMath';
import mortgage from '../../../src/calculators/realestate/mortgage-amortization/index';
import { parseMortgage } from '../../../src/calculators/realestate/mortgage-amortization/mortgageMath';
import { getValue } from '../../helpers';

describe('cap-rate', () => {
  const base = { propertyValue: '300000', annualRent: '36000', vacancyRate: '7', propertyTax: '3600', insurance: '1200', hoa: '0', maintenance: '2000', propertyManagement: '2520', otherExpenses: '500' };
  it('NOI and cap rate by hand: EGI 33,480 - opex 9,820 = 23,660 -> 7.89%', () => {
    const r = capRate.calculate(base);
    expect(getValue(r, 'noi')).toBe('$23,660/year');
    expect(getValue(r, 'capRate')).toBe('7.89%');
    expect(getValue(r, 'grm')).toBe('8.33x'); // 300000 / 36000
    expect(getValue(r, 'breakEvenOccupancy')).toBe('27.3% occupancy needed'); // 9820 / 36000
  });
  it('classifies on the displayed (rounded) cap rate: 3.996% shows 4.00% and is not "Low return"', () => {
    const r = capRate.calculate({ ...base, propertyValue: '100000', annualRent: '10000', vacancyRate: '0', propertyTax: '6004', insurance: '', maintenance: '', propertyManagement: '', otherExpenses: '' });
    const cap = r.find((x) => x.id === 'capRate')!;
    expect(cap.value).toBe('4.00%');
    expect(cap.label).toContain('Below average');
  });
  it('negative NOI renders as -$ and never "$-"', () => {
    const r = capRate.calculate({ ...base, vacancyRate: '50', propertyTax: '40000' });
    expect(getValue(r, 'noi')).toBe('-$28,220/year'); // 18000 - (40000+1200+2000+2520+500)
    expect(getValue(r, 'noi')).not.toContain('$-');
  });
  it('100% vacancy: no NaN, expense ratio N/A', () => {
    const r = capRate.calculate({ ...base, vacancyRate: '100' });
    expect(getValue(r, 'expenseRatio')).toContain('N/A');
    expect(getValue(r, 'breakEvenOccupancy')).toBe('N/A');
  });
});

describe('closing-costs', () => {
  const v = { homePrice: '400000', downPaymentPct: '20', loanTerm: '30', interestRate: '6.8', party: 'both' };
  it('buyer total on 400k/20%/6.8%: 4,780 + 4,150 + 4,444.25 = 13,374 ; seller 21,300', () => {
    const c = closingCosts(400000, 20, 0.068);
    expect(c.buyerGroups.map((g) => Math.round(g.total))).toEqual([4780, 4150, 4444]);
    expect(Math.round(c.totalBuyer)).toBe(13374);
    expect(c.totalSeller).toBe(21300); // 2.5% + 2.5% + 0.2% transfer of 400k + 500 warranty
    const r = closing.calculate(v);
    expect(getValue(r, 'totalBuyer')).toBe('$13,374 (3.3% of price)');
    expect(getValue(r, 'totalSeller')).toBe('$21,300 (5.3% of price)');
  });
  it("owner's title insurance is not double counted on the seller side", () => {
    const r = closing.calculate(v);
    expect(r.find((x) => x.id === 'sellerTitle')).toBeUndefined();
  });
  it('an explicit 0% down payment is honored (previously silently became 20%)', () => {
    const r = closing.calculate({ ...v, downPaymentPct: '0', party: 'buyer' });
    expect(getValue(r, 'origination')).toBe('$4,000'); // 1% of the full 400k loan
    // blank still defaults to 20%
    expect(getValue(closing.calculate({ ...v, downPaymentPct: '', party: 'buyer' }), 'origination')).toBe('$3,200');
  });
  it('seller-only view works without an interest rate; 100% down has no buyer loan costs', () => {
    expect(getValue(closing.calculate({ ...v, interestRate: '', party: 'seller' }), 'totalSeller')).toContain('$21,300');
    expect(closing.calculate({ ...v, downPaymentPct: '100', party: 'buyer' })).toEqual([]);
  });
});

describe('dti-ratio', () => {
  const base = { grossMonthlySalary: '7000', bonusOvertime: '500', otherIncome: '0', housingPayment: '1800', carPayment: '400', studentLoans: '300', creditCardMin: '150', childSupport: '0', otherDebt: '0' };
  it('typical: debts 2,650 / income 7,500 = 35.3% back, 24.0% front', () => {
    const r = dti.calculate(base);
    expect(getValue(r, 'backEndDTI')).toBe('35.3%');
    expect(getValue(r, 'frontEndDTI')).toBe('24.0%');
    expect(r.find((x) => x.id === 'backEndDTI')!.label).toContain('Excellent');
    expect(getValue(r, 'maxDebtFor43')).toBe('$3,225.00/mo'); // 7500 * .43
  });
  it('bands use the displayed 1-decimal value: 36.04% shows 36.0% and is still Excellent', () => {
    expect(backEndBand(36.04).label).toBe('Excellent');
    expect(backEndBand(36.06).label).toBe('Acceptable');
    expect(backEndBand(43.04).label).toBe('Acceptable');
    expect(backEndBand(43.06).label).toBe('High');
    expect(backEndBand(50.04).label).toBe('High');
    expect(backEndBand(50.06).label).toBe('Needs Work');
  });
  it('front-end uses the 28 (conventional) / 31 (FHA) benchmarks, not the back-end ones', () => {
    expect(frontEndBand(28.04).label).toBe('Excellent');
    expect(frontEndBand(30).label).toBe('Acceptable');
    expect(frontEndBand(31.04).label).toBe('Acceptable');
    expect(frontEndBand(31.06).label).toBe('High');
    // 40% front-end used to be labelled "Yellow - Acceptable"
    const r = dti.calculate({ ...base, housingPayment: '3000' }); // 3000/7500 = 40%
    expect(r.find((x) => x.id === 'frontEndDTI')!.label).toContain('High');
  });
});

describe('fha-loan', () => {
  const v = { homePrice: '300000', downPaymentPct: '3.5', interestRate: '6.8', loanTerm: '30' };
  const total = (vals: Record<string, string>) => fha.calculate(vals).find((x) => x.id === 'totalMonthly')!;
  it('300k / 3.5% / 6.8% / 30y: base 289,500, UFMIP 5,066.25, P&I 1,920.35, MIP 132.69, total 2,053.04', () => {
    const r = fha.calculate(v);
    expect(getValue(r, 'upfrontMIP')).toBe('$5,066.25');
    expect(getValue(r, 'monthlyPI')).toBe('$1,920.35');
    expect(getValue(r, 'monthlyMIP')).toBe('$132.69');
    expect(getValue(r, 'totalMonthly')).toBe('$2,053.04');
  });
  it('interpretation shows 3.5% down, not a rounded 4%', () => {
    expect(total(v).interpretation).toContain('3.5% down');
  });
  it('MIP table boundary: base loan 726,200 is the low row, 726,201 the high row (ML 2023-05)', () => {
    expect(annualMipRate(726200, 0.9, 30)).toBe(0.005);
    expect(annualMipRate(726201, 0.9, 30)).toBe(0.007);
    expect(annualMipRate(500000, 0.951, 30)).toBe(0.0055);
    expect(annualMipRate(500000, 0.95, 30)).toBe(0.005);
    expect(annualMipRate(500000, 0.9, 15)).toBe(0.0015);
    expect(annualMipRate(500000, 0.91, 15)).toBe(0.004);
    expect(annualMipRate(800000, 0.91, 15)).toBe(0.0065);
    expect(annualMipRate(800000, 0.85, 15)).toBe(0.004);
    expect(annualMipRate(800000, 0.78, 15)).toBe(0.0015);
  });
  it('cumulative MIP uses the falling scheduled balance (year-by-year amortisation, derived independently)', () => {
    const m = parseFha(v)!;
    expect(cumulativeMip(m, 12)).toBeCloseTo(1592.25, 2); // 289,500 * 0.55% (year 1 on the full base loan)
    expect(cumulativeMip(m, 60)).toBeCloseTo(7780.96, 1);
    expect(cumulativeMip(m, 120)).toBeCloseTo(15005.72, 1);
    expect(cumulativeMip(m, 999)).toBeCloseTo(32259.82, 1); // life of loan (360 months)
    // naive monthly x months would overstate: 132.69 * 360 = 47,767
    expect(cumulativeMip(m, 360)).toBeLessThan(132.6875 * 360);
  });
  it('10% down: MIP stops after 11 years (132 months)', () => {
    const m = parseFha({ ...v, downPaymentPct: '10' })!;
    expect(m.lifeOfLoan).toBe(false);
    expect(m.mipMonths).toBe(132);
    expect(cumulativeMip(m, 999)).toBeCloseTo(13875.66, 1);
  });
  it('warns when the base loan exceeds the 2026 FHA floor/ceiling (HUD ML 2025-23: $541,287 / $1,249,125)', () => {
    const w = (price: string) => total({ ...v, homePrice: price }).warning;
    expect(w('500000')).toBeUndefined(); // base 482,500
    expect(w('600000')).toContain('541,287'); // base 579,000
    expect(w('2000000')).toContain('1,249,125'); // base 1,930,000
  });
});

describe('mortgage-amortization', () => {
  it('320k loan at 6.8%/30y: P&I 2,086.16, PITI with 1.2% tax + $1,500 insurance = 2,611.16, interest 431,017.82', () => {
    const r = mortgage.calculate({ homePrice: '400000', downPayment: '80000', downPaymentPct: '', loanTerm: '30', interestRate: '6.8', propertyTax: '1.2', homeInsurance: '1500', hoaFee: '0', startMonth: '1', startYear: '2026' });
    expect(getValue(r, 'monthlyPI')).toBe('$2,086.16');
    expect(getValue(r, 'totalMonthly')).toBe('$2,611.16');
    expect(getValue(r, 'totalInterest')).toBe('$431,017.82');
    expect(getValue(r, 'payoffDate')).toBe('Dec 2055'); // 360 payments starting Jan 2026
  });
  it('PMI (0.8%/yr) stops when the scheduled balance reaches 78% of price: 135 months for 5% down at 6.5%', () => {
    const m = parseMortgage({ homePrice: '300000', downPayment: '15000', downPaymentPct: '', loanTerm: '30', interestRate: '6.5', propertyTax: '0', homeInsurance: '0', hoaFee: '0' })!;
    expect(m.monthlyPMI).toBeCloseTo(190, 6); // 285,000 * 0.8% / 12
    expect(m.monthlyPI).toBeCloseTo(1801.39, 2);
    expect(m.pmiMonths).toBe(135);
    expect(m.totalPaid).toBeCloseTo(674151.79, 1); // 1801.39*360 + 190*135 (not 190*360)
  });
  it('20% down: no PMI, pmiMonths 0', () => {
    const m = parseMortgage({ homePrice: '400000', downPayment: '80000', downPaymentPct: '', loanTerm: '30', interestRate: '6.8' })!;
    expect(m.monthlyPMI).toBe(0);
    expect(m.pmiMonths).toBe(0);
  });
  it('0% interest is a straight-line payment', () => {
    const m = parseMortgage({ homePrice: '360000', downPayment: '0', downPaymentPct: '', loanTerm: '30', interestRate: '0' })!;
    expect(m.monthlyPI).toBeCloseTo(1000, 6);
  });
});
