import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/everyday/dew-point/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Dew Point Calculator', () => {
  it('calculates dew point for 75F at 60% humidity', () => {
    const results = config.calculate({
      temperature: '75',
      humidity: '60',
    });
    const dp = parseNumber(getValue(results, 'dewPointF'));
    // Expected ~60°F for 75F at 60% RH
    near(dp, 60, 2);
  });

  it('calculates dew point for 85F at 70% humidity', () => {
    const results = config.calculate({
      temperature: '85',
      humidity: '70',
    });
    const dp = parseNumber(getValue(results, 'dewPointF'));
    // Expected ~74°F for 85F at 70% RH
    near(dp, 74, 2);
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
      temperature: '75',
      humidity: '',
    });
    expect(results).toEqual([]);
  });

  it('returns empty for humidity over 100%', () => {
    const results = config.calculate({
      temperature: '75',
      humidity: '120',
    });
    expect(results).toEqual([]);
  });

  it('returns empty for negative humidity', () => {
    const results = config.calculate({
      temperature: '75',
      humidity: '-10',
    });
    expect(results).toEqual([]);
  });

  it('returns comfort level label', () => {
    const results = config.calculate({
      temperature: '75',
      humidity: '45',
    });
    const comfort = getValue(results, 'comfortLevel');
    expect(comfort).toBeTruthy();
    expect(typeof comfort).toBe('string');
  });
});
