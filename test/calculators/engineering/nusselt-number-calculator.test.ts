import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/engineering/nusselt-number';

describe('Nusselt Number', () => {
  it('calculates Nu = hL/k correctly for water', () => {
    const r = config.calculate({ heatTransferCoeff: '5000', characteristicLength: '0.025', thermalConductivity: '0.6' });
    expect(r.find(x => x.id === 'nusselt')?.value).toBe('208.3');
  });

  it('Nu > 1 for typical forced convection', () => {
    const r = config.calculate({ heatTransferCoeff: '50', characteristicLength: '0.1', thermalConductivity: '0.026' });
    const nu = parseFloat(r.find(x => x.id === 'nusselt')?.value || '0');
    expect(nu).toBeGreaterThan(1);
  });

  it('Nu = 1 when hL = k (pure conduction)', () => {
    const r = config.calculate({ heatTransferCoeff: '0.6', characteristicLength: '0.025', thermalConductivity: '0.015' });
    expect(r.find(x => x.id === 'nusselt')?.value).toBe('1');
  });

  it('returns empty for missing inputs', () => {
    expect(config.calculate({ heatTransferCoeff: '', characteristicLength: '0.1', thermalConductivity: '0.6' })).toEqual([]);
    expect(config.calculate({ heatTransferCoeff: '50', characteristicLength: '', thermalConductivity: '0.6' })).toEqual([]);
    expect(config.calculate({ heatTransferCoeff: '50', characteristicLength: '0.1', thermalConductivity: '' })).toEqual([]);
  });

  it('returns empty for zero or negative values', () => {
    expect(config.calculate({ heatTransferCoeff: '0', characteristicLength: '0.1', thermalConductivity: '0.6' })).toEqual([]);
    expect(config.calculate({ heatTransferCoeff: '50', characteristicLength: '-1', thermalConductivity: '0.6' })).toEqual([]);
  });

  it('includes interpretation result', () => {
    const r = config.calculate({ heatTransferCoeff: '500', characteristicLength: '0.5', thermalConductivity: '0.6' });
    expect(r.find(x => x.id === 'interpretation')).toBeDefined();
  });

  it('has educational content', () => {
    expect(config.educational.formula).toBeTruthy();
    expect(config.educational.faqs!.length).toBeGreaterThanOrEqual(5);
    expect(config.educational.workedExamples!.length).toBeGreaterThanOrEqual(2);
  });
});
