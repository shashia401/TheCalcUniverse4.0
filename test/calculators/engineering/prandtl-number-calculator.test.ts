import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/engineering/prandtl-number';

describe('Prandtl Number', () => {
  it('calculates Pr for water at 20°C', () => {
    const r = config.calculate({ dynamicViscosity: '0.001', specificHeat: '4184', thermalConductivity: '0.6' });
    const pr = parseFloat(r.find(x => x.id === 'prandtl')?.value || '0');
    expect(pr).toBeCloseTo(6.97, 1);
  });

  it('Pr ≈ 0.7 for air', () => {
    const r = config.calculate({ dynamicViscosity: '0.000018', specificHeat: '1005', thermalConductivity: '0.026' });
    const pr = parseFloat(r.find(x => x.id === 'prandtl')?.value || '0');
    expect(pr).toBeCloseTo(0.7, 0.2);
  });

  it('categorizes liquid metals correctly (Pr < 0.01)', () => {
    const r = config.calculate({ dynamicViscosity: '0.0003', specificHeat: '1300', thermalConductivity: '70' });
    expect(r.find(x => x.id === 'category')?.value).toContain('Liquid metal');
  });

  it('returns empty for missing inputs', () => {
    expect(config.calculate({ dynamicViscosity: '', specificHeat: '4184', thermalConductivity: '0.6' })).toEqual([]);
  });

  it('returns empty for negative values', () => {
    expect(config.calculate({ dynamicViscosity: '-1', specificHeat: '4184', thermalConductivity: '0.6' })).toEqual([]);
  });

  it('has educational content including FAQs and worked examples', () => {
    expect(config.educational.formula).toBeTruthy();
    expect(config.educational.faqs!.length).toBeGreaterThanOrEqual(4);
    expect(config.educational.workedExamples!.length).toBeGreaterThanOrEqual(2);
  });
});
