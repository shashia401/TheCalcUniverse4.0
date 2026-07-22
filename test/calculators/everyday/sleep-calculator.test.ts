import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/everyday/sleep/index';
import { getValue } from '../../helpers';

describe('Sleep Calculator', () => {
  it('calculates bedtimes for wake-up mode at 6:30 AM', () => {
    const results = config.calculate({
      mode: 'wake',
      wakeupTime: '6:30 AM',
    });
    const options = JSON.parse(getValue(results, 'options'));
    expect(options).toHaveLength(4);
    expect(options[0]).toHaveProperty('cycles');
    expect(options[0]).toHaveProperty('time');
    expect(options[0].cycles).toBeGreaterThanOrEqual(3);
    expect(options[0].cycles).toBeLessThanOrEqual(6);
  });

  it('calculates wake-up times for sleep mode at 11:00 PM', () => {
    const results = config.calculate({
      mode: 'sleep',
      bedtime: '11:00 PM',
    });
    const options = JSON.parse(getValue(results, 'options'));
    expect(options).toHaveLength(4);
    expect(options[0]).toHaveProperty('cycles');
    expect(options[0]).toHaveProperty('time');
  });

  it('returns empty for invalid wakeup time', () => {
    const results = config.calculate({
      mode: 'wake',
      wakeupTime: 'not a time',
    });
    expect(results).toEqual([]);
  });

  it('returns empty for empty wakeup time', () => {
    const results = config.calculate({
      mode: 'wake',
      wakeupTime: '',
    });
    expect(results).toEqual([]);
  });

  it('returns empty for invalid bedtime', () => {
    const results = config.calculate({
      mode: 'sleep',
      bedtime: 'xyz',
    });
    expect(results).toEqual([]);
  });

  it('recommends 5-6 cycle bedtime as recommended', () => {
    const results = config.calculate({
      mode: 'wake',
      wakeupTime: '7:00 AM',
    });
    const recommended = getValue(results, 'recommendedBedtime');
    expect(recommended).toBeTruthy();
    expect(typeof recommended).toBe('string');
  });

  it('handles 24-hour time format', () => {
    const results = config.calculate({
      mode: 'wake',
      wakeupTime: '06:30',
    });
    const options = JSON.parse(getValue(results, 'options'));
    expect(options).toHaveLength(4);
  });
});
