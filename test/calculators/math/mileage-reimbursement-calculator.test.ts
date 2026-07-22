import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/mileage-reimbursement/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('mileage-reimbursement', () => {
  it('calculates business mileage at 2026 rate ($0.655/mi)', () => {
    const r = config.calculate({ miles: '1000', mileageType: 'business', year: '2026', additionalExpenses: '' });
    near(parseNumber(getValue(r, 'reimbursement')), 655);
    near(parseNumber(getValue(r, 'mileageAmount')), 655);
    expect(getValue(r, 'rateUsed')).toContain('0.66');
  });

  it('calculates 2025 business rate ($0.70/mi)', () => {
    const r = config.calculate({ miles: '1000', mileageType: 'business', year: '2025', additionalExpenses: '' });
    near(parseNumber(getValue(r, 'reimbursement')), 700);
    expect(getValue(r, 'rateUsed')).toContain('0.70');
  });

  it('calculates medical mileage ($0.21/mi)', () => {
    const r = config.calculate({ miles: '500', mileageType: 'medical', year: '2026', additionalExpenses: '' });
    near(parseNumber(getValue(r, 'reimbursement')), 105);
    near(parseNumber(getValue(r, 'mileageAmount')), 105);
  });

  it('calculates charitable mileage ($0.14/mi)', () => {
    const r = config.calculate({ miles: '100', mileageType: 'charitable', year: '2026', additionalExpenses: '' });
    near(parseNumber(getValue(r, 'reimbursement')), 14);
    near(parseNumber(getValue(r, 'mileageAmount')), 14);
  });

  it('includes additional expenses', () => {
    const r = config.calculate({ miles: '1000', mileageType: 'business', year: '2026', additionalExpenses: '50.00' });
    near(parseNumber(getValue(r, 'reimbursement')), 705);
    near(parseNumber(getValue(r, 'additionalAmount')), 50);
  });

  it('hides additionalAmount when expenses are 0', () => {
    const r = config.calculate({ miles: '100', mileageType: 'business', year: '2026', additionalExpenses: '' });
    expect(r.find((x) => x.id === 'additionalAmount')).toBeUndefined();
  });

  it('shows IRS reference note', () => {
    const r = config.calculate({ miles: '100', mileageType: 'business', year: '2026', additionalExpenses: '' });
    expect(getValue(r, 'irsNote')).toContain('IRS');
  });

  it('shows tax savings for business use', () => {
    const r = config.calculate({ miles: '1000', mileageType: 'business', year: '2026', additionalExpenses: '' });
    expect(getValue(r, 'taxSavings')).toContain('$');
    expect(getValue(r, 'taxSavings')).toContain('marginal rate');
  });

  it('does not show tax savings for medical', () => {
    const r = config.calculate({ miles: '500', mileageType: 'medical', year: '2026', additionalExpenses: '' });
    expect(r.find((x) => x.id === 'taxSavings')).toBeUndefined();
  });

  it('returns empty for negative miles', () => {
    const r = config.calculate({ miles: '-10', mileageType: 'business', year: '2026', additionalExpenses: '' });
    expect(r).toEqual([]);
  });

  it('returns empty for missing miles', () => {
    const r = config.calculate({ miles: '', mileageType: 'business', year: '2026', additionalExpenses: '' });
    expect(r).toEqual([]);
  });

  it('returns highlighted reimbursement result', () => {
    const r = config.calculate({ miles: '100', mileageType: 'business', year: '2026', additionalExpenses: '' });
    const reimbursement = r.find((x) => x.id === 'reimbursement');
    expect(reimbursement?.highlight).toBe(true);
    expect(reimbursement?.color).toBe('positive');
  });

  it('extraPanel returns element when results exist', () => {
    const r = config.calculate({ miles: '100', mileageType: 'business', year: '2026', additionalExpenses: '' });
    const panel = config.extraPanel({ miles: '100', mileageType: 'business', year: '2026', additionalExpenses: '' }, r);
    expect(panel).not.toBeNull();
  });

  it('extraPanel returns null when results empty', () => {
    const r = config.calculate({ miles: '', mileageType: 'business', year: '2026', additionalExpenses: '' });
    const panel = config.extraPanel({ miles: '', mileageType: 'business', year: '2026', additionalExpenses: '' }, r);
    expect(panel).toBeNull();
  });
});
