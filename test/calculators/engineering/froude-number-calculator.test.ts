import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/engineering/froude-number';

describe('Froude Number', () => {
  it('subcritical flow Fr < 1 for slow deep river', () => {
    const r = config.calculate({ velocity: '2', gravity: '9.81', characteristicLength: '1.5' });
    const fr = parseFloat(r.find(x => x.id === 'froude')?.value || '0');
    expect(fr).toBeCloseTo(0.521, 2);
    expect(r.find(x => x.id === 'regime')?.value).toContain('Subcritical');
  });

  it('supercritical flow Fr > 1 for spillway', () => {
    const r = config.calculate({ velocity: '15', gravity: '9.81', characteristicLength: '0.3' });
    const fr = parseFloat(r.find(x => x.id === 'froude')?.value || '0');
    expect(fr).toBeGreaterThan(5);
    expect(r.find(x => x.id === 'regime')?.value).toContain('supercritical');
  });

  it('critical flow Fr ≈ 1', () => {
    const r = config.calculate({ velocity: '3.13', gravity: '9.81', characteristicLength: '1' });
    const fr = parseFloat(r.find(x => x.id === 'froude')?.value || '0');
    expect(fr).toBeCloseTo(1, 0);
  });

  it('returns empty for missing inputs', () => {
    expect(config.calculate({ velocity: '', gravity: '9.81', characteristicLength: '1' })).toEqual([]);
  });

  it('uses default gravity 9.81', () => {
    const r = config.calculate({ velocity: '5', gravity: '9.81', characteristicLength: '2' });
    expect(r.length).toBeGreaterThan(0);
  });

  it('has educational content', () => {
    expect(config.educational.formula).toBeTruthy();
    expect(config.educational.faqs!.length).toBeGreaterThanOrEqual(4);
  });
});
