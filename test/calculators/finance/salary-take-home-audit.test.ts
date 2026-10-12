import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/salary-take-home/index';
import { computeTakeHome } from '../../../src/calculators/finance/salary-take-home/takeHomeMath';
import { getValue, parseMoney, near } from '../../helpers';

const base = { annualSalary: '75000', filingStatus: 'single', state: 'none', payFrequency: 'monthly', preTaxDeductions: '0' };

describe('salary-take-home audit', () => {
  it('MFJ additional Medicare only starts above 250,000 (regression: 200,000 single threshold was applied to MFJ)', () => {
    const r = config.calculate({ ...base, annualSalary: '220000', filingStatus: 'mfj' });
    // SS 184,500 x 6.2% = 11,439; Medicare 220,000 x 1.45% = 3,190; no 0.9% surtax below 250,000
    near(parseMoney(getValue(r, 'totalFICA')), 14629, 0.01);
    const s = config.calculate({ ...base, annualSalary: '220000' });
    // single: + 0.9% x 20,000 = 180
    near(parseMoney(getValue(s, 'totalFICA')), 14809, 0.01);
  });

  it('state tax is on income after the pre-tax deferral (regression: charged on gross)', () => {
    // NY single, 100,000 with 10% pre-tax: wages 90,000 - std 8,000 = 82,000
    // 8,500 x 3.9% 331.50 + 3,200 x 4.4% 140.80 + 2,200 x 5.15% 113.30 + 66,750 x 5.4% 3,604.50 + 1,350 x 5.9% 79.65
    const r = config.calculate({ ...base, annualSalary: '100000', state: 'NY', preTaxDeductions: '10' });
    near(parseMoney(getValue(r, 'totalStateTax')), 4269.75, 0.01);
  });

  it('Louisiana (listed in the picker) is taxed: flat 3% after the 12,875 standard deduction', () => {
    const r = config.calculate({ ...base, state: 'LA' });
    near(parseMoney(getValue(r, 'totalStateTax')), (75000 - 12875) * 0.03, 0.01);
  });

  it('all 50 states are selectable and none returns NaN', () => {
    const opts = config.inputs.find((i) => i.id === 'state')!.options!;
    expect(opts.length).toBe(51); // 50 states + "none"
    for (const o of opts) {
      const r = config.calculate({ ...base, state: o.value });
      expect(r.length).toBeGreaterThan(0);
      for (const x of r) expect(x.value).not.toMatch(/NaN|Infinity|undefined/);
    }
  });

  it('interpretation keeps-percent equals net / gross', () => {
    const r = config.calculate(base);
    const net = parseMoney(getValue(r, 'netAnnual'));
    const keep = Math.round((net / 75000) * 100);
    expect(r.find((x) => x.id === 'netAnnual')!.interpretation).toContain(`about ${keep}% of gross`);
  });

  it('warns when the pre-tax deferral exceeds the 2026 401(k) limit of 24,500', () => {
    const r = config.calculate({ ...base, annualSalary: '100000', preTaxDeductions: '30' });
    expect(r.find((x) => x.id === 'netAnnual')!.warning).toMatch(/24,500/);
    const ok = config.calculate({ ...base, annualSalary: '100000', preTaxDeductions: '20' });
    expect(ok.find((x) => x.id === 'netAnnual')!.warning).toBeUndefined();
  });

  it('the shared engine and the panel math agree on the same values', () => {
    const t = computeTakeHome({ ...base, annualSalary: '100000', state: 'CA' })!;
    const r = config.calculate({ ...base, annualSalary: '100000', state: 'CA' });
    near(parseMoney(getValue(r, 'netAnnual')), t.calc.netAnnual, 0.01);
  });
});
