import { describe, it, expect, vi, afterEach } from 'vitest';
import mortgage, { mortgageFigures } from '../../../src/calculators/finance/mortgage-calculator';
import { PMI_ANNUAL_RATE } from '../../../src/calculators/realestate/mortgage-amortization/mortgageMath';
import { monthsToEightyPercentLtv } from '../../../src/calculators/finance/down-payment';
import { calculatorRegistry, getCalculatorById } from '../../../src/calculators/registry';
import { decisionToolFor } from '../../../src/data/decisionTools';
import { getBlogPostBySlug } from '../../../src/blog/registry';
import { seedDefaults } from '../../../src/lib/initialForm';
import { getValue } from '../../helpers';

afterEach(() => vi.useRealTimers());

const defaults = seedDefaults(mortgage.inputs);

describe('mortgage-calculator: inputs and defaults', () => {
  it('the form opens on a worked answer: 400,000 home, 80,000 down, 30 years, 6.8%, 1.1% tax, 1,500 insurance', () => {
    expect(defaults).toEqual({
      homePrice: '400000', downPayment: '80000', downPaymentPct: '', loanTerm: '30', interestRate: '6.8',
      propertyTax: '1.1', homeInsurance: '1500', hoaFee: '0',
    });
    // Python oracle: P&I 2,086.16 + tax 366.67 + insurance 125.00
    expect(getValue(mortgage.calculate(defaults), 'totalMonthly')).toBe('$2,577.83');
  });

  it('offers exactly 10 / 15 / 20 / 30 year terms', () => {
    const term = mortgage.inputs.find((i) => i.id === 'loanTerm')!;
    expect(term.options!.map((o) => o.value)).toEqual(['10', '15', '20', '30']);
  });

  it('result does not depend on today\'s date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2020-01-31T12:00:00Z'));
    const a = mortgage.calculate({ ...defaults, downPayment: '20000' });
    vi.setSystemTime(new Date('2041-07-04T12:00:00Z'));
    const b = mortgage.calculate({ ...defaults, downPayment: '20000' });
    expect(a).toEqual(b);
    expect(a.length).toBeGreaterThan(0);
  });
});

describe('mortgage-calculator: reuses the shared mortgage helpers', () => {
  it('PMI rate is the shared constant (0.8% of the loan a year)', () => {
    const f = mortgageFigures({ ...defaults, downPayment: '20000' })!; // loan 380,000
    expect(f.monthlyPmi.toNumber()).toBeCloseTo((380000 * PMI_ANNUAL_RATE) / 12, 2);
  });

  it('PMI-stop month equals the shared monthsToEightyPercentLtv', () => {
    const f = mortgageFigures({ ...defaults, downPayment: '20000' })!;
    expect(f.pmiMonths).toBe(monthsToEightyPercentLtv(400000, 380000, 6.8, 30));
    expect(f.pmiMonths).toBe(127); // Python oracle
  });

  it('no PMI figures when 20% or more is put down', () => {
    const f = mortgageFigures(defaults)!;
    expect(f.hasPmi).toBe(false);
    expect(f.pmiMonths).toBe(0);
    expect(f.monthlyPmi.toNumber()).toBe(0);
  });

  it('the result rows include the cost breakdown panel data (extraPanel renders for a valid answer only)', () => {
    expect(mortgage.extraPanel!(defaults, mortgage.calculate(defaults))).not.toBeNull();
    expect(mortgage.extraPanel!({}, [])).toBeNull();
  });
});

describe('mortgage-calculator: educational content is consistent with the calculator', () => {
  const ed = mortgage.educational!;

  it('has formula, variables, 3 worked examples, FAQs, tips, limitations and citations', () => {
    expect(ed.formula).toBeTruthy();
    expect(ed.variables!.length).toBeGreaterThanOrEqual(4);
    expect(ed.workedExamples!).toHaveLength(3);
    expect(ed.faqs!.length).toBeGreaterThanOrEqual(5);
    expect(ed.proTips!.length).toBeGreaterThan(0);
    expect(ed.limitations!.length).toBeGreaterThan(0);
    expect(ed.citations!.some((c) => c.url.includes('consumerfinance.gov'))).toBe(true);
  });

  it('the stated example results match the calculator (values verified in Python)', () => {
    const [a, b, c] = ed.workedExamples!;
    const ra = mortgage.calculate(a.inputs);
    expect(a.result).toContain(getValue(ra, 'monthlyPI'));
    expect(a.result).toContain(getValue(ra, 'totalMonthly'));
    expect(a.result).toContain(getValue(ra, 'totalInterest'));
    const rb = mortgage.calculate(b.inputs);
    expect(b.result).toContain(getValue(rb, 'monthlyPmi'));
    expect(b.result).toContain(getValue(rb, 'totalMonthly'));
    expect(b.result).toContain('payment 127 (10 yr 7 mo)');
    expect(b.result).toContain('$32,172.91'); // 127 x 253.33
    const rc = mortgage.calculate(c.inputs);
    expect(c.result).toContain(getValue(rc, 'monthlyPI'));
    expect(c.result).toContain(getValue(rc, 'totalMonthly'));
    expect(c.result).toContain(getValue(rc, 'totalInterest'));
  });

  it('avoids volatile claims', () => {
    const text = JSON.stringify(ed).toLowerCase();
    expect(text).not.toMatch(/current (mortgage )?rates?|today'?s rates?|median (home|house) price/);
    // example numbers are labelled as examples
    for (const w of ed.workedExamples!) expect(w.scenario).toMatch(/example/i);
  });

  it('FAQ explains what is included/excluded and how it differs from the amortization page', () => {
    const q = ed.faqs!.map((f) => f.question).join('\n');
    expect(q).toMatch(/include/i);
    expect(q).toMatch(/leave out/i);
    expect(q).toMatch(/amortization/i);
  });
});

describe('mortgage-calculator: site wiring', () => {
  const entry = getCalculatorById('mortgage-calculator')!;

  it('is registered in finance with a keyword-first title of at most 60 characters', () => {
    expect(entry).toBeDefined();
    expect(entry.categorySlug).toBe('finance');
    expect(entry.title).toBe('Mortgage Calculator: Payment with Taxes, Insurance & PMI');
    expect(entry.title.length).toBeLessThanOrEqual(60);
    expect(entry.shortTitle).toBe('Mortgage Calculator');
    expect(entry.description.length).toBeGreaterThanOrEqual(120);
    expect(entry.description.length).toBeLessThanOrEqual(160);
  });

  it('title and description are unique in the registry', () => {
    const others = calculatorRegistry.filter((c) => c.id !== 'mortgage-calculator');
    expect(others.some((c) => c.title === entry.title)).toBe(false);
    expect(others.some((c) => c.description === entry.description)).toBe(false);
  });

  it('relatedIds and relatedPosts all resolve', () => {
    expect(entry.relatedIds!.length).toBeGreaterThanOrEqual(4);
    for (const id of entry.relatedIds!) expect(getCalculatorById(id), id).toBeDefined();
    for (const slug of entry.relatedPosts ?? []) expect(getBlogPostBySlug(slug), slug).toBeDefined();
  });

  it('the neighbouring mortgage pages link back to it', () => {
    for (const id of [
      'mortgage-amortization-calculator', 'house-affordability-calculator', 'refinance-calculator',
      'texas-mortgage-calculator', 'california-mortgage-calculator', 'new-york-mortgage-calculator', 'va-mortgage-calculator',
    ]) {
      expect(getCalculatorById(id)!.relatedIds, id).toContain('mortgage-calculator');
    }
  });

  it('shows the "Making a decision?" banner for the house tool', () => {
    expect(decisionToolFor('mortgage-calculator')?.slug).toBe('can-i-afford-a-house');
  });

  it('the registry loader resolves to this config', async () => {
    const mod = await entry.loader();
    expect(mod.default).toBe(mortgage);
  });
});
