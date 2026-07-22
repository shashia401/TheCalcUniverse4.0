import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/asset-depreciation';
import { getValue, parseMoney, parseNumber, near } from '../../helpers';

describe('asset-depreciation', () => {
  const base = { assetCost: '50000', salvageValue: '5000', usefulLife: '5' };

  it('straight-line: annual depreciation = (cost - salvage) / life', () => {
    const r = config.calculate({ ...base, depreciationMethod: 'sl' });
    expect(r.length).toBeGreaterThanOrEqual(5);
    near(parseMoney(getValue(r, 'firstYearDepreciation')), 9000);
    near(parseMoney(getValue(r, 'totalDepreciation')), 45000);
    expect(getValue(r, 'depreciationMethodUsed')).toContain('Straight-Line');
  });

  it('double declining balance: year 1 > straight-line amount', () => {
    const r = config.calculate({ ...base, depreciationMethod: 'ddb' });
    const yr1 = parseMoney(getValue(r, 'firstYearDepreciation'));
    expect(yr1).toBeGreaterThan(9000);
    expect(getValue(r, 'depreciationMethodUsed')).toContain('Double Declining');
  });

  it('sum-of-years-digits: year 1 is between SL and DDB', () => {
    const r = config.calculate({ ...base, depreciationMethod: 'syd' });
    const yr1 = parseMoney(getValue(r, 'firstYearDepreciation'));
    expect(yr1).toBeGreaterThan(9000);
    expect(getValue(r, 'depreciationMethodUsed')).toContain("Sum-of-the-Years'-Digits");
  });

  it('SL with no salvage value depreciates full cost', () => {
    const r = config.calculate({ ...base, salvageValue: '0', depreciationMethod: 'sl' });
    near(parseMoney(getValue(r, 'firstYearDepreciation')), 10000);
    near(parseMoney(getValue(r, 'totalDepreciation')), 50000);
  });

  it('returns empty when assetCost <= 0', () => {
    expect(config.calculate({ assetCost: '0', usefulLife: '5', depreciationMethod: 'sl' })).toHaveLength(0);
    expect(config.calculate({})).toHaveLength(0);
  });

  it('returns empty when salvage >= cost', () => {
    const r = config.calculate({ ...base, salvageValue: '60000', depreciationMethod: 'sl' });
    expect(r).toHaveLength(0);
  });

  it('DDB includes rate information', () => {
    const r = config.calculate({ ...base, depreciationMethod: 'ddb' });
    expect(getValue(r, 'ddbRate')).toMatch(/\d+%/);
  });
});
