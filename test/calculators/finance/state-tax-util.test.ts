import { describe, it, expect } from 'vitest';
import { stateIncomeTax, hasNoWageTax, STATE_INCOME_TAX } from '../../../src/utils/stateTax';

// Expected values are independent Python Decimal results from each state's official schedule (the FTB's printed base + rate form for
// California, the Georgia DOR 2026 guide, Ohio Revised Code 5747.02); see the sources in src/utils/stateTax.ts.
describe('stateIncomeTax (2026)', () => {
  it('California single $52,000: (52,000 - 5,900) = 46,100 -> FTB 2026 Schedule X: 1,056.74 + 6% x (46,100 - 42,861) + ... = 1,251.08', () => {
    expect(stateIncomeTax('CA', 52000, 'single')).toBeCloseTo(1251.08, 2);
  });
  it('New York single $100,000: taxable 92,000', () => {
    // 8,500*3.9% = 331.50; (11,700-8,500)*4.4% = 140.80; (13,900-11,700)*5.15% = 113.30;
    // (80,650-13,900)*5.4% = 3,604.50; (92,000-80,650)*5.9% = 669.65  -> 4,859.75
    expect(stateIncomeTax('NY', 100000, 'single')).toBeCloseTo(4859.75, 2);
  });
  it('flat states: Illinois 4.95% with no deduction; Pennsylvania 3.07%', () => {
    expect(stateIncomeTax('IL', 80000)).toBeCloseTo(3960, 2);
    expect(stateIncomeTax('PA', 100000)).toBeCloseTo(3070, 2);
  });
  it('joint schedule: Georgia 4.99% on (100,000 - 30,000) = 3,493.00', () => {
    expect(stateIncomeTax('GA', 100000, 'mfj')).toBeCloseTo(3493, 2);
  });
  it('Ohio: nothing up to $26,050, then $332 plus 2.75% of the excess (ORC 5747.02(A)(3)(c))', () => {
    expect(stateIncomeTax('OH', 26050)).toBe(0);
    expect(stateIncomeTax('OH', 76050)).toBeCloseTo(1707, 2); // 332 + 0.0275 x 50,000
  });
  it('Massachusetts 4% surtax starts above the 2026 threshold of $1,107,750', () => {
    expect(stateIncomeTax('MA', 1107750)).toBeCloseTo(55387.5, 2);
    expect(stateIncomeTax('MA', 1200000)).toBeCloseTo(63690, 2); // 5% x 1,200,000 + 4% x 92,250
  });
  it('Arizona: 2.5% flat after the standard deduction (15,750 single, 31,500 joint)', () => {
    expect(stateIncomeTax('AZ', 80000, 'single')).toBeCloseTo(1606.25, 2);
    expect(stateIncomeTax('AZ', 80000, 'mfj')).toBeCloseTo(1212.5, 2);
  });
  it('no-wage-tax states and bad input return 0', () => {
    for (const c of ['TX', 'FL', 'WA', 'NH', 'TN', 'SD', 'NV', 'WY', 'AK']) {
      expect(hasNoWageTax(c)).toBe(true);
      expect(stateIncomeTax(c, 500000)).toBe(0);
    }
    expect(stateIncomeTax('CA', -5)).toBe(0);
    expect(stateIncomeTax('ZZ', 50000)).toBe(0);
  });
  it('every state has monotonically increasing bracket thresholds', () => {
    for (const [code, rule] of Object.entries(STATE_INCOME_TAX)) {
      for (const b of [rule.single, rule.mfj ?? []]) {
        for (let i = 1; i < b.length; i++) expect(b[i][0], code).toBeGreaterThan(b[i - 1][0]);
      }
    }
  });
});
