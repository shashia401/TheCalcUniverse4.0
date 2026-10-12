import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/social-security/index';
import { estimatePIA, getFRA, fraLabel, monthlyBenefit, delayedCreditPerYear } from '../../../src/calculators/finance/social-security/ssMath';
import { getValue } from '../../helpers';

// 2026 bend points $1,286 / $7,749 (SSA PIA formula); PIA truncated to 10 cents, benefits to whole dollars.
describe('social-security audit', () => {
  it('PIA formula: AIME 5,000 -> 0.9*1286 + 0.32*3714 = 2,345.88 -> 2,345.80', () => {
    expect(estimatePIA(60000)).toBe(2345.8);
  });

  it('PIA third tier: 120,000 -> AIME 10,000 -> 1157.4 + 2068.16 + 337.65 = 3,563.21 -> 3,563.20', () => {
    expect(estimatePIA(120000)).toBe(3563.2);
  });

  it('income above the 184,500 taxable maximum adds nothing, and PIA never exceeds the 4,152 FRA maximum', () => {
    expect(estimatePIA(500000)).toBe(estimatePIA(184500));
    expect(estimatePIA(500000)).toBe(4152);
  });

  it('worked example Maria (1965, 85,000): 3,012 at FRA 67; 2,108 at 62 (70%); 3,735 at 70 (124%)', () => {
    const r = config.calculate({ birthYear: '1965', annualIncome: '85000', maritalStatus: 'single', retirementAge: '67' });
    expect(getValue(r, 'chosen')).toBe('$3,012/mo');
    expect(getValue(r, 'at62')).toBe('$2,108/mo (70% of FRA benefit)');
    expect(getValue(r, 'at70')).toBe('$3,735/mo (124% of FRA benefit)');
    // break-even (3012*67 - 2108*62)/(3012-2108) = 78.66 -> 79
    expect(getValue(r, 'breakeven')).toContain('Age 79');
  });

  it('worked example James (1970, 45,000): 1,362 / 1,945 / 2,412', () => {
    const r = config.calculate({ birthYear: '1970', annualIncome: '45000', maritalStatus: 'single', retirementAge: '62' });
    expect(getValue(r, 'chosen')).toBe('$1,362/mo');
    expect(getValue(r, 'at70')).toContain('$2,412/mo');
    expect(getValue(r, 'fra')).toContain('$1,945/mo');
  });

  it('couple example: 120,000 earner at 70 = 4,418; spousal top-up brings 30,000 earner (own 1,545) to 1,781', () => {
    const r = config.calculate({ birthYear: '1960', annualIncome: '120000', maritalStatus: 'married', retirementAge: '70', spouseIncome: '30000' });
    expect(getValue(r, 'chosen')).toBe('$4,418/mo');
    expect(getValue(r, 'spousal')).toContain('$1,782');
    expect(getValue(r, 'spouseBenefit')).toBe('Own $1,545/mo + $235 spousal top-up = $1,781/mo');
  });

  it('full retirement age table and label (regression: fractional FRA printed as 66.16666666666667)', () => {
    expect(getFRA(1937)).toBe(65);
    expect(getFRA(1943)).toBe(66);
    expect(getFRA(1954)).toBe(66);
    expect(fraLabel(getFRA(1955))).toBe('66 and 2 months');
    expect(fraLabel(getFRA(1959))).toBe('66 and 10 months');
    expect(getFRA(1960)).toBe(67);
    const r = config.calculate({ birthYear: '1957', annualIncome: '85000', maritalStatus: 'single', retirementAge: '67' });
    expect(getValue(r, 'fra')).toContain('Age 66 and 6 months');
  });

  it('early reduction: 5/9% for 36 months then 5/12% (FRA 66 claiming at 62 -> 75%; FRA 67 -> 70%)', () => {
    expect(monthlyBenefit(1000, 62, 66, 1950)).toBe(750);
    expect(monthlyBenefit(1000, 62, 67, 1965)).toBe(700);
    expect(monthlyBenefit(1000, 64, 67, 1965)).toBe(800); // 36 months x 5/9% = 20%
  });

  it('delayed credits: 8%/yr exactly (not the rounded 0.667%/month), lower for older cohorts', () => {
    expect(monthlyBenefit(1000, 70, 67, 1965)).toBe(1240);
    expect(monthlyBenefit(1000, 70, 66, 1950)).toBe(1320);
    expect(delayedCreditPerYear(1942)).toBe(0.075);
    expect(delayedCreditPerYear(1943)).toBe(0.08);
  });

  it('income is a full-career proxy: a young earner is not scaled down by years worked so far', () => {
    const young = config.calculate({ birthYear: '1998', annualIncome: '85000', maritalStatus: 'single', retirementAge: '67' });
    expect(getValue(young, 'chosen')).toBe('$3,012/mo');
  });
});
