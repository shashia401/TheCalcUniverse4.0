import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/industrial/cbm-calculator/index';
import { computeCbm, formatCbm } from '../../../src/calculators/industrial/cbm-calculator/cbm';

const base = { length: '55', width: '50', height: '90', unit: 'cm', packages: '200', actualWeight: '1600', shippingMode: 'air' };

describe('CBM pure maths (computeCbm)', () => {
  it('worked example 1: 200 chairs, 0.55 x 0.50 x 0.90 m', () => {
    const c = computeCbm(base)!;
    expect(c.perPackageCbm).toBeCloseTo(0.2475, 12); // 0.55*0.5*0.9
    expect(c.cbm).toBeCloseTo(49.5, 9);
    expect(c.dimWeight).toBeCloseTo(8250, 6); // 49.5 m3 * 1e6 cm3 / 6000
    expect(c.chargeableWeight).toBeCloseTo(8250, 6);
    expect(c.containers20).toBe(2); // ceil(49.5/33)
    expect(c.containers40).toBe(1);
  });
  it('worked example 2: 12x8x4 in x150, exact inch (0.0254 m), courier 5000', () => {
    const c = computeCbm({ length: '12', width: '8', height: '4', unit: 'in', packages: '150', actualWeight: '217.7', shippingMode: 'courier' })!;
    // 12*8*4 = 384 in3 = 384 * 16.387064 cm3 = 6292.8 cm3
    expect(c.perPackageCbm).toBeCloseTo(384 * 16.387064e-6, 12);
    expect(c.cbm).toBeCloseTo(0.9439, 4);
    expect(c.dimWeight).toBeCloseTo((384 * 16.387064 * 150) / 5000, 6); // 188.78 kg
    expect(c.chargeableWeight).toBe(217.7); // dense: billed by actual weight
  });
  it('worked example 3: 45 pallets by sea, 1 m3 = 1000 kg', () => {
    const c = computeCbm({ length: '120', width: '100', height: '80', unit: 'cm', packages: '45', actualWeight: '8100', shippingMode: 'sea' })!;
    expect(c.cbm).toBeCloseTo(43.2, 9);
    expect(c.dimWeight).toBeCloseTo(43200, 4);
    expect(c.containers20).toBe(2);
    expect(c.containers40).toBe(1);
  });
  it('feet use the exact 0.3048 m', () => {
    expect(computeCbm({ ...base, length: '1', width: '1', height: '1', unit: 'ft', packages: '1' })!.cbm).toBeCloseTo(0.028316846592, 12);
  });
  it('1 CBM dimensional weight per mode: air 166.67, courier 200, sea 1000 kg', () => {
    const one = { length: '1', width: '1', height: '1', unit: 'm', packages: '1', actualWeight: '1' };
    expect(computeCbm({ ...one, shippingMode: 'air' })!.dimWeight).toBeCloseTo(1e6 / 6000, 9);
    expect(computeCbm({ ...one, shippingMode: 'courier' })!.dimWeight).toBeCloseTo(200, 9);
    expect(computeCbm({ ...one, shippingMode: 'sea' })!.dimWeight).toBeCloseTo(1000, 9);
  });
  it('invalid package counts no longer yield NaN CBM (was parseInt)', () => {
    expect(computeCbm({ ...base, packages: 'abc' })).toBeNull();
    expect(computeCbm({ ...base, packages: '2.5' })).toBeNull();
    expect(computeCbm({ ...base, packages: '0' })).toBeNull();
    expect(computeCbm({ ...base, packages: '' })!.packages).toBe(1);
    expect(config.calculate({ ...base, packages: 'abc' })).toEqual([]);
  });
  it('rejects non-positive / non-numeric dimensions and unknown unit', () => {
    for (const k of ['length', 'width', 'height', 'actualWeight'] as const) {
      expect(computeCbm({ ...base, [k]: '0' })).toBeNull();
      expect(computeCbm({ ...base, [k]: '-1' })).toBeNull();
      expect(computeCbm({ ...base, [k]: '1x' })).toBeNull();
    }
    expect(computeCbm({ ...base, unit: 'yd' })).toBeNull();
  });
  it('tiny volumes are not displayed as 0.0000', () => {
    expect(formatCbm(0.00000125)).toBe('0.00000125');
    expect(formatCbm(0.5)).toBe('0.5000');
    expect(formatCbm(123.456)).toBe('123.46');
  });
  it('calculate: container text states it is a typical, volume-only estimate; panel gets numbers', () => {
    const r = config.calculate(base);
    expect(r.find((x) => x.id === 'containerEstimate')!.value).toMatch(/Typical capacities/);
    const el = config.extraPanel!(base, r) as { props: { actual: number; dim: number; chargeable: number } };
    expect(el.props.dim).toBeCloseTo(8250, 6);
    expect(el.props.chargeable).toBeCloseTo(8250, 6);
  });
});
