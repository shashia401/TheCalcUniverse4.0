import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/engineering/flow-rate/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Flow Rate Calculator', () => {
  it('calculates flow velocity from pipe diameter and flow rate', () => {
    const results = config.calculate({
      mode: 'velocity',
      pipeDiameter: '2',
      flowRate: '25',
      velocity: '',
    });
    // area = π * ((2/12)/2)^2 = 0.02182 sq ft
    // flowCFS = 25/448.83 = 0.05570
    // vel = 0.05570/0.02182 = 2.55 ft/s
    const vel = parseNumber(getValue(results, 'velocity'));
    near(vel, 2.55, 0.05);
  });

  it('calculates flow rate from pipe diameter and velocity', () => {
    const results = config.calculate({
      mode: 'flowrate',
      pipeDiameter: '2',
      flowRate: '',
      velocity: '2.5',
    });
    // area = 0.02182 sq ft, flowCFS = 0.02182 * 2.5 = 0.05455
    // flowGPM = 0.05455 * 448.83 = 24.48
    const gpm = parseNumber(getValue(results, 'flowGPM'));
    near(gpm, 24.5, 0.5);
  });

  it('calculates required pipe diameter from flow rate and velocity', () => {
    const results = config.calculate({
      mode: 'diameter',
      pipeDiameter: '',
      flowRate: '25',
      velocity: '2.5',
    });
    // flowCFS = 25/448.83 = 0.05570
    // area = 0.05570/2.5 = 0.02228 sq ft
    // diamFt = 2*sqrt(0.02228/π) = 0.1684, diamIn = 2.02
    const diam = parseNumber(getValue(results, 'diameter'));
    near(diam, 2.02, 0.05);
  });

  it('returns pipe cross-section area', () => {
    const results = config.calculate({
      mode: 'velocity',
      pipeDiameter: '2',
      flowRate: '25',
      velocity: '',
    });
    const area = parseNumber(getValue(results, 'area'));
    near(area, 3.14, 0.05); // π in² ≈ 3.14 in²
  });

  it('returns empty for missing inputs', () => {
    const results = config.calculate({
      mode: 'velocity',
      pipeDiameter: '',
      flowRate: '',
      velocity: '',
    });
    expect(results).toEqual([]);
  });

  it('returns empty for zero pipe diameter', () => {
    const results = config.calculate({
      mode: 'velocity',
      pipeDiameter: '0',
      flowRate: '25',
      velocity: '',
    });
    expect(results).toEqual([]);
  });
});
