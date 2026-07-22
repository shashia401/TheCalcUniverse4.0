import { describe, it, expect } from 'vitest';
import tireSizeConfig from '../../../src/calculators/automotive/tire-size/index';

describe('Tire Size Calculator', () => {
  const find = (r: ReturnType<typeof tireSizeConfig.calculate>, id: string) => r.find(x => x.id === id)?.value ?? '';

  it('compares two tire sizes', () => {
    const r = tireSizeConfig.calculate({ origWidth: '225', origAspect: '50', origRim: '17', newWidth: '235', newAspect: '45', newRim: '18' });
    expect(find(r, 'diamDiff')).toBeTruthy();
    expect(find(r, 'speedError')).toBeTruthy();
  });

  it('shows minimal difference for same tire size', () => {
    const r = tireSizeConfig.calculate({ origWidth: '225', origAspect: '50', origRim: '17', newWidth: '225', newAspect: '50', newRim: '17' });
    expect(find(r, 'diamDiff')).toContain('0');
  });

  it('returns empty for missing values', () => {
    expect(tireSizeConfig.calculate({ origWidth: '', newWidth: '' })).toEqual([]);
  });
});
