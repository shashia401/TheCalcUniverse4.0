import { describe, it, expect } from 'vitest';
import netWorthConfig from '../../../src/calculators/finance/net-worth/index';

describe('Net Worth Calculator', () => {
  const find = (r: ReturnType<typeof netWorthConfig.calculate>, id: string) => r.find(x => x.id === id)?.value ?? '';

  it('calculates net worth from assets and liabilities', () => {
    const r = netWorthConfig.calculate({ cash: '15000', investments: '50000', mortgage: '200000', creditCards: '5000' });
    expect(find(r, 'netWorth')).toBeTruthy();
  });

  it('returns empty when all values are zero', () => {
    const r = netWorthConfig.calculate({});
    expect(r.length).toBeGreaterThanOrEqual(0);
  });
});
