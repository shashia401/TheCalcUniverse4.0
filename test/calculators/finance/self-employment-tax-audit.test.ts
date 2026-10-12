import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/self-employment-tax/index';
import { computeSeTax, parseSeInput } from '../../../src/calculators/finance/self-employment-tax/seTaxMath';
import { getValue, parseMoney, near } from '../../helpers';

const base = { netProfit: '100000', w2Income: '0', qbiDeduction: 'no', filingStatus: 'single' };

describe('self-employment tax audit (IRS Schedule SE, 2026: SS wage base 184,500)', () => {
  it('worked example Elena: 100,000 -> 14,129.55 SECA, deductible half 7,064.78, QBI savings 4,089.15', () => {
    const r = config.calculate({ ...base, qbiDeduction: 'yes' });
    // 92,350 x 12.4% = 11,451.40 ; 92,350 x 2.9% = 2,678.15
    expect(getValue(r, 'secaTax')).toBe('$14,129.55');
    expect(getValue(r, 'socialSecurityPortion')).toBe('$11,451.40');
    expect(getValue(r, 'medicarePortion')).toBe('$2,678.15');
    expect(getValue(r, 'deductiblePortion')).toBe('$7,064.78');
    expect(getValue(r, 'qbiSavings')).toBe('$4,089.15');
    expect(getValue(r, 'additionalMedicare')).toContain('$0.00');
  });

  it('worked example Raj: 180,000 + 45,000 W-2 -> SECA 22,118.67 and Additional Medicare 101.07 (single)', () => {
    // SE earnings 166,230; threshold left for SE = 200,000 - 45,000 = 155,000 -> 11,230 x 0.9% = 101.07
    const r = config.calculate({ ...base, netProfit: '180000', w2Income: '45000', qbiDeduction: 'yes' });
    expect(getValue(r, 'secaTax')).toBe('$22,118.67');
    expect(getValue(r, 'additionalMedicare')).toBe('$101.07');
    // QBI = 180,000 - 11,059.335 = 168,940.665 -> x 0.2 x 0.22 = 7,433.39
    expect(getValue(r, 'qbiSavings')).toBe('$7,433.39');
  });

  it('Additional Medicare (new): single 300,000 net profit and MFJ differ by threshold', () => {
    // SE earnings = 277,050. single: (277,050 - 200,000) x 0.9% = 693.45 ; MFJ: (277,050 - 250,000) x 0.9% = 243.45
    near(computeSeTax(parseSeInput({ ...base, netProfit: '300000' })).additionalMedicare, 693.45, 0.01);
    near(computeSeTax(parseSeInput({ ...base, netProfit: '300000', filingStatus: 'mfj' })).additionalMedicare, 243.45, 0.01);
    near(computeSeTax(parseSeInput({ ...base, netProfit: '300000', filingStatus: 'mfs' })).additionalMedicare, (277050 - 125000) * 0.009, 0.01);
  });

  it('SS stops at the 2026 wage base: 250,000 profit -> SS = 184,500 x 12.4% = 22,878 ; Medicare 230,875 x 2.9%', () => {
    const c = computeSeTax(parseSeInput({ ...base, netProfit: '250000' }));
    near(c.socialSecurityPortion, 22878, 0.01);
    near(c.medicarePortion, 250000 * 0.9235 * 0.029, 0.01);
  });

  it('W-2 wages above the base remove the Social Security part entirely', () => {
    const c = computeSeTax(parseSeInput({ ...base, netProfit: '50000', w2Income: '200000' }));
    expect(c.socialSecurityPortion).toBe(0);
    near(c.medicarePortion, 50000 * 0.9235 * 0.029, 0.01);
  });

  it('no SE tax below 400 of net earnings (regression)', () => {
    // 430 x 0.9235 = 397.1 < 400 -> nothing owed ; 440 x 0.9235 = 406.3 -> owed
    const low = config.calculate({ ...base, netProfit: '430' });
    expect(getValue(low, 'secaTax')).toBe('$0.00');
    expect(low[0].warning).toMatch(/\$400/);
    near(parseMoney(getValue(config.calculate({ ...base, netProfit: '440' }), 'secaTax')), 440 * 0.9235 * 0.153, 0.01);
  });
});
