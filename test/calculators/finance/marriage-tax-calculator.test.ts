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
