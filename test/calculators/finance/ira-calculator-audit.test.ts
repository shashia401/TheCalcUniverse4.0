import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/ira-calculator/index';
import { iraProjection } from '../../../src/calculators/finance/ira-calculator/iraMath';
import { IRA_LIMITS, ROTH_IRA_INCOME_LIMITS, DEDUCTIBLE_IRA_LIMITS } from '../../../src/utils/taxData';
import { getValue } from '../../helpers';

// Reference: independent Python month loop (end-of-month deposits, r/12).
const alex = { currentAge: '26', retirementAge: '65', currentBalance: '18000', annualContribution: '7000', expectedReturn: '7', marginalTaxRate: '22', retirementTaxRate: '22' };
const diana = { currentAge: '48', retirementAge: '67', currentBalance: '120000', annualContribution: '7500', expectedReturn: '6', marginalTaxRate: '32', retirementTaxRate: '12' };

describe('ira-calculator audit', () => {
  it('2026 limits (IRS Notice 2025-67): $7,500, +$1,100 catch-up, Roth phase-out 153k-168k / 242k-252k, deductible 81k-91k / 129k-149k', () => {
    expect(IRA_LIMITS.base).toBe(7500);
    expect(IRA_LIMITS.catchup).toBe(1100);
    expect(IRA_LIMITS.totalAge50Plus).toBe(8600);
    expect(ROTH_IRA_INCOME_LIMITS.single).toEqual({ start: 153000, end: 168000 });
    expect(ROTH_IRA_INCOME_LIMITS.mfj).toEqual({ start: 242000, end: 252000 });
    expect(DEDUCTIBLE_IRA_LIMITS.single).toEqual({ start: 81000, end: 91000 });
    expect(DEDUCTIBLE_IRA_LIMITS.mfj).toEqual({ start: 129000, end: 149000 });
  });

  it('Alex: equal rates tie exactly; Roth $1,694,987, Traditional after-tax $1,382,328, invested deduction $312,659', () => {
    const r = config.calculate(alex);
    expect(getValue(r, 'rothBalance')).toBe('$1.69M');
    expect(getValue(r, 'tradAfterTax')).toBe('$1.38M');
    expect(getValue(r, 'tradTaxSavingsInvested')).toBe('$312,659');
    expect(getValue(r, 'winner')).toBe('Tie — identical outcome');
    const p = iraProjection({ years: 39, currentBalance: 18000, contribution: 7000, annualReturn: 0.07, marginalRate: 0.22, retireRate: 0.22 });
    expect(p.rothBalance).toBeCloseTo(1_694_986.81, 1);
    expect(p.tradAfterTax).toBeCloseTo(1_382_328.26, 1);
    expect(p.rothAdvantage).toBeCloseTo(0, 6);
  });

  it('Diana: 32% now vs 12% later -> Traditional wins by $52,947', () => {
    const p = iraProjection({ years: 19, currentBalance: 120000, contribution: 7500, annualReturn: 0.06, marginalRate: 0.32, retireRate: 0.12 });
    expect(p.rothBalance).toBeCloseTo(638_885.32, 1);
    expect(p.tradAfterTax).toBeCloseTo(607_116.83, 1);
    expect(p.taxSavingsInvested).toBeCloseTo(84_715.97, 1);
    expect(p.rothAdvantage).toBeCloseTo(-52_947.48, 1);
    const r = config.calculate(diana);
    expect(getValue(r, 'winner')).toBe('Traditional wins by $52,947'.replace('$52,947', '$52,947'));
    expect(getValue(r, 'breakevenRate')).toBe('32.0%');
  });

  it('a 0% expected retirement rate is honoured (regression: "0" fell back to 12%)', () => {
    const r = config.calculate({ ...diana, retirementTaxRate: '0' });
    // no withdrawal tax: Traditional after-tax equals the Roth balance
    expect(getValue(r, 'tradAfterTax')).toBe(getValue(r, 'rothBalance'));
  });

  it('contribution above the limit is capped with a warning; 50+ gets the catch-up', () => {
    const r = config.calculate({ ...alex, annualContribution: '12000' });
    expect(r.some((x) => x.id === 'limitWarning')).toBe(true);
    const capped = config.calculate({ ...alex, annualContribution: '7500' });
    expect(getValue(r, 'rothBalance')).toBe(getValue(capped, 'rothBalance'));
    const old = config.calculate({ ...alex, currentAge: '55', retirementAge: '65', annualContribution: '8600' });
    expect(old.some((x) => x.id === 'limitWarning')).toBe(false);
  });

  it('2026 bracket labels come from the Rev. Proc. 2025-32 table', () => {
    const opts = config.inputs.find((i) => i.id === 'marginalTaxRate')!.options!;
    expect(opts[0].label).toBe('10% — Single up to $12,400 / MFJ up to $24,800');
    expect(opts[3].label).toContain('$105,700–$201,775');
    expect(opts[6].label).toBe('37% — Single over $640,600 / MFJ over $768,700');
  });

  it('retirement age must exceed current age', () => {
    expect(config.calculate({ ...alex, retirementAge: '26' })).toEqual([]);
  });
});
