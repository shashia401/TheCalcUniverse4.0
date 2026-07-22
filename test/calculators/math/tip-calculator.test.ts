import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/tip-calculator/index';
import { getValue, parseNumber, parseMoney, near } from '../../helpers';

describe('tip-calculator', () => {
  it('standard 15% tip on $100', () => {
    const r = config.calculate({
      billAmount: '100',
      tipPercent: '15',
      splitPeople: '1',
      roundingMode: 'none',
    });
    expect(getValue(r, 'totalAmount')).toBe('$115');
    expect(getValue(r, 'tipAmount')).toBe('$15');
    expect(getValue(r, 'splitInfo')).toBe('No split');
  });

  it('18% tip on $85.50', () => {
    const r = config.calculate({
      billAmount: '85.50',
      tipPercent: '18',
      splitPeople: '1',
      roundingMode: 'none',
    });
    near(parseMoney(getValue(r, 'totalAmount')), 100.89);
    near(parseMoney(getValue(r, 'tipAmount')), 15.39);
  });

  it('20% tip on $50', () => {
    const r = config.calculate({
      billAmount: '50',
      tipPercent: '20',
      splitPeople: '1',
      roundingMode: 'none',
    });
    expect(getValue(r, 'totalAmount')).toBe('$60');
    expect(getValue(r, 'tipAmount')).toBe('$10');
  });

  it('custom tip % of 22% on $100', () => {
    const r = config.calculate({
      billAmount: '100',
      tipPercent: 'custom',
      customTipPercent: '22',
      splitPeople: '1',
      roundingMode: 'none',
    });
    expect(getValue(r, 'totalAmount')).toBe('$122');
    expect(getValue(r, 'tipAmount')).toBe('$22');
  });

  it('split 2 ways on $100 at 15%', () => {
    const r = config.calculate({
      billAmount: '100',
      tipPercent: '15',
      splitPeople: '2',
      roundingMode: 'none',
    });
    expect(getValue(r, 'totalAmount')).toBe('$115');
    expect(getValue(r, 'totalPerPerson')).toBe('$57.50');
    expect(getValue(r, 'tipPerPerson')).toBe('$7.50');
    expect(getValue(r, 'splitInfo')).toBe('Split 2 ways');
  });

  it('split 4 ways on $80 at 20%', () => {
    const r = config.calculate({
      billAmount: '80',
      tipPercent: '20',
      splitPeople: '4',
      roundingMode: 'none',
    });
    expect(getValue(r, 'totalAmount')).toBe('$96');
    expect(getValue(r, 'totalPerPerson')).toBe('$24');
    expect(getValue(r, 'tipPerPerson')).toBe('$4');
  });

  it('round total up to nearest dollar', () => {
    const r = config.calculate({
      billAmount: '85.50',
      tipPercent: '15',
      splitPeople: '1',
      roundingMode: 'total',
    });
    // 85.50 + 12.825 = 98.325 → rounded up to 99
    expect(getValue(r, 'totalAmount')).toBe('$99');
    expect(getValue(r, 'roundingApplied')).toContain('Total rounded up');
  });

  it('round tip up to nearest dollar', () => {
    const r = config.calculate({
      billAmount: '85.50',
      tipPercent: '15',
      splitPeople: '1',
      roundingMode: 'tip',
    });
    // 15% of 85.50 = 12.825 → rounded to 13
    // total = 85.50 + 13 = 98.50
    near(parseMoney(getValue(r, 'tipAmount')), 13);
    near(parseMoney(getValue(r, 'totalAmount')), 98.50);
    expect(getValue(r, 'roundingApplied')).toContain('Tip rounded up');
  });

  it('round both tip and total', () => {
    const r = config.calculate({
      billAmount: '85.50',
      tipPercent: '15',
      splitPeople: '1',
      roundingMode: 'both',
    });
    // Tip 12.825 → 13; total = 85.50 + 13 = 98.50 → rounded to 99
    // Since total was rounded, tip is recalculated: 99 - 85.50 = 13.50
    near(parseMoney(getValue(r, 'tipAmount')), 13.50);
    expect(getValue(r, 'totalAmount')).toBe('$99');
    expect(getValue(r, 'roundingApplied')).toBeTruthy();
  });

  it('effective tip % displayed when rounding changes it', () => {
    const r = config.calculate({
      billAmount: '85.50',
      tipPercent: '15',
      splitPeople: '1',
      roundingMode: 'tip',
    });
    // Tip rounded from 12.825 to 13 → effective = 13/85.50 * 100 ≈ 15.2%
    const eff = getValue(r, 'effectiveTipPercent');
    expect(eff).toBeTruthy();
    expect(eff).toContain('%');
  });

  it('split=1 hides per-person fields', () => {
    const r = config.calculate({
      billAmount: '100',
      tipPercent: '15',
      splitPeople: '1',
      roundingMode: 'none',
    });
    expect(r.find((x) => x.id === 'totalPerPerson')).toBeUndefined();
    expect(r.find((x) => x.id === 'tipPerPerson')).toBeUndefined();
  });

  it('zero bill returns empty array', () => {
    const r = config.calculate({
      billAmount: '0',
      tipPercent: '15',
      splitPeople: '1',
      roundingMode: 'none',
    });
    expect(r).toEqual([]);
  });

  it('missing bill amount returns empty array', () => {
    const r = config.calculate({
      billAmount: '',
      tipPercent: '15',
      splitPeople: '1',
      roundingMode: 'none',
    });
    expect(r).toEqual([]);
  });

  it('many people split (10 ways) on $200 at 18%', () => {
    const r = config.calculate({
      billAmount: '200',
      tipPercent: '18',
      splitPeople: '10',
      roundingMode: 'none',
    });
    expect(getValue(r, 'totalAmount')).toBe('$236');
    expect(getValue(r, 'totalPerPerson')).toBe('$23.60');
    expect(getValue(r, 'tipPerPerson')).toBe('$3.60');
  });

  it('extraPanel returns element when results exist', () => {
    const r = config.calculate({
      billAmount: '50',
      tipPercent: '15',
      splitPeople: '1',
      roundingMode: 'none',
    });
    const panel = config.extraPanel(
      { billAmount: '50', tipPercent: '15', splitPeople: '1', roundingMode: 'none' },
      r,
    );
    expect(panel).not.toBeNull();
  });

  it('extraPanel returns null when results empty', () => {
    const r = config.calculate({
      billAmount: '',
      tipPercent: '15',
      splitPeople: '1',
      roundingMode: 'none',
    });
    const panel = config.extraPanel(
      { billAmount: '', tipPercent: '15', splitPeople: '1', roundingMode: 'none' },
      r,
    );
    expect(panel).toBeNull();
  });
});
