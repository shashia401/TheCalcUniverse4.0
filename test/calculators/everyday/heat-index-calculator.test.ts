import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/everyday/heat-index/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Heat Index Calculator', () => {
  it('calculates heat index for 90F at 60% humidity', () => {
    const results = config.calculate({
      temperature: '90',
      humidity: '60',
    });
    const hi = parseNumber(getValue(results, 'heatIndex'));
    // Expected ~100°F
    near(hi, 100, 2);
  });

  it('calculates heat index for 96F at 55% humidity', () => {
    const results = config.calculate({
      temperature: '96',
      humidity: '55',
    });
    const hi = parseNumber(getValue(results, 'heatIndex'));
    // Expected ~107°F for 96F at 55%
    near(hi, 112, 5);
  });

  it('returns empty for missing temperature', () => {
    const results = config.calculate({
      temperature: '',
      humidity: '60',
    });
    expect(results).toEqual([]);
  });

  it('returns empty for missing humidity', () => {
    const results = config.calculate({
      temperature: '90',
      humidity: '',
    });
    expect(results).toEqual([]);
  });

  it('returns empty for humidity over 100%', () => {
    const results = config.calculate({
      temperature: '90',
      humidity: '120',
    });
    expect(results).toEqual([]);
  });

  it('returns empty for negative humidity', () => {
    const results = config.calculate({
      temperature: '90',
      humidity: '-10',
    });
    expect(results).toEqual([]);
  });

  it('returns danger tier label', () => {
    const results = config.calculate({
      temperature: '100',
      humidity: '65',
    });
    const tier = getValue(results, 'dangerTier');
    expect(tier).toBeTruthy();
    // Should be Danger or Extreme Danger at 100F + 65%
    expect(['Danger', 'Extreme Danger']).toContain(tier);
  });
});
