import { describe, it, expect } from 'vitest';
import commission from '../../../src/calculators/finance/commission';
import canadianMortgage from '../../../src/calculators/finance/canadian-mortgage';
import marriageTax from '../../../src/calculators/finance/marriage-tax';
import pension from '../../../src/calculators/finance/pension';
import assetDepreciation from '../../../src/calculators/finance/asset-depreciation';
import businessLoan from '../../../src/calculators/finance/business-loan';
import bond from '../../../src/calculators/finance/bond-calculator';
import rentAffordability from '../../../src/calculators/finance/rent-affordability';
import annuityPayout from '../../../src/calculators/finance/annuity-payout';
import k401 from '../../../src/calculators/finance/401k';
import mortgagePayoff from '../../../src/calculators/finance/mortgage-payoff';
import mortgageComparison from '../../../src/calculators/finance/mortgage-comparison';
import newYorkMortgage from '../../../src/calculators/finance/new-york-mortgage-calculator';
import { MRT_REGIONS } from '../../../src/calculators/finance/new-york-mortgage-calculator';

// Finance audit batch A. Every expected value below was computed independently of the calculator code
// (Python 3 with decimal / closed-form formulas, 50-digit precision) from the published definition,
// then compared with the calculator output. The oracle is named in a comment on each block.

type R = { id: string; label?: string; value: string }[];
const val = (r: unknown, id: string) => (r as R).find((x) => x.id === id)?.value;
const num = (s: string | undefined) => parseFloat((s ?? '').replace(/[^0-9.\-]/g, ''));

describe('commission-calculator audit', () => {
  // Oracle: python Decimal, sale x rate; tier sums by bracket; real-estate waterfall.
  it('flat 10% of $250,000 = $25,000; with $40,000 base the OTE is $65,000', () => {
    const r = commission.calculate({ structure: 'flat', saleAmount: '250000', flatRate: '10', baseSalary: '40000' });
    expect(val(r, 'net')).toBe('$25,000.00');
    expect(val(r, 'totalComp')).toBe('$65,000.00');
  });

  it('tiered 5% to $50k / 8% to $150k / 12% above, on $200k = 2,500 + 8,000 + 6,000 = $16,500 (8.25% blended)', () => {
    const t = { structure: 'tiered', tier1Limit: '50000', tier1Rate: '5', tier2Limit: '150000', tier2Rate: '8', tier3Rate: '12' };
    const r = commission.calculate({ ...t, saleAmount: '200000' });
    expect(val(r, 'net')).toBe('$16,500.00');
    expect(val(r, 'effective')).toBe('8.25%');
    const r2 = commission.calculate({ ...t, saleAmount: '120000' });
    expect(val(r2, 'net')).toBe('$8,100.00');
    expect(val(r2, 'effective')).toBe('6.75%');
    expect(val(commission.calculate({ ...t, saleAmount: '30000' }), 'net')).toBe('$1,500.00');
  });

  it('real estate: $500k at 6% gross, 6% franchise, 60% agent split = $8,460 (broker $5,640, 1.692% of price)', () => {
    const r = commission.calculate({ structure: 'realestate', saleAmount: '500000', reGrossPct: '6', reAgentSplitPct: '60', reFranchisePct: '6' });
    expect(val(r, 'totalComm')).toBe('$30,000.00');
    expect(val(r, 'sideComm')).toBe('$15,000.00');
    expect(val(r, 'franchise')).toBe('−$900.00');
    expect(val(r, 'broker')).toBe('−$5,640.00');
    expect(val(r, 'net')).toBe('$8,460.00');
    expect(val(r, 'effective')).toBe('1.69%');
  });

  it('edge cases: zero sale, impossible rate, tier 2 limit not above tier 1 limit', () => {
    expect(commission.calculate({ structure: 'flat', saleAmount: '0', flatRate: '10' })).toEqual([]);
    expect(val(commission.calculate({ structure: 'flat', saleAmount: '1000', flatRate: '150' }), 'err')).toContain('between 0% and 100%');
    const bad = commission.calculate({ structure: 'tiered', saleAmount: '1000', tier1Limit: '500', tier1Rate: '5', tier2Limit: '400', tier2Rate: '8' });
    expect(val(bad, 'err0')).toContain('must be greater than Tier 1 Limit');
  });
});

describe('canadian-mortgage-calculator audit', () => {
  // Oracle: python Decimal. Semi-annual compounding (Interest Act s.6): i = (1 + r/2)^2 - 1,
  // monthly rate = (1+i)^(1/12) - 1, PMT annuity formula; CMHC premium schedule from cmhc-schl.gc.ca.
  const base = { price: '750000', downPayment: '75000', province: 'ontario', municipality: 'none', firstTimeBuyer: 'no', amortization: '25', rate: '5.25', frequency: 'monthly', stressTest: 'no' };

  it('$750k, 10% down, 25 yr, 5.25%: CMHC 3.10% = $20,925, payment $4,147.14, effective rate 5.3189%', () => {
    const r = canadianMortgage.calculate(base);
    expect(val(r, 'principal')).toBe('$695,925.00');
    expect(val(r, 'cmhc')).toBe('+$20,925.00 added to principal');
    expect(val(r, 'effRate')).toBe('5.3189%');
    expect(val(r, 'payment')).toBe('$4,147.14');
    expect(val(r, 'totalInterest')).toBe('$548,217.74');
    expect(val(r, 'lttTotal')).toBe('$11,475.00'); // Ontario brackets on $750k: 275 + 1,950 + 2,250 + 7,000
  });

  it('20% down: no CMHC, payment $3,575.51, interest $472,652.43', () => {
    const r = canadianMortgage.calculate({ ...base, downPayment: '150000' });
    expect(val(r, 'cmhc')).toContain('Not required');
    expect(val(r, 'payment')).toBe('$3,575.51');
    expect(val(r, 'totalInterest')).toBe('$472,652.43');
  });

  it('accelerated bi-weekly on a $400k loan: $1,191.84, 21.38 years, saves $52,871.42 / 3.62 years vs monthly (so ~$66k on $500k)', () => {
    const a = { ...base, price: '500000', downPayment: '100000', province: 'alberta' };
    const r = canadianMortgage.calculate({ ...a, frequency: 'accelbiweekly' });
    expect(val(r, 'payment')).toBe('$1,191.84');
    expect(val(r, 'totalInterest')).toBe('$262,230.20');
    expect(val(r, 'yearsActual')).toBe('21.38 years');
    expect(val(r, 'savedInterest')).toBe('$52,871.42');
    expect(val(r, 'savedYears')).toBe('3.62 years');
    const bw = canadianMortgage.calculate({ ...a, frequency: 'biweekly' });
    expect(val(bw, 'payment')).toBe('$1,100.16'); // monthly x 12 / 26
    expect(val(bw, 'totalInterest')).toBe('$313,401.98');
    expect(val(bw, 'yearsActual')).toBe('24.96 years');
  });

  it('insured 30-year amortization adds the 0.20% CMHC surcharge: 3.30% = $22,275, payment $3,826.01', () => {
    const r = canadianMortgage.calculate({ ...base, amortization: '30', firstTimeBuyer: 'yes' });
    expect(val(r, 'cmhc')).toBe('+$22,275.00 added to principal');
    expect((r as R).find((x) => x.id === 'cmhc')?.label).toContain('3.30%');
    expect(val(r, 'principal')).toBe('$697,275.00');
    expect(val(r, 'payment')).toBe('$3,826.01');
    expect(num(val(r, 'totalInterest'))).toBeCloseTo(680087.17, 1);
    // 25 years gets no surcharge; 95% LTV is 4.00%
    const r95 = canadianMortgage.calculate({ ...base, price: '400000', downPayment: '20000', province: 'alberta' });
    expect(val(r95, 'cmhc')).toBe('+$15,200.00 added to principal');
  });

  it('Toronto first-time buyer on $800k, 4.50%, floor stress test: LTT $16,475; stress payment $4,286.87; max price ~$688,829.67', () => {
    const r = canadianMortgage.calculate({ ...base, price: '800000', downPayment: '160000', municipality: 'Toronto', firstTimeBuyer: 'yes', stressTest: 'floor525', rate: '4.5' });
    expect(val(r, 'effRate')).toBe('4.5506%');
    expect(val(r, 'payment')).toBe('$3,542.23');
    expect(val(r, 'totalInterest')).toBe('$422,668.07');
    expect(val(r, 'stressTestQualifying')).toBe('$4,286.87/month (qualifying at 6.50%)');
    expect(val(r, 'stressTestMaxPrice')).toBe('~$688,829.67');
    // 12,475 provincial + 12,475 Toronto - 4,000 - 4,475 first-time refunds
    expect(val(r, 'lttTotal')).toBe('$16,475.00');
  });

  it('BC first-time buyer on $650k: tax 11,000 less the 8,000 exemption = $3,000', () => {
    const r = canadianMortgage.calculate({ ...base, province: 'bc', price: '650000', downPayment: '130000', firstTimeBuyer: 'yes' });
    expect(val(r, 'lttTotal')).toBe('$3,000.00');
  });

  it('edge cases: 0% rate is principal / n, below-minimum down payment is rejected', () => {
    const z = canadianMortgage.calculate({ ...base, rate: '0', province: 'alberta' });
    expect(val(z, 'payment')).toBe('$2,319.75'); // 695,925 / 300
    expect(val(z, 'totalInterest')).toBe('$0.00');
    expect(val(canadianMortgage.calculate({ ...base, downPayment: '10000' }), 'error')).toContain('Minimum: $50,000.00');
  });

  // Source: City of Toronto MLTT rates page (council passed Dec 17, 2025; new rates take effect Apr 1, 2026) for 1-2 single-family
  // residences: 0.5/1/1.5/2% to $2M, 2.5% $2M-$3M, then 4.40% $3-4M, 5.45% $4-5M, 6.5% $5-10M, 7.55% $10-20M, 8.6% above.
  // $5M: Toronto 275+1,950+2,250+32,000+25,000+44,000+54,500 = 159,975; Ontario 111,475 (2.5% above $2M); total 271,450.
  it('Toronto $5M purchase uses the graduated high-value municipal rates: LTT $271,450', () => {
    const r = canadianMortgage.calculate({ ...base, price: '5000000', downPayment: '1000000', municipality: 'Toronto' });
    expect(val(r, 'lttTotal')).toBe('$271,450.00');
  });
});

describe('marriage-tax-calculator audit', () => {
  // Oracle: python Decimal bracket sums with the IRS 2026 figures (Rev. Proc. 2025-32): single 10% to 12,400 ...
  // 37% above 640,600; MFJ 10% to 24,800 ... 37% above 768,700; standard deduction 16,100 / 32,200.
  const std = { deductionType: 'standard' };
  it('$150k + $150k is exactly neutral ($24,734 each, $49,468 joint)', () => {
    const r = marriageTax.calculate({ income1: '150000', income2: '150000', ...std });
    expect(val(r, 'p1Tax')).toBe('$24,734');
    expect(val(r, 'unmarriedTotal')).toBe('$49,468');
    expect(val(r, 'marriedTotal')).toBe('$49,468');
    expect(val(r, 'hero')).toBe('No difference');
  });
  it('$200k + $35k: bonus $4,714 (singles 36,734 + 2,020, joint 34,040)', () => {
    const r = marriageTax.calculate({ income1: '200000', income2: '35000', ...std });
    expect(val(r, 'unmarriedTotal')).toBe('$38,754');
    expect(val(r, 'marriedTotal')).toBe('$34,040');
    expect(val(r, 'hero')).toBe('Save $4,714');
  });
  it('$450k + $450k: penalty $1,982 (241,268.50 vs 243,250.50)', () => {
    const r = marriageTax.calculate({ income1: '450000', income2: '450000', ...std });
    expect(val(r, 'marriedTotal')).toBe('$243,251');
    expect(val(r, 'hero')).toBe('Pay $1,982 more');
    expect(val(r, 'effMarried')).toBe('27.03%');
  });
  it('itemizing: $100k + $80k with 20k / 14k / 40k itemized (14k floored to the 16,100 standard) saves $858', () => {
    const r = marriageTax.calculate({ income1: '100000', income2: '80000', deductionType: 'itemized', itemized1: '20000', itemized2: '14000', itemizedJoint: '40000' });
    expect(val(r, 'p1Tax')).toBe('$12,312');
    expect(val(r, 'p2Tax')).toBe('$8,770');
    expect(val(r, 'marriedTotal')).toBe('$20,224');
    expect(val(r, 'hero')).toBe('Save $858');
  });
  it('zero income is no difference; negative income is rejected', () => {
    expect(val(marriageTax.calculate({ income1: '0', income2: '0', ...std }), 'hero')).toBe('No difference');
    expect(marriageTax.calculate({ income1: '-1', income2: '0', ...std })).toEqual([]);
  });
});

describe('pension-calculator audit', () => {
  // Oracle: python Decimal, FV = PV(1+r/12)^n + PMT((1+r/12)^n - 1)/(r/12), end-of-month contributions.
  const p = { currentAge: '35', retirementAge: '65', currentBalance: '50000', monthlyContribution: '500', growthRate: '7', inflationAdjust: 'adjusted' };
  it('$50k + $500/mo at 7% for 30 years = $1,015,810 ($230,000 in, $785,810 growth); 4% rule $3,386.03/mo', () => {
    const r = pension.calculate(p);
    expect(val(r, 'projectedBalance')).toBe('$1,015,810');
    expect(val(r, 'totalContributions')).toBe('$230,000');
    expect(val(r, 'totalGrowth')).toBe('$785,810');
    expect(val(r, 'growthPct')).toBe('77.4%');
    expect(val(r, 'monthlyPayout4pct')).toBe('$3,386.03/mo');
    // /1.03^30
    expect(val(r, 'inflationAdjusted')).toBe('$418,500');
    expect(val(r, 'monthlyPayoutAdj')).toBe('$1,395.00/mo');
  });
  it('starting at 40 instead of 35 gives $691,307 (about 32% less)', () => {
    expect(val(pension.calculate({ ...p, currentAge: '40' }), 'projectedBalance')).toBe('$691,307');
  });
  it('0% growth is plain saving; a half-year horizon (age 65.5) adds the 6 extra months', () => {
    const z = pension.calculate({ ...p, currentBalance: '0', monthlyContribution: '300', growthRate: '0' });
    expect(val(z, 'projectedBalance')).toBe('$108,000');
    expect(val(z, 'totalGrowth')).toBe('$0');
    expect(val(z, 'inflationAdjusted')).toBe('$44,495');
    const h = pension.calculate({ ...p, retirementAge: '65.5', currentBalance: '10000', monthlyContribution: '100', growthRate: '5', inflationAdjust: 'nominal' });
    expect(val(h, 'projectedBalance')).toBe('$131,741');
    expect(val(h, 'totalContributions')).toBe('$46,600');
    expect(val(h, 'projectionSpan')).toBe('30.5 years (Age 35 → 65.5)');
  });
  it('retirement age not after current age returns nothing', () => {
    expect(pension.calculate({ ...p, retirementAge: '35' })).toEqual([]);
  });
});

describe('asset-depreciation-calculator audit', () => {
  // Oracle: python Decimal. SL = (cost - salvage)/life; DDB = 2/life x book value with switch to SL and floor at salvage;
  // SYD = (remaining life / n(n+1)/2) x (cost - salvage).
  const a = { assetCost: '50000', salvageValue: '5000', usefulLife: '5' };
  const sched = (r: unknown) => JSON.parse(val(r, '_schedule') as string) as { depreciationExpense: number; endingValue: number }[];
  it('straight line $50k / $5k / 5 yr = $9,000 a year', () => {
    const r = assetDepreciation.calculate({ ...a, depreciationMethod: 'sl' });
    expect(val(r, 'firstYearDepreciation')).toBe('$9,000.00');
    expect(sched(r).map((x) => x.depreciationExpense)).toEqual([9000, 9000, 9000, 9000, 9000]);
  });
  it('DDB: 20,000 / 12,000 / 7,200 / 4,320 / 1,480 (switch to salvage floor), ends at $5,000', () => {
    const r = assetDepreciation.calculate({ ...a, depreciationMethod: 'ddb' });
    expect(val(r, 'ddbRate')).toBe('40% per year');
    const s = sched(r);
    s.forEach((row, i) => expect(row.depreciationExpense).toBeCloseTo([20000, 12000, 7200, 4320, 1480][i], 6));
    expect(s[4].endingValue).toBeCloseTo(5000, 6);
  });
  it('SYD: 5/15 .. 1/15 of $45,000 = 15,000 / 12,000 / 9,000 / 6,000 / 3,000; 7-year $200k asset year 1 = $42,500', () => {
    const r = assetDepreciation.calculate({ ...a, depreciationMethod: 'syd' });
    expect(val(r, 'sydSum')).toBe('15');
    sched(r).forEach((row, i) => expect(row.depreciationExpense).toBeCloseTo([15000, 12000, 9000, 6000, 3000][i], 6));
    const r7 = assetDepreciation.calculate({ assetCost: '200000', salvageValue: '30000', usefulLife: '7', depreciationMethod: 'syd' });
    expect(val(r7, 'firstYearDepreciation')).toBe('$42,500.00');
    expect(val(r7, 'sydSum')).toBe('28');
  });
  it('edge cases: one-year DDB writes off everything above salvage; salvage >= cost is rejected', () => {
    const one = assetDepreciation.calculate({ assetCost: '10000', salvageValue: '1000', usefulLife: '1', depreciationMethod: 'ddb' });
    expect(val(one, 'firstYearDepreciation')).toBe('$9,000.00');
    expect(assetDepreciation.calculate({ assetCost: '1000', salvageValue: '1000', usefulLife: '5', depreciationMethod: 'sl' })).toEqual([]);
  });

  // Source: IRS Rev. Proc. 2025-32 sections 2.10/3.02 (OBBBA s.70306: $2,500,000 / $4,000,000 for tax years beginning in 2025)
  // and section 4.24 ($2,560,000 / $4,090,000 for tax years beginning in 2026).
  it('Section 179 limits are labelled by tax year with the Rev. Proc. 2025-32 section references', () => {
    const e = assetDepreciation.educational!;
    const qr = e.quickReference!;
    expect(qr.find((x) => x.label === 'Section 179 Limit (tax year 2025)')?.value).toBe('$2,500,000 (phase-out above $4,000,000)');
    expect(qr.find((x) => x.label === 'Section 179 Limit (tax year 2026)')?.value).toBe('$2,560,000 (phase-out above $4,090,000)');
    const cite = e.citations!.find((c) => c.url.includes('rp-25-32'))!;
    expect(cite.source).toContain('tax years beginning in 2025');
    expect(cite.source).toContain('tax years beginning in 2026');
    expect(JSON.stringify(e.howToUse) + JSON.stringify(e.proTips)).toContain('tax years beginning in 2025');
  });
});

describe('business-loan-calculator audit', () => {
  // Oracle: python Decimal, PMT = P r / (1 - (1+r)^-n), r = APR/12; DSCR = NOI / PMT.
  it('$250k, 60 mo, 8.5%, 2% fee: $5,129.13/mo, interest $57,747.97, fee $5,000, DSCR 1.66', () => {
    const r = businessLoan.calculate({ loanAmount: '250000', loanTermMonths: '60', interestRate: '8.5', originationFee: '2', monthlyNOI: '8500' });
    expect(val(r, 'monthlyPayment')).toBe('$5,129.13');
    expect(val(r, 'totalInterest')).toBe('$57,747.97');
    expect(val(r, 'originationFeeResult')).toBe('$5,000.00 — Cash received: $245,000.00');
    expect(val(r, 'totalCost')).toBe('$312,747.97');
    expect(val(r, 'dscrResult')).toContain('1.66');
  });
  it('$500k, 36 mo, 12%, 3% fee: $16,607.15/mo, interest $97,857.58, DSCR 2.71', () => {
    const r = businessLoan.calculate({ loanAmount: '500000', loanTermMonths: '36', interestRate: '12', originationFee: '3', monthlyNOI: '45000' });
    expect(val(r, 'monthlyPayment')).toBe('$16,607.15');
    expect(val(r, 'totalInterest')).toBe('$97,857.58');
    expect(val(r, 'totalCost')).toBe('$612,857.58');
    expect(val(r, 'dscrResult')).toContain('2.71');
  });
  it('10-year term: $3,099.64/mo, interest $121,957.07 (about $64,209 more than 5 years); DSCR 0.97 is flagged insufficient', () => {
    const r = businessLoan.calculate({ loanAmount: '250000', loanTermMonths: '120', interestRate: '8.5', originationFee: '0', monthlyNOI: '3000' });
    expect(val(r, 'monthlyPayment')).toBe('$3,099.64');
    expect(val(r, 'totalInterest')).toBe('$121,957.07');
    expect(val(r, 'dscrResult')).toMatch(/^0\.97 — Insufficient/);
  });
  it('0% rate is straight division; no NOI means no DSCR row', () => {
    const r = businessLoan.calculate({ loanAmount: '100000', loanTermMonths: '12', interestRate: '0', originationFee: '', monthlyNOI: '' });
    expect(val(r, 'monthlyPayment')).toBe('$8,333.33');
    expect(val(r, 'totalInterest')).toBe('$0.00');
    expect(val(r, 'dscrResult')).toBeUndefined();
  });

  // Source: SBA SOP 50 10 8.1 (effective Oct 1, 2026): 7(a) DSC >= 1.15 historical and/or projected plus 1:1 global;
  // 7(a) Small Loans (not changes of ownership) >= 1.10; Appendix 15 initial acquisition / owner buyout / ESOP >= 1.25.
  it('DSCR text states the SBA SOP 50 10 8.1 floors (1.10 / 1.15 / 1.25), not a single 1.15 minimum', () => {
    const e = businessLoan.educational!;
    const text = JSON.stringify([e.quickReference, e.faqs, e.explanation, e.formulaSource, e.diagram?.caption]);
    expect(text).toContain('SOP 50 10 8.1');
    expect(text).toContain('1.10');
    expect(text).toContain('1.25');
    expect(text).not.toContain('5000-846607');
    expect(text).not.toContain('the SBA minimum is 1.15');
    expect(text).not.toContain('SBA 7(a) requires a minimum DSCR of 1.15');
    expect(text).not.toContain('Lenders require DSCR of 1.25+');
  });
});

describe('bond-calculator audit', () => {
  // Oracle: python Decimal bisection on the discounted cash flows (price = sum C/(1+y)^t + F/(1+y)^n),
  // YTM = periodic yield x payments per year (bond-equivalent). Calculator tolerance is $0.0001 of price.
  const b = { faceValue: '1000', couponRate: '5', marketPrice: '950', yearsToMaturity: '10', paymentFrequency: '2' };
  const ytm = (r: unknown) => num(val(r, 'ytm'));
  it('10-yr 5% semi-annual: price $950 -> YTM 5.6617%, $1,050 -> 4.3772%, par -> 5%', () => {
    const d = bond.calculate(b);
    expect(ytm(d)).toBeCloseTo(5.66169, 3);
    expect(val(d, 'currentYield')).toBe('5.2632%');
    expect(val(d, 'totalCoupons')).toBe('$500.00');
    expect(ytm(bond.calculate({ ...b, marketPrice: '1050' }))).toBeCloseTo(4.37724, 3);
    expect(ytm(bond.calculate({ ...b, marketPrice: '1000' }))).toBeCloseTo(5, 3);
  });
  it('a par bond is labelled as par, not as a discount bond with YTM above the coupon', () => {
    const r = bond.calculate({ ...b, marketPrice: '1000' });
    expect(val(r, 'ytmVsCoupon')).toBe('Equal — Bond trading at par value');
    expect((r as { id: string; color?: string }[]).find((x) => x.id === 'ytm')?.color).toBe('neutral');
  });
  it('annual, zero-coupon, monthly and premium cases', () => {
    expect(ytm(bond.calculate({ faceValue: '1000', couponRate: '6', marketPrice: '980', yearsToMaturity: '5', paymentFrequency: '1' }))).toBeCloseTo(6.48102, 3);
    expect(ytm(bond.calculate({ faceValue: '1000', couponRate: '0', marketPrice: '600', yearsToMaturity: '10', paymentFrequency: '2' }))).toBeCloseTo(5.17405, 3);
    expect(ytm(bond.calculate({ faceValue: '1000', couponRate: '3', marketPrice: '900', yearsToMaturity: '2', paymentFrequency: '12' }))).toBeCloseTo(8.45205, 3);
    const prem = bond.calculate({ faceValue: '1000', couponRate: '8', marketPrice: '1200', yearsToMaturity: '7', paymentFrequency: '2' });
    expect(ytm(prem)).toBeCloseTo(4.62305, 3);
    expect(val(prem, 'currentYield')).toBe('6.6667%');
    expect(val(prem, 'capitalGainLoss')).toBe('-$200.00');
    expect(val(prem, 'totalReturn')).toBe('$360.00');
  });
  it('maturity that is not a whole number of coupon periods is priced on whole coupons (2.5 yr annual = 3 coupons)', () => {
    const r = bond.calculate({ faceValue: '1000', couponRate: '5', marketPrice: '950', yearsToMaturity: '2.5', paymentFrequency: '1' });
    expect(ytm(r)).toBeCloseTo(6.90184, 3);
    expect(val(r, 'totalCoupons')).toBe('$150.00');
  });
});

describe('rent-affordability-calculator audit', () => {
  // Oracle: arithmetic (30% / 25% / custom % of gross monthly income; 40x rule = annual income / 40; hourly = rate x 40 x 52 / 12).
  it('$75k, 30% rule: $1,875 rent, $4,025 left after $350 debts', () => {
    const r = rentAffordability.calculate({ grossIncome: '75000', incomeFrequency: 'annual', monthlyDebts: '350', rentRule: '30' });
    expect(val(r, 'maxRent')).toBe('$1,875.00');
    expect(val(r, 'monthlyIncome')).toBe('$6,250.00');
    expect(val(r, 'remainingAfterRent')).toBe('$4,025.00/mo');
    expect(val(r, 'annualRent')).toBe('$22,500');
    expect(val(r, 'landlordRule')).toBe('Yes — income qualifies');
  });
  it('40x rule on $6,000/mo = $72,000 / 40 = $1,800; hourly $30 at 25% = $1,300 on $5,200/mo', () => {
    expect(val(rentAffordability.calculate({ grossIncome: '6000', incomeFrequency: 'monthly', monthlyDebts: '0', rentRule: '40x' }), 'maxRent')).toBe('$1,800.00');
    const h = rentAffordability.calculate({ grossIncome: '30', incomeFrequency: 'hourly', monthlyDebts: '', rentRule: '25' });
    expect(val(h, 'monthlyIncome')).toBe('$5,200.00');
    expect(val(h, 'maxRent')).toBe('$1,300.00');
  });
  it('custom 35% on $90k: $2,625 rent needs $8,750/mo to clear the 40x test', () => {
    const r = rentAffordability.calculate({ grossIncome: '90000', incomeFrequency: 'annual', monthlyDebts: '500', rentRule: 'custom', customPct: '35' });
    expect(val(r, 'maxRent')).toBe('$2,625.00');
    expect(val(r, 'landlordRule')).toBe('No — landlords require ~$8,750.00/mo income');
  });
  it('blank income returns nothing', () => {
    expect(rentAffordability.calculate({ grossIncome: '' })).toEqual([]);
  });
});

describe('annuity-payout-calculator audit', () => {
  // Oracle: python Decimal. PMT = P r / (1 - (1+r)^-n); n = ln(PMT/(PMT - P r)) / ln(1+r).
  const a = { solveFor: 'payout', principal: '500000', annualReturn: '5', payoutFrequency: 'monthly', desiredYears: '30', inflationAdjust: 'adjusted', payoutAmount: '' };
  it('$500k, 5%, 30 years monthly: $2,684.11/mo; final-year payout in today\'s dollars (1.03^30) $1,105.82', () => {
    const r = annuityPayout.calculate(a);
    expect(val(r, 'pmt')).toBe('$2,684.11/mo');
    expect(val(r, 'totalPayout')).toBe('$966,279');
    expect(val(r, 'infAdjPmt')).toBe('$1,105.82/mo');
  });
  it('$250k at 4% for 20 years: $1,514.95/mo; annual payout of $500k at 5% for 30 years: $32,525.72/yr', () => {
    expect(val(annuityPayout.calculate({ ...a, principal: '250000', annualReturn: '4', desiredYears: '20', inflationAdjust: 'nominal' }), 'pmt')).toBe('$1,514.95/mo');
    expect(val(annuityPayout.calculate({ ...a, payoutFrequency: 'annually', inflationAdjust: 'nominal' }), 'pmt')).toBe('$32,525.72/yr');
  });
  it('how long: $400k at 6% paying $3,000/mo lasts 220.27 months = 18 years 4 months', () => {
    const r = annuityPayout.calculate({ ...a, solveFor: 'duration', principal: '400000', annualReturn: '6', payoutAmount: '3000', inflationAdjust: 'nominal', desiredYears: '' });
    expect(val(r, 'duration')).toBe('18 years and 4 months');
    expect(val(r, 'totalPayout')).toBe('$660,815'); // exact ledger total $660,815.40 (was $660,814 from the fractional-period shortcut)
  });
  it('annual payouts of $20k from $300k at 4% last 23.36 years (23 years 4 months)', () => {
    const r = annuityPayout.calculate({ ...a, solveFor: 'duration', principal: '300000', annualReturn: '4', payoutFrequency: 'annually', payoutAmount: '20000', inflationAdjust: 'nominal', desiredYears: '' });
    expect(val(r, 'duration')).toBe('23 years and 4 months');
  });
  it('edge cases: withdrawals within interest last indefinitely; 0% return is plain division', () => {
    const inf = annuityPayout.calculate({ ...a, solveFor: 'duration', principal: '1000000', payoutAmount: '4000', inflationAdjust: 'nominal', desiredYears: '' });
    expect(val(inf, 'infinite')).toContain('indefinitely');
    const z = annuityPayout.calculate({ ...a, solveFor: 'duration', principal: '100000', annualReturn: '0', payoutAmount: '1000', inflationAdjust: 'nominal', desiredYears: '' });
    expect(val(z, 'duration')).toBe('8 years and 4 months');
    expect(val(annuityPayout.calculate({ ...a, annualReturn: '0', principal: '120000', desiredYears: '20', inflationAdjust: 'nominal' }), 'pmt')).toBe('$500.00/mo');
  });

  // Oracle: python Decimal month-by-month ledger. Whole payments, then a final payment = remaining balance plus one period of interest.
  it('annual mode is exact: $300k at 4%, $20k/yr = 23 full payments + final $7,339.17 = $467,339.17 (the old fractional-period total was $467,248.38)', () => {
    const r = annuityPayout.calculate({ ...a, solveFor: 'duration', principal: '300000', annualReturn: '4', payoutFrequency: 'annually', payoutAmount: '20000', inflationAdjust: 'nominal', desiredYears: '' });
    expect(val(r, 'totalPayout')).toBe('$467,339');
    expect((r as { id: string; interpretation?: string }[]).find((x) => x.id === 'totalPayout')?.interpretation)
      .toBe('Includes 23 full payments of $20,000.00 plus a final payment of $7,339.17 (remaining balance with one period of interest).');
    expect(val(r, 'interest')).toBe('$167,339');
  });
  it('monthly mode is exact too: $400k at 6%, $3,000/mo = 220 full payments + final $815.40 = $660,815.40', () => {
    const r = annuityPayout.calculate({ ...a, solveFor: 'duration', principal: '400000', annualReturn: '6', payoutAmount: '3000', inflationAdjust: 'nominal', desiredYears: '' });
    expect(val(r, 'totalPayout')).toBe('$660,815');
    expect((r as { id: string; interpretation?: string }[]).find((x) => x.id === 'totalPayout')?.interpretation).toContain('final payment of $815.40');
  });
});

describe('401k-calculator audit', () => {
  // Oracle: python Decimal year-by-year simulation: contribution = salary x rate (+ match = salary x min(rate, limit) x match%),
  // monthly compounding at r/12 with end-of-month deposits, salary raised each year.
  const k = { currentAge: '30', retirementAge: '65', currentBalance: '50000', annualSalary: '120000', salaryIncrease: '3', yourContribution: '6', employerMatch: '50', employerMatchLimit: '6', rateOfReturn: '7' };
  it('Maria: $2.87M, $435,327 own + $217,663 match + $2.16M growth (75.5%), 4% rule $9,559/mo', () => {
    const r = k401.calculate(k);
    expect(val(r, 'totalBalance')).toBe('$2.87M');
    expect(val(r, 'yourContribs')).toBe('$435,327');
    expect(val(r, 'employerContribs')).toContain('$217,663');
    expect(val(r, 'investmentReturns')).toBe('$2.16M');
    expect(val(r, 'returnsPct')).toBe('75.5%');
    expect(val(r, 'monthlyRetirement')).toBe('$9,559/mo');
  });
  it('David contributes 10% but only the first 6 points are matched: $788,751, match $68,708', () => {
    const r = k401.calculate({ ...k, currentAge: '45', retirementAge: '67', currentBalance: '30000', annualSalary: '75000', yourContribution: '10' });
    expect(val(r, 'totalBalance')).toBe('$788,751');
    expect(val(r, 'yourContribs')).toBe('$229,026');
    expect(val(r, 'employerContribs')).toContain('$68,708');
    expect(val(r, 'investmentReturns')).toBe('$461,017');
  });
  it('no match, 2% raises, 5% return, age 30-60: $261,676', () => {
    const r = k401.calculate({ ...k, retirementAge: '60', currentBalance: '0', annualSalary: '60000', salaryIncrease: '2', yourContribution: '5', employerMatch: '', employerMatchLimit: '', rateOfReturn: '5' });
    expect(val(r, 'totalBalance')).toBe('$261,676');
    expect(val(r, 'yourContribs')).toBe('$121,704');
    expect(val(r, 'investmentReturns')).toBe('$139,972');
  });
  it('nothing saved shows 0.0% (not NaN%) for the growth share', () => {
    const r = k401.calculate({ ...k, currentAge: '40', retirementAge: '41', currentBalance: '0', annualSalary: '50000', yourContribution: '0', employerMatch: '', employerMatchLimit: '', rateOfReturn: '0' });
    expect(val(r, 'totalBalance')).toBe('$0');
    expect(val(r, 'returnsPct')).toBe('0.0%');
  });
});

describe('mortgage-payoff-calculator audit', () => {
  // Oracle: python Decimal month-by-month simulation (interest on opening balance, extra principal each month,
  // yearly lump with payments 13, 25, ..., single lump up front).
  const po = { interestRate: '6.75', yearlyLumpSum: '', singleLumpSum: '' };
  it('$350k, 6.75%, $2,270.09 payment: $300/mo extra saves $151,700.49 of interest and 102 months', () => {
    const r = mortgagePayoff.calculate({ ...po, currentBalance: '350000', monthlyPayment: '2270.09', extraMonthly: '300' });
    expect(val(r, 'standardInterest')).toBe('$467,236.30');
    expect(val(r, 'newTotalInterest')).toBe('$315,535.81');
    expect(val(r, 'interestSaved')).toBe('$151,700.49');
    expect(val(r, 'timeSaved')).toBe('8 yrs 6 mo');
  });
  it('$280k, $2,270 payment: standard interest $198,999.98; with $300/mo + $2,000/yr + $10,000 now saves $72,674.13 and 67 months', () => {
    const r = mortgagePayoff.calculate({ ...po, currentBalance: '280000', monthlyPayment: '2270', extraMonthly: '300', yearlyLumpSum: '2000', singleLumpSum: '10000' });
    expect(val(r, 'standardInterest')).toBe('$198,999.98');
    expect(val(r, 'interestSaved')).toBe('$72,674.13');
    expect(val(r, 'newTotalInterest')).toBe('$126,325.86');
    expect(val(r, 'timeSaved')).toBe('5 yrs 7 mo');
    const l = mortgagePayoff.calculate({ ...po, currentBalance: '280000', monthlyPayment: '2270', extraMonthly: '', singleLumpSum: '10000' });
    expect(val(l, 'interestSaved')).toBe('$21,494.95');
    expect(val(l, 'timeSaved')).toBe('1 yr 2 mo');
  });
  it('edge cases: 0% rate saves no interest but saves time; a payment that cannot cover interest is flagged', () => {
    const z = mortgagePayoff.calculate({ currentBalance: '120000', interestRate: '0', monthlyPayment: '1000', extraMonthly: '500' });
    expect(val(z, 'standardInterest')).toBe('$0.00');
    expect(val(z, 'timeSaved')).toBe('3 yrs 4 mo'); // 120 months -> 80 months
    expect(val(mortgagePayoff.calculate({ ...po, currentBalance: '280000', monthlyPayment: '1500' }), 'negativeAmortization')).toContain('too low');
  });
});

describe('mortgage-comparison-calculator audit', () => {
  // Oracle: python Decimal. PMT for 180 and 360 months; PMI at loan x rate / 12 until the scheduled balance first
  // reaches 80% of the price; savings = interest + PMI paid under 30-yr minus under 15-yr.
  const c = { homePrice: '400000', downPayment: '80000', rate15: '5.5', rate30: '6.5', propertyTaxRate: '0.8', annualInsurance: '1200', pmiRate: '0.5' };
  it('$400k, 20% down, 5.5% vs 6.5%: $2,981.33 vs $2,389.28 a month, interest $150,640 vs $408,142, saves $257,502', () => {
    const r = mortgageComparison.calculate(c);
    expect(val(r, 'monthly15')).toBe('$2,981.33');
    expect(val(r, 'monthly30')).toBe('$2,389.28');
    expect(val(r, 'interest15')).toBe('$150,640');
    expect(val(r, 'interest30')).toBe('$408,142');
    expect(val(r, 'savings')).toBe('$257,502');
    expect(val(r, 'extraMonthly')).toBe('$592.05');
    expect(val(r, 'pmiDuration')).toBeUndefined();
  });
  it('$250k, 5% down: PMI $98.96/mo drops after 3.4 / 10.6 years; monthly $2,437.85 vs $2,006.05; savings $208,061', () => {
    const r = mortgageComparison.calculate({ ...c, homePrice: '250000', downPayment: '12500', rate15: '5.75', rate30: '6.75', propertyTaxRate: '1.4', annualInsurance: '900' });
    expect(val(r, 'monthly15')).toBe('$2,437.85');
    expect(val(r, 'monthly30')).toBe('$2,006.05');
    expect(val(r, 'interest15')).toBe('$117,500');
    expect(val(r, 'interest30')).toBe('$317,051');
    expect(val(r, 'savings')).toBe('$208,061');
    expect(val(r, 'pmiDuration')).toBe('3.4 yrs / 10.6 yrs');
  });
  it('zero down on $300k at 5% / 6%: PMI 4.1 / 11.7 years, savings $231,861', () => {
    const r = mortgageComparison.calculate({ ...c, homePrice: '300000', downPayment: '0', rate15: '5', rate30: '6', propertyTaxRate: '1', annualInsurance: '' });
    expect(val(r, 'monthly15')).toBe('$2,747.38');
    expect(val(r, 'pmiDuration')).toBe('4.1 yrs / 11.7 yrs');
    expect(val(r, 'savings')).toBe('$231,861');
  });
  it('blank rate or down payment >= price returns nothing', () => {
    expect(mortgageComparison.calculate({ ...c, rate15: '' })).toEqual([]);
    expect(mortgageComparison.calculate({ ...c, downPayment: '400000' })).toEqual([]);
  });
});

describe('new-york-mortgage-calculator audit', () => {
  // Oracle: python Decimal PMT; NYS Form MT-15 recording tax (NYC 2.05% / 2.175%, MCTD 1.05%, Westchester/Rockland 1.30%,
  // upstate 1.00%; lender pays the 0.25% special additional tax); 1% mansion tax at $1M; STAR = exempt full value x school-tax rate.
  const n = { homePrice: '400000', downPayment: '80000', interestRate: '6.7', loanTerm: '30', propertyTaxRate: '0.9', starEligible: 'basic', mrtRegion: 'nyc' };
  it('$400k Queens condo, 20% down: P&I $2,064.89, total $2,364.89, STAR $162, borrower recording tax $5,760', () => {
    const r = newYorkMortgage.calculate(n);
    expect(val(r, 'monthlyPayment')).toBe('$2,064.89');
    expect(val(r, 'totalMonthly')).toBe('$2,364.89');
    expect(val(r, 'totalInterest')).toBe('$423,360');
    expect(val(r, 'propertyTaxNote')).toBe('$3,600/yr');
    expect(val(r, 'starSavings')).toBe('$162/yr');
    expect(val(r, 'recordingTax')).toBe('$5,760.00'); // 1.80% of 320,000 (2.05% total 6,560 less 800 lender share)
  });
  it('$250k upstate, 10% down: P&I $1,451.88 + $500 tax + $93.75 PMI = $2,045.63; recording tax $1,687.50', () => {
    const r = newYorkMortgage.calculate({ homePrice: '250000', downPayment: '25000', interestRate: '6.7', loanTerm: '30', propertyTaxRate: '2.4', starEligible: 'basic', mrtRegion: 'upstate' });
    expect(val(r, 'monthlyPayment')).toBe('$1,451.88');
    expect(val(r, 'totalMonthly')).toBe('$2,045.63');
    expect(val(r, 'starSavings')).toBe('$432/yr');
    expect(val(r, 'recordingTax')).toBe('$1,687.50');
  });
  it('$500k NYC at 1.3% property tax, no STAR: loan under $500k uses 2.05% -> borrower pays $7,200', () => {
    const r = newYorkMortgage.calculate({ ...n, homePrice: '500000', downPayment: '100000', propertyTaxRate: '1.3', starEligible: 'none' });
    expect(val(r, 'monthlyPayment')).toBe('$2,581.11');
    expect(val(r, 'recordingTax')).toBe('$7,200.00');
    expect(val(r, 'starSavings')).toBe('Not eligible');
  });
  it('$1.2M Westchester with Enhanced STAR: mansion tax $12,000, recording tax $10,080, STAR $584', () => {
    const r = newYorkMortgage.calculate({ homePrice: '1200000', downPayment: '240000', interestRate: '6.5', loanTerm: '30', propertyTaxRate: '1.1', starEligible: 'enhanced', mrtRegion: 'westchester' });
    expect(val(r, 'monthlyPayment')).toBe('$6,067.85');
    expect(val(r, 'mansionTax')).toBe('$12,000.00');
    expect(val(r, 'recordingTax')).toBe('$10,080.00');
    expect(val(r, 'starSavings')).toBe('$584/yr');
  });
  it('0% rate 15-year on a $480k loan is $2,666.67/mo with no interest', () => {
    const r = newYorkMortgage.calculate({ homePrice: '600000', downPayment: '120000', interestRate: '0', loanTerm: '15', propertyTaxRate: '1', starEligible: 'none', mrtRegion: 'mctd' });
    expect(val(r, 'monthlyPayment')).toBe('$2,666.67');
    expect(val(r, 'totalInterest')).toBe('$0');
    expect(val(r, 'recordingTax')).toBe('$3,840.00');
  });

  // Source: NYS Form MT-15 (rev. 1/25) page 4 rate tables, per $100: Table 1 (MCTD) $1.05, Table 2 (upstate, no local tax) $1.00,
  // Table 4 (NYC) $2.05 / $2.175 (1-3 family or condo >= $500,000), Table 5 Westchester/Rockland $1.30. Verified, unchanged.
  it('recording-tax region totals match the MT-15 rate tables', () => {
    expect(MRT_REGIONS.nyc.total(499999)).toBe(0.0205);
    expect(MRT_REGIONS.nyc.total(500000)).toBe(0.02175);
    expect(MRT_REGIONS.mctd.total(1)).toBe(0.0105);
    expect(MRT_REGIONS.westchester.total(1)).toBe(0.013);
    expect(MRT_REGIONS.upstate.total(1)).toBe(0.01);
  });
});
