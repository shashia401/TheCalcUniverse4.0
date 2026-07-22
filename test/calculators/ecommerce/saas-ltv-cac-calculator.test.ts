import { describe, it, expect } from 'vitest';
import saasLtvCacConfig from '../../../src/calculators/ecommerce/saas-ltv-cac/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('SaaS LTV:CAC Calculator', () => {
  it('calculates LTV and CAC correctly', () => {
    const results = saasLtvCacConfig.calculate({
      arpu: '50',
      monthlyChurnRate: '5',
      totalMarketingSpend: '50000',
      newCustomersAcquired: '200',
      grossMargin: '80',
    });
    expect(results.length).toBeGreaterThan(0);

    // 5% churn = 20 months avg lifetime
    // LTV = 50 * 20 * 0.80 = 800
    const ltv = parseNumber(getValue(results, 'ltv'));
    near(ltv, 800);

    // CAC = 50000 / 200 = 250
    const cac = parseNumber(getValue(results, 'cac'));
    near(cac, 250);

    // Ratio = 800 / 250 = 3.2
    const ratio = parseNumber(getValue(results, 'ltvCacRatio'));
    near(ratio, 3.2, 0.1);
  });

  it('calculates payback period correctly', () => {
    const results = saasLtvCacConfig.calculate({
      arpu: '100',
      monthlyChurnRate: '3',
      totalMarketingSpend: '30000',
      newCustomersAcquired: '150',
      grossMargin: '75',
    });
    const payback = parseNumber(getValue(results, 'paybackMonths'));
    // CAC = 30000/150 = 200. Monthly gross profit = 100 * 0.75 = 75
    // Payback = 200 / 75 = 2.666... months
    near(payback, 2.67, 0.1);
  });

  it('returns empty for invalid inputs', () => {
    const results = saasLtvCacConfig.calculate({
      arpu: '',
      monthlyChurnRate: '',
      totalMarketingSpend: '',
      newCustomersAcquired: '',
      grossMargin: '80',
    });
    expect(results).toEqual([]);
  });

  it('caps customer lifetime at 120 months for zero churn', () => {
    const results = saasLtvCacConfig.calculate({
      arpu: '50',
      monthlyChurnRate: '0',
      totalMarketingSpend: '10000',
      newCustomersAcquired: '100',
      grossMargin: '80',
    });
    const lifetime = parseNumber(getValue(results, 'avgLifetimeMonths'));
    near(lifetime, 120, 0.5);
  });

  it('defaults gross margin to 80% when not provided', () => {
    const results = saasLtvCacConfig.calculate({
      arpu: '50',
      monthlyChurnRate: '5',
      totalMarketingSpend: '50000',
      newCustomersAcquired: '200',
      grossMargin: '',
    });
    const ltv = parseNumber(getValue(results, 'ltv'));
    near(ltv, 800); // 50 * 20 * 0.80
  });

  it('has all required result IDs', () => {
    const results = saasLtvCacConfig.calculate({
      arpu: '50',
      monthlyChurnRate: '5',
      totalMarketingSpend: '50000',
      newCustomersAcquired: '200',
      grossMargin: '80',
    });
    const ids = results.map((r) => r.id);
    expect(ids).toContain('ltv');
    expect(ids).toContain('cac');
    expect(ids).toContain('ltvCacRatio');
    expect(ids).toContain('paybackMonths');
    expect(ids).toContain('avgLifetimeMonths');
    expect(ids).toContain('arpu');
    expect(ids).toContain('churnRate');
    expect(ids).toContain('magicNumber');
    expect(ids).toContain('grossMargin');
    expect(ids).toContain('totalRevenue');
  });

  it('shows poor ratio when ltv:cac is below 1', () => {
    const results = saasLtvCacConfig.calculate({
      arpu: '10',
      monthlyChurnRate: '20',
      totalMarketingSpend: '50000',
      newCustomersAcquired: '100',
      grossMargin: '80',
    });
    const ratio = parseNumber(getValue(results, 'ltvCacRatio'));
    expect(ratio).toBeLessThan(1);
  });
});
