import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/engineering/gear-ratio';
import { getResult, getValue, parseNumber, near } from '../../helpers';

const run = (v: Record<string, string>) =>
  config.calculate({ mode: 'output', inputRPM: '', outputRPM: '', gearRatio: '', inputTorque: '', efficiency: '', ...v });

describe('gear-ratio audit (out RPM = in/ratio; out torque = in x ratio x efficiency)', () => {
  it('conveyor: 1750 -> 70 RPM is 25:1 and 45 N·m becomes 1068.75 N·m at 95%', () => {
    const r = run({ mode: 'ratio', inputRPM: '1750', outputRPM: '70', inputTorque: '45' });
    expect(getValue(r, 'ratio')).toBe('25:1');
    near(parseNumber(getValue(r, 'outputTorque')), 1068.75, 0.01);
    expect(getResult(r, 'outputTorque').label).toContain('95% efficiency');
  });
  it('go-kart: 3000 RPM at 4:1 -> 750 RPM, 12 N·m -> 45.6 N·m; ideal ratio for 25 mph is 3.93', () => {
    const r = run({ inputRPM: '3000', gearRatio: '4', inputTorque: '12' });
    expect(getValue(r, 'outputRPM')).toBe('750 RPM');
    near(parseNumber(getValue(r, 'outputTorque')), 45.6, 0.01);
    const wheelRpm = (25 * 63360) / 60 / (Math.PI * 11);
    expect(wheelRpm).toBeCloseTo(763.7, 0);
    expect(3000 / wheelRpm).toBeCloseTo(3.928, 2);
    expect((750 * Math.PI * 11 * 60) / 63360).toBeCloseTo(24.5, 1);
  });
  it('solar tracker: 3000 -> 0.1 RPM is 30,000:1; with 60% worm efficiency 0.5 N·m -> 9,000 N·m', () => {
    const r = run({ mode: 'ratio', inputRPM: '3000', outputRPM: '0.1', inputTorque: '0.5', efficiency: '60' });
    expect(getValue(r, 'ratio')).toBe('30000:1');
    near(parseNumber(getValue(r, 'outputTorque')), 9000, 0.01);
  });
  it('custom efficiency changes torque only, label follows', () => {
    const r = run({ inputRPM: '1000', gearRatio: '10', inputTorque: '10', efficiency: '80' });
    near(parseNumber(getValue(r, 'outputTorque')), 80, 1e-6);
    expect(getResult(r, 'outputTorque').label).toContain('80% efficiency');
    expect(getValue(r, 'outputRPM')).toBe('100 RPM');
  });
  it('required input RPM = output x ratio (60 RPM at 30:1 -> 1800)', () => {
    expect(getValue(run({ mode: 'input_rpm', outputRPM: '60', gearRatio: '30' }), 'inputRPM')).toBe('1800 RPM');
  });
  it('overdrive vs reduction classification; shaft power example 45 N·m x 1750 / 9549 = 8.25 kW', () => {
    expect(getValue(run({ mode: 'ratio', inputRPM: '100', outputRPM: '200' }), 'type')).toMatch(/Overdrive/);
    expect(getValue(run({ mode: 'ratio', inputRPM: '100', outputRPM: '100' }), 'type')).toMatch(/1:1/);
    expect((45 * 1750) / 9549).toBeCloseTo(8.25, 2);
  });
  it('invalid input returns []', () => {
    expect(run({ inputRPM: '100', gearRatio: '0' })).toEqual([]);
    expect(run({ mode: 'ratio', inputRPM: '100', outputRPM: '0' })).toEqual([]);
    expect(run({ inputRPM: '100', gearRatio: '2', efficiency: '150' })).toEqual([]);
  });
});
