import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/horsepower/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Horsepower calculator (Hale formula)', () => {
  it('calculates ET-based HP correctly', () => {
    const r = config.calculate({ mode: 'et', vehicleWeight: '3500', quarterMileET: '12.5', drivetrain: 'rwd' });
    const hp = parseNumber(getValue(r, 'estimatedHP'));
    // Result is formatted to 1 decimal, so use 0.05 tolerance
    near(hp, 3500 / Math.pow(12.5 / 5.825, 3), 0.05);
  });

  it('calculates speed-based HP correctly', () => {
    const r = config.calculate({ mode: 'speed', vehicleWeight: '3500', trapSpeed: '110', drivetrain: 'rwd' });
    const hp = parseNumber(getValue(r, 'estimatedHP'));
    near(hp, 3500 * Math.pow(110 / 234, 3), 0.05);
  });

  it('averages ET and speed in both mode', () => {
    const r = config.calculate({ mode: 'both', vehicleWeight: '3500', quarterMileET: '12.5', trapSpeed: '110', drivetrain: 'rwd' });
    const hp = parseNumber(getValue(r, 'estimatedHP'));
    const hpET = 3500 / Math.pow(12.5 / 5.825, 3);
    const hpSpeed = 3500 * Math.pow(110 / 234, 3);
    near(hp, (hpET + hpSpeed) / 2, 0.05);
  });

  it('shows hpFromET and hpFromSpeed in both mode', () => {
    const r = config.calculate({ mode: 'both', vehicleWeight: '3500', quarterMileET: '12.5', trapSpeed: '110', drivetrain: 'rwd' });
    expect(getValue(r, 'hpFromET')).toBeTruthy();
    expect(getValue(r, 'hpFromSpeed')).toBeTruthy();
  });

  it('applies FWD 15% drivetrain loss', () => {
    const r = config.calculate({ mode: 'et', vehicleWeight: '3500', quarterMileET: '12.5', drivetrain: 'fwd' });
    const crank = parseNumber(getValue(r, 'crankHP'));
    const wheel = parseNumber(getValue(r, 'wheelHP'));
    near(wheel, crank * 0.85, 0.1);
  });

  it('applies RWD 18% drivetrain loss', () => {
    const r = config.calculate({ mode: 'speed', vehicleWeight: '3500', trapSpeed: '110', drivetrain: 'rwd' });
    const crank = parseNumber(getValue(r, 'crankHP'));
    const wheel = parseNumber(getValue(r, 'wheelHP'));
    near(wheel, crank * 0.82, 0.1);
  });

  it('applies AWD 25% drivetrain loss', () => {
    const r = config.calculate({ mode: 'et', vehicleWeight: '3500', quarterMileET: '12.5', drivetrain: 'awd' });
    const crank = parseNumber(getValue(r, 'crankHP'));
    const wheel = parseNumber(getValue(r, 'wheelHP'));
    near(wheel, crank * 0.75, 0.1);
  });

  it('calculates power-to-weight ratio correctly', () => {
    const r = config.calculate({ mode: 'et', vehicleWeight: '3500', quarterMileET: '12.5', drivetrain: 'rwd' });
    const hp = parseNumber(getValue(r, 'estimatedHP'));
    const ptW = parseNumber(getValue(r, 'powerToWeight'));
    near(ptW, 3500 / hp, 0.05);
  });

  it('returns performance tier string', () => {
    const r = config.calculate({ mode: 'et', vehicleWeight: '3500', quarterMileET: '12.5', drivetrain: 'rwd' });
    expect(getValue(r, 'powerCategory')).toBeTruthy();
  });

  it('returns empty array for missing weight', () => {
    const r = config.calculate({ mode: 'et', vehicleWeight: '', quarterMileET: '12.5', drivetrain: 'rwd' });
    expect(r).toEqual([]);
  });

  it('returns empty array for zero weight', () => {
    const r = config.calculate({ mode: 'et', vehicleWeight: '0', quarterMileET: '12.5', drivetrain: 'rwd' });
    expect(r).toEqual([]);
  });

  it('returns empty array for missing ET in ET mode', () => {
    const r = config.calculate({ mode: 'et', vehicleWeight: '3500', quarterMileET: '', drivetrain: 'rwd' });
    expect(r).toEqual([]);
  });

  it('returns empty array for missing speed in speed mode', () => {
    const r = config.calculate({ mode: 'speed', vehicleWeight: '3500', trapSpeed: '', drivetrain: 'rwd' });
    expect(r).toEqual([]);
  });

  it('returns consistent method string per mode', () => {
    let r = config.calculate({ mode: 'et', vehicleWeight: '3500', quarterMileET: '12.5', drivetrain: 'rwd' });
    expect(getValue(r, 'method')).toBe('ET-based');

    r = config.calculate({ mode: 'speed', vehicleWeight: '3500', trapSpeed: '110', drivetrain: 'rwd' });
    expect(getValue(r, 'method')).toBe('Speed-based');

    r = config.calculate({ mode: 'both', vehicleWeight: '3500', quarterMileET: '12.5', trapSpeed: '110', drivetrain: 'rwd' });
    expect(getValue(r, 'method')).toBe('Average of both');
  });

  it('returns higher HP for heavier weight with same ET', () => {
    // HP = weight / (ET/5.825)³ — heavier car needs MORE power to run same ET
    const rHeavy = config.calculate({ mode: 'et', vehicleWeight: '4000', quarterMileET: '12.5', drivetrain: 'rwd' });
    const rLight = config.calculate({ mode: 'et', vehicleWeight: '3000', quarterMileET: '12.5', drivetrain: 'rwd' });
    const hpHeavy = parseNumber(getValue(rHeavy, 'estimatedHP'));
    const hpLight = parseNumber(getValue(rLight, 'estimatedHP'));
    expect(hpHeavy).toBeGreaterThan(hpLight);
  });
});
