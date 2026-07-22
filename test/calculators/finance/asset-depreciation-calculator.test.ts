import { describe, it, expect } from 'vitest';
import depreciationConfig from '../../../src/calculators/finance/asset-depreciation/index';

describe('Asset Depreciation Calculator', () => {
  const find = (r: ReturnType<typeof depreciationConfig.calculate>, id: string) => r.find(x => x.id === id)?.value ?? '';

  it('calculates straight-line depreciation schedule', () => {
    const r = depreciationConfig.calculate({ assetCost: '50000', salvageValue: '5000', usefulLife: '5', method: 'SL' });
    expect(r.length).toBeGreaterThan(0);
  });

  it('calculates DDB depreciation schedule', () => {
    const r = depreciationConfig.calculate({ assetCost: '50000', salvageValue: '0', usefulLife: '5', method: 'DDB' });
    expect(r.length).toBeGreaterThan(0);
  });

  it('returns empty for zero cost', () => {
    expect(depreciationConfig.calculate({ assetCost: '0', usefulLife: '5' })).toEqual([]);
  });
});
