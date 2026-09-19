import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/dew-point/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Dew Point calculator', () => {
  it('calculates dew point for 75°F at 60% humidity', () => {
    const r = config.calculate({ temperature: '75', humidity: '60' });
    near(parseNumber(getValue(r, 'dewPoint')), 60.1, 0.7);
  });

  it('calculates dew point for 80°F at 50% humidity', () => {
    const r = config.calculate({ temperature: '80', humidity: '50' });
    near(parseNumber(getValue(r, 'dewPoint')), 59.9, 0.7);
  });

  it('calculates dew point for 70°F at 80% humidity', () => {
    const r = config.calculate({ temperature: '70', humidity: '80' });
    near(parseNumber(getValue(r, 'dewPoint')), 63.5, 0.7);
  });

  it('displays both °F and °C in combined result', () => {
    const r = config.calculate({ temperature: '75', humidity: '60' });
    expect(getValue(r, 'dewPoint')).toContain('°F');
    expect(getValue(r, 'dewPoint')).toContain('°C');
  });

  it('returns separate °F and °C values', () => {
    const r = config.calculate({ temperature: '75', humidity: '60' });
    expect(getValue(r, 'dewPointF')).toContain('°F');
    expect(getValue(r, 'dewPointC')).toContain('°C');
  });

  it('shows "Dry and comfortable" for dew point below 55°F', () => {
    const r = config.calculate({ temperature: '60', humidity: '30' });
    expect(getValue(r, 'comfortLevel')).toContain('Dry');
  });

  it('shows "Comfortable" for dew point 55-60°F', () => {
    // 72°F at 60% → dp ≈ 57°F
    const r = config.calculate({ temperature: '72', humidity: '60' });
    expect(getValue(r, 'comfortLevel')).toContain('Comfortable');
  });

  it('shows "Slightly humid" for dew point 60-65°F', () => {
    // 75°F at 65% → dp ≈ 62°F
    const r = config.calculate({ temperature: '75', humidity: '65' });
    expect(getValue(r, 'comfortLevel')).toContain('Slightly humid');
  });

  it('shows "Becoming sticky" for dew point 65-70°F', () => {
    const r = config.calculate({ temperature: '80', humidity: '65' });
    expect(getValue(r, 'comfortLevel')).toContain('sticky');
  });

  it('shows "Uncomfortable" for dew point 70-75°F', () => {
    const r = config.calculate({ temperature: '85', humidity: '70' });
    expect(getValue(r, 'comfortLevel')).toContain('Uncomfortable');
  });

  it('shows "Very uncomfortable" for dew point 75-80°F', () => {
    // 88°F at 75% → dp ≈ 79°F
    const r = config.calculate({ temperature: '88', humidity: '75' });
    expect(getValue(r, 'comfortLevel')).toContain('Very uncomfortable');
  });

  it('shows "Extremely oppressive" for dew point above 80°F', () => {
    const r = config.calculate({ temperature: '95', humidity: '80' });
    const dp = parseNumber(getValue(r, 'dewPoint'));
    expect(dp).toBeGreaterThan(80);
    expect(getValue(r, 'comfortLevel')).toContain('Extremely oppressive');
  });

  it('returns empty for missing temperature', () => {
    const r = config.calculate({ temperature: '', humidity: '60' });
    expect(r).toEqual([]);
  });

  it('returns empty for missing humidity', () => {
    const r = config.calculate({ temperature: '75', humidity: '' });
    expect(r).toEqual([]);
  });

  it('returns empty for invalid temperature', () => {
    const r = config.calculate({ temperature: 'abc', humidity: '60' });
    expect(r).toEqual([]);
  });

  it('returns empty for humidity below 0', () => {
    const r = config.calculate({ temperature: '75', humidity: '-1' });
    expect(r).toEqual([]);
  });

  it('returns empty for humidity above 100', () => {
    const r = config.calculate({ temperature: '75', humidity: '110' });
    expect(r).toEqual([]);
  });

  it('outputs chart data', () => {
    const r = config.calculate({ temperature: '75', humidity: '60' });
    const chart = r.find(x => x.id === '_chartData');
    expect(chart).toBeTruthy();
    expect(chart!.value).toContain('dewPointF');
  });
});
