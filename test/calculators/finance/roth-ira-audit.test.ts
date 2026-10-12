import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/roth-ira/index';
import { rothProjection, parseRothInputs } from '../../../src/calculators/finance/roth-ira/rothMath';
import { getValue, parseMoney, near } from '../../helpers';

const base = { currentAge: '30', retirementAge: '65', currentBalance: '15000', annualContribution: '7500', annualReturn: '7', marginalTaxRate: '22', expectedRetirementTaxRate: '22' };

describe('Roth IRA audit (2026 limits: IRS Notice 2025-67)', () => {
  it('year-by-year loop matches the projection (independent month-free check, 35 yrs at 7%)', () => {
    let b = 15000;
    for (let y = 0; y < 35; y++) b = b * 1.07 + 7500; // end-of-year deposits
    const p = rothProjection(parseRothInputs(base));
    near(p.balance, b, 0.01);
    near(p.earnings, b - 15000 - 7500 * 35, 0.01);
  });

  it('explanation example: 7,500/yr for 35 years at 7% is over $1M and ~75% earnings', () => {
    const p = rothProjection(parseRothInputs({ ...base, currentBalance: '0' }));
    expect(p.balance).toBeGreaterThan(1_000_000);
    near(p.earnings / p.balance, 0.747, 0.001);
  });

  it('Roth vs equal-cost Traditional: equal rates tie; lower retirement rate favours Traditional', () => {
    // After-tax Traditional = FV x (1-t)/(1-m)  (contribute C/(1-m) pre-tax, taxed at t)
    const tie = config.calculate(base);
    expect(tie.find((r) => r.id === 'rothVsTraditional')?.value).toBe('$0');
    const lower = config.calculate({ ...base, expectedRetirementTaxRate: '12' });
    const row = lower.find((r) => r.id === 'rothVsTraditional')!;
    expect(row.label).toMatch(/Traditional IRA Advantage/);
    const fv = rothProjection(parseRothInputs(base)).balance;
    near(parseMoney(row.value), fv * (0.88 / 0.78 - 1), fv * 1e-5); // displayed in $M
    const higher = config.calculate({ ...base, marginalTaxRate: '12', expectedRetirementTaxRate: '24' });
    expect(higher.find((r) => r.id === 'rothVsTraditional')?.label).toMatch(/Roth Advantage/);
  });

  it('tax on growth avoided = earnings x retirement rate', () => {
    const r = config.calculate({ ...base, expectedRetirementTaxRate: '12' });
    const p = rothProjection(parseRothInputs({ ...base, expectedRetirementTaxRate: '12' }));
    near(parseMoney(getValue(r, 'taxSavingsVsTraditional')), p.earnings * 0.12, p.earnings * 1e-4);
  });

  it('2026 limits: 7,500 under 50, 8,600 at 50+, warning text has no double space', () => {
    const under = config.calculate({ ...base, annualContribution: '9000' });
    expect(getValue(under, 'limitWarning')).toBe('Your $9,000 exceeds the limit of $7,500. Calculation uses $7,500.');
    const over50 = config.calculate({ ...base, currentAge: '55', annualContribution: '9000' });
    expect(getValue(over50, 'limitWarning')).toBe('Your $9,000 exceeds the age 50+ limit of $8,600. Calculation uses $8,600.');
  });

  it('phase-out figures in the text are the 2026 ones (153k-168k single, 242k-252k MFJ)', () => {
    const faq = config.educational.faqs!.map((f) => f.answer).join(' ');
    expect(faq).toContain('$168,000');
    expect(faq).toContain('$153,000');
    expect(faq).toContain('$242,000');
    expect(faq).toContain('$252,000');
  });

  it('zero return grows only by contributions', () => {
    const p = rothProjection(parseRothInputs({ ...base, annualReturn: '0' }));
    near(p.balance, 15000 + 7500 * 35, 0.001);
    expect(p.earnings).toBeCloseTo(0, 6);
  });
});
