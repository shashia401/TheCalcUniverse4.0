import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/realestate/mortgage-amortization/index';
import { buildDemoValues } from '../../helpers';

describe('mortgage-amortization-calculator', () => {
  it('shows the correct payoff date (Nth payment is N-1 months after the first)', () => {
    // A 1-payment loan starting March 2024 has its only payment IN March
    // 2024 -- the old code added a full extra month, showing "Apr 2024".
    const r = config.calculate({
      homePrice: '100000',
      downPayment: '0',
      interestRate: '5',
      loanTerm: (1 / 12).toString(),
      startMonth: '3',
      startYear: '2024',
    });
    const payoff = r.find((x) => x.id === 'payoffDate');
    expect(payoff?.value).toBe('Mar 2024');
  });

  it('should export valid config', () => {
    expect(config).toBeDefined();
    expect(config.inputs).toBeDefined();
    expect(typeof config.calculate).toBe('function');
  });
  it('returns array for empty inputs', () => {
    const v = {};
    config.inputs.forEach((i) => { v[i.id] = ''; });
    expect(Array.isArray(config.calculate(v))).toBe(true);
  });
  it('works with demo values', () => {
    const v = buildDemoValues(config.inputs);
    const r = config.calculate(v);
    expect(Array.isArray(r)).toBe(true);
    expect(r.length).toBeGreaterThan(0);
  });
});
