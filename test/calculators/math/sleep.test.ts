import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/sleep/index';
import { getValue } from '../../helpers';

describe('sleep', () => {
  it('returns bedtimes for given wake time (12h format)', () => {
    const r = config.calculate({ mode: 'wake', wakeupTime: '6:30 AM' });
    expect(r.length).toBeGreaterThan(0);
    expect(getValue(r, 'recommendedBedtime')).toBeTruthy();
    expect(getValue(r, 'cycleInfo')).toBeTruthy();
  });

  it('returns bedtimes for given wake time (24h format)', () => {
    const r = config.calculate({ mode: 'wake', wakeupTime: '06:30' });
    expect(r.length).toBeGreaterThan(0);
    expect(getValue(r, 'recommendedBedtime')).toBeTruthy();
  });

  it('returns wake times for given bedtime (12h format)', () => {
    const r = config.calculate({ mode: 'sleep', bedtime: '11:00 PM' });
    expect(r.length).toBeGreaterThan(0);
    expect(getValue(r, 'recommendedWakeup')).toBeTruthy();
    expect(getValue(r, 'cycleInfo')).toBeTruthy();
  });

  it('returns wake times for given bedtime (24h format)', () => {
    const r = config.calculate({ mode: 'sleep', bedtime: '23:00' });
    expect(r.length).toBeGreaterThan(0);
    expect(getValue(r, 'recommendedWakeup')).toBeTruthy();
  });

  it('returns 4 options for wake mode', () => {
    const r = config.calculate({ mode: 'wake', wakeupTime: '7:00 AM' });
    const options = JSON.parse(getValue(r, 'options'));
    expect(options).toHaveLength(4);
  });

  it('returns 4 options for sleep mode', () => {
    const r = config.calculate({ mode: 'sleep', bedtime: '10:00 PM' });
    const options = JSON.parse(getValue(r, 'options'));
    expect(options).toHaveLength(4);
  });

  it('options have valid cycle counts descending from 6 to 3', () => {
    const r = config.calculate({ mode: 'wake', wakeupTime: '8:00 AM' });
    const options = JSON.parse(getValue(r, 'options'));
    expect(options[0].cycles).toBe(6);
    expect(options[1].cycles).toBe(5);
    expect(options[2].cycles).toBe(4);
    expect(options[3].cycles).toBe(3);
  });

  it('calculates correct hours for each option', () => {
    const r = config.calculate({ mode: 'wake', wakeupTime: '6:00 AM' });
    const options = JSON.parse(getValue(r, 'options'));
    // 6 cycles * 90 min = 540 min = 9 hours
    expect(options[0].hours).toBe(9);
    // 5 cycles * 90 min = 450 min = 7.5 hours
    expect(options[1].hours).toBe(7.5);
  });

  it('recommends 5-6 cycle option', () => {
    const r = config.calculate({ mode: 'wake', wakeupTime: '7:00 AM' });
    const options = JSON.parse(getValue(r, 'options'));
    const recommended = getValue(r, 'recommendedBedtime');
    const recommendedOption = options.find((o: any) => o.time === recommended);
    expect(recommendedOption.cycles).toBeGreaterThanOrEqual(5);
  });

  it('returns empty for missing time in wake mode', () => {
    const r = config.calculate({ mode: 'wake', wakeupTime: '' });
    expect(r).toEqual([]);
  });

  it('returns empty for missing time in sleep mode', () => {
    const r = config.calculate({ mode: 'sleep', bedtime: '' });
    expect(r).toEqual([]);
  });

  it('returns empty for invalid time format', () => {
    const r = config.calculate({ mode: 'wake', wakeupTime: 'xyz' });
    expect(r).toEqual([]);
  });

  it('handles PM times correctly', () => {
    const r = config.calculate({ mode: 'sleep', bedtime: '10:00 PM' });
    const options = JSON.parse(getValue(r, 'options'));
    // 10 PM = 22:00, wake times should be in the AM
    options.forEach((o: any) => {
      expect(o.time).toMatch(/(AM)/);
    });
  });

  it('extraPanel returns element when results exist', () => {
    const r = config.calculate({ mode: 'wake', wakeupTime: '6:30 AM' });
    const panel = config.extraPanel({ mode: 'wake', wakeupTime: '6:30 AM' }, r);
    expect(panel).not.toBeNull();
  });

  it('extraPanel returns null when results empty', () => {
    const r = config.calculate({ mode: 'wake', wakeupTime: '' });
    const panel = config.extraPanel({ mode: 'wake', wakeupTime: '' }, r);
    expect(panel).toBeNull();
  });
});
