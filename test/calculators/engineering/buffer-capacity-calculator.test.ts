import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/engineering/buffer-capacity';

describe('Buffer Capacity', () => {
  it('max capacity when pH = pKa', () => {
    const r = config.calculate({ pKa: '4.76', pH: '4.76', concentration: '0.1' });
    const beta = parseFloat(r.find(x => x.id === 'bufferCapacity')?.value || '0');
    expect(beta).toBeCloseTo(0.0576, 3);
  });

  it('capacity drops when pH differs from pKa', () => {
    const r = config.calculate({ pKa: '4.76', pH: '5.76', concentration: '0.1' });
    const beta = parseFloat(r.find(x => x.id === 'bufferCapacity')?.value || '0');
    expect(beta).toBeLessThan(0.03);
  });

  it('poor effectiveness when pH far from pKa', () => {
    const r = config.calculate({ pKa: '4.76', pH: '7', concentration: '0.1' });
    expect(r.find(x => x.id === 'effectiveness')?.value).toContain('Poor');
  });

  it('returns empty for missing inputs', () => {
    expect(config.calculate({ pKa: '', pH: '4.76', concentration: '0.1' })).toEqual([]);
  });

  it('has acid/base distribution in results', () => {
    const r = config.calculate({ pKa: '4.76', pH: '4.76', concentration: '0.1' });
    expect(r.find(x => x.id === 'acidBaseRatio')).toBeDefined();
  });

  it('has educational content with FAQs and worked examples', () => {
    expect(config.educational.faqs!.length).toBeGreaterThanOrEqual(4);
    expect(config.educational.workedExamples!.length).toBeGreaterThanOrEqual(2);
  });
});
