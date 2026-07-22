import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/engineering/lead-screw';

describe('Lead Screw', () => {
  it('calculates torque for 3D printer Z-axis', () => {
    const r = config.calculate({ axialForce: '49', lead: '0.008', efficiency: '40', safetyFactor: '1.5' });
    const torque = parseFloat(r.find(x => x.id === 'torque')?.value || '0');
    expect(torque).toBeCloseTo(0.156, 2);
  });

  it('ball screw needs less torque than Acme', () => {
    const acme = config.calculate({ axialForce: '500', lead: '0.005', efficiency: '40', safetyFactor: '1' });
    const ball = config.calculate({ axialForce: '500', lead: '0.005', efficiency: '90', safetyFactor: '1' });
    const tAcme = parseFloat(acme.find(x => x.id === 'torque')?.value || '0');
    const tBall = parseFloat(ball.find(x => x.id === 'torque')?.value || '0');
    expect(tBall).toBeLessThan(tAcme);
  });

  it('computes mechanical advantage', () => {
    const r = config.calculate({ axialForce: '100', lead: '0.002', efficiency: '40', safetyFactor: '1' });
    const ma = parseFloat(r.find(x => x.id === 'mechAdv')?.value || '0');
    expect(ma).toBeGreaterThan(1000);
  });

  it('returns empty for missing inputs', () => {
    expect(config.calculate({ axialForce: '', lead: '0.008', efficiency: '40', safetyFactor: '1' })).toEqual([]);
  });

  it('returns empty for zero lead', () => {
    expect(config.calculate({ axialForce: '100', lead: '0', efficiency: '40', safetyFactor: '1' })).toEqual([]);
  });

  it('has educational content', () => {
    expect(config.educational.formula).toBeTruthy();
    expect(config.educational.faqs!.length).toBeGreaterThanOrEqual(4);
  });
});
