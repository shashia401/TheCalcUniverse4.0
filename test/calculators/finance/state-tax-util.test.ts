import { describe, it, expect } from 'vitest';
import { stateIncomeTax, hasNoWageTax, STATE_INCOME_TAX } from '../../../src/utils/stateTax';

// Expected values derived by hand from the Tax Foundation 2026 schedules (see src/utils/stateTax.ts header).
describe('stateIncomeTax (2026)', () => {
  it('California single $52,000: (52,000 - 5,540) = 46,460 -> 110.79 + 303.70 + 607.52 + 300.48', () => {
    expect(stateIncomeTax('CA', 52000, 'single')).toBeCloseTo(1322.49, 2);
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
  it('joint schedule: Georgia 5.19% on (100,000 - 24,000)', () => {
    expect(stateIncomeTax('GA', 100000, 'mfj')).toBeCloseTo(3944.4, 2);
  });
  it('Ohio taxes only income above $26,050 at 2.75%', () => {
    expect(stateIncomeTax('OH', 76050)).toBeCloseTo(1375, 2);
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
