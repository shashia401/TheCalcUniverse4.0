import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/marriage-tax/index';
import { getValue, parseMoney } from '../../helpers';

describe('marriage tax calculator', () => {
  it('two equal very high incomes produce a marriage penalty', () => {
    const r = config.calculate({
      income1: '600000',
      income2: '600000',
      deductionType: 'standard',
    });
    const unmarried = parseMoney(getValue(r, 'unmarriedTotal'));
    const married = parseMoney(getValue(r, 'marriedTotal'));
    expect(married).toBeGreaterThan(unmarried);
    const hero = getValue(r, 'hero');
    expect(hero).toContain('Pay');
  });

  it('one high earner + one low earner produces a marriage bonus', () => {
    const r = config.calculate({
      income1: '200000',
      income2: '20000',
      deductionType: 'standard',
    });
    const unmarried = parseMoney(getValue(r, 'unmarriedTotal'));
    const married = parseMoney(getValue(r, 'marriedTotal'));
    expect(married).toBeLessThan(unmarried);
    const hero = getValue(r, 'hero');
    expect(hero).toContain('Save');
  });

  it('two equal low-to-mid incomes are roughly neutral', () => {
    const r = config.calculate({
      income1: '60000',
      income2: '60000',
      deductionType: 'standard',
    });
    const unmarried = parseMoney(getValue(r, 'unmarriedTotal'));
    const married = parseMoney(getValue(r, 'marriedTotal'));
    // For two $60k earners, MFJ brackets are exactly 2× single so penalty ≈ 0
    const diff = Math.abs(married - unmarried);
    expect(diff).toBeLessThan(50);
    const hero = getValue(r, 'hero');
    // Should be "No difference" or very close to it
    expect(['No difference', 'Save', 'Pay']).toContain(hero.split('—')[0]?.trim() || hero);
  });

  it('returns empty for negative income', () => {
    const r = config.calculate({
      income1: '-100',
      income2: '50000',
      deductionType: 'standard',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for missing incomes', () => {
    const r = config.calculate({
      income1: '',
      income2: '',
      deductionType: 'standard',
    });
    expect(r).toEqual([]);
  });

  it('handles itemized deductions', () => {
    const r = config.calculate({
      income1: '150000',
      income2: '100000',
      deductionType: 'itemized',
      itemized1: '20000',
      itemized2: '15000',
      itemizedJoint: '32000',
    });
    expect(r.length).toBeGreaterThan(0);
    expect(parseMoney(getValue(r, 'unmarriedTotal'))).toBeGreaterThan(0);
  });

  it('returns error when itemized fields are missing', () => {
    const r = config.calculate({
      income1: '150000',
      income2: '100000',
      deductionType: 'itemized',
      itemized1: '',
      itemized2: '',
      itemizedJoint: '',
    });
    expect(r.find((x) => x.id === 'err')).toBeDefined();
  });

  it('shows effective tax rates', () => {
    const r = config.calculate({
      income1: '100000',
      income2: '80000',
      deductionType: 'standard',
    });
    const effSingle = getValue(r, 'effSingle');
    const effMarried = getValue(r, 'effMarried');
    expect(effSingle).toMatch(/%$/);
    expect(effMarried).toMatch(/%$/);
  });

  it('includes combined household income', () => {
    const r = config.calculate({
      income1: '75000',
      income2: '55000',
      deductionType: 'standard',
    });
    expect(getValue(r, 'jointIncome')).toContain('130');
  });
});

describe('marriage tax audit (2026, Rev. Proc. 2025-32)', () => {
  const run = (a: string, b: string, extra: Record<string, string> = {}) =>
    config.calculate({ income1: a, income2: b, deductionType: 'standard', ...extra });

  // Hand-derived: 2026 single brackets 10% to 12,400 / 12% to 50,400 / 22% to 105,700 / 24% to 201,775;
  // MFJ 24,800 / 100,800 / 211,400 / 403,550; std deduction 16,100 / 32,200.
  it('James $200k + Sophie $35k: singles $38,754, MFJ $34,040, bonus $4,714', () => {
    const r = run('200000', '35000');
    expect(parseMoney(getValue(r, 'unmarriedTotal'))).toBe(38754);
    expect(parseMoney(getValue(r, 'marriedTotal'))).toBe(34040);
    expect(getValue(r, 'hero')).toBe('Save $4,714');
  });
  it('$500k + $500k: penalty $3,982 (rounded)', () => {
    const r = run('500000', '500000');
    expect(getValue(r, 'hero')).toBe('Pay $3,982 more');
  });
  it('$450k + $450k: penalty $1,982 (as quoted in the FAQ)', () => {
    expect(getValue(run('450000', '450000'), 'hero')).toBe('Pay $1,982 more');
  });
  it('zero incomes give 0.00% effective rates, never NaN', () => {
    const r = run('0', '0');
    expect(getValue(r, 'effSingle')).toBe('0.00%');
    expect(getValue(r, 'effMarried')).toBe('0.00%');
  });
  it('itemized amounts below the standard deduction fall back to the standard deduction', () => {
    const std = run('85000', '65000');
    const low = config.calculate({ income1: '85000', income2: '65000', deductionType: 'itemized', itemized1: '5000', itemized2: '5000', itemizedJoint: '8000' });
    expect(getValue(low, 'unmarriedTotal')).toBe(getValue(std, 'unmarriedTotal'));
    expect(getValue(low, 'marriedTotal')).toBe(getValue(std, 'marriedTotal'));
  });
  it('itemized above standard is used (joint 40,000 on $150k)', () => {
    // MFJ taxable 110,000: 24,800*10% + 76,000*12% + 9,200*22% = 2,480 + 9,120 + 2,024 = 13,624
    const r = config.calculate({ income1: '85000', income2: '65000', deductionType: 'itemized', itemized1: '5000', itemized2: '5000', itemizedJoint: '40000' });
    expect(parseMoney(getValue(r, 'marriedTotal'))).toBe(13624);
  });
});
