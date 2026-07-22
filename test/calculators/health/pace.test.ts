import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/health/pace/index';
import { getValue } from '../../helpers';

describe('Pace calculator', () => {
  it('calculates pace from time and distance', () => {
    const r = config.calculate({
      distanceUnit: 'miles',
      distance: 'marathon',
      customDistance: '',
      hours: '3',
      minutes: '30',
      seconds: '0',
      calcMode: 'pace',
      paceMinutes: '',
      paceSeconds: '',
    });
    const pace = getValue(r, 'pace');
    expect(pace).toContain('/mi');
    expect(pace).toMatch(/\d+:\d{2}/);
  });

  it('calculates time from distance and pace', () => {
    const r = config.calculate({
      distanceUnit: 'km',
      distance: '10',
      customDistance: '',
      hours: '',
      minutes: '',
      seconds: '',
      calcMode: 'time',
      paceMinutes: '5',
      paceSeconds: '0',
    });
    const time = getValue(r, 'totalTime');
    expect(time).toBeTruthy();
  });

  it('calculates distance from time and pace', () => {
    const r = config.calculate({
      distanceUnit: 'miles',
      distance: 'custom',
      customDistance: '',
      hours: '1',
      minutes: '0',
      seconds: '0',
      calcMode: 'distance',
      paceMinutes: '10',
      paceSeconds: '0',
    });
    const dist = parseFloat(getValue(r, 'distance'));
    expect(dist).toBeGreaterThan(5);
    expect(dist).toBeLessThan(7);
  });

  it('returns speed in both units', () => {
    const r = config.calculate({
      distanceUnit: 'miles',
      distance: '5',
      customDistance: '',
      hours: '0',
      minutes: '40',
      seconds: '0',
      calcMode: 'pace',
      paceMinutes: '',
      paceSeconds: '',
    });
    expect(getValue(r, 'speed')).toContain('mph');
    expect(getValue(r, 'speed')).toContain('km/h');
  });

  it('returns splits for race distances', () => {
    const r = config.calculate({
      distanceUnit: 'miles',
      distance: 'half',
      customDistance: '',
      hours: '1',
      minutes: '45',
      seconds: '0',
      calcMode: 'pace',
      paceMinutes: '',
      paceSeconds: '',
    });
    expect(getValue(r, 'splitCount')).toBeTruthy();
  });

  it('returns empty for invalid inputs', () => {
    const r = config.calculate({
      distanceUnit: 'miles',
      distance: '5',
      customDistance: '',
      hours: '0',
      minutes: '0',
      seconds: '0',
      calcMode: 'pace',
      paceMinutes: '',
      paceSeconds: '',
    });
    expect(r).toEqual([]);
  });
});
