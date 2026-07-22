import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/speed/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Speed Calculator', () => {
  // ─── calcSpeed mode ──────────────────────────────────────
  it('calcSpeed: 60 miles in 1 hour = 60 mph', () => {
    const r = config.calculate({ mode: 'calcSpeed', distance: '60', distanceUnit: 'mi', time: '1', timeUnit: 'hr' });
    near(parseNumber(getValue(r, 'result')), 60);
    expect(getValue(r, 'result')).toContain('mph');
  });

  it('calcSpeed: shows km/h conversion', () => {
    const r = config.calculate({ mode: 'calcSpeed', distance: '60', distanceUnit: 'mi', time: '1', timeUnit: 'hr' });
    near(parseNumber(getValue(r, 'speedKmh')), 96.56, 0.1);
    expect(getValue(r, 'speedKmh')).toContain('km/h');
  });

  it('calcSpeed: shows m/s conversion', () => {
    const r = config.calculate({ mode: 'calcSpeed', distance: '60', distanceUnit: 'mi', time: '1', timeUnit: 'hr' });
    near(parseNumber(getValue(r, 'speedMs')), 26.82, 0.1);
  });

  it('calcSpeed: shows knots conversion', () => {
    const r = config.calculate({ mode: 'calcSpeed', distance: '60', distanceUnit: 'mi', time: '1', timeUnit: 'hr' });
    near(parseNumber(getValue(r, 'speedKnots')), 52.14, 0.1);
  });

  it('calcSpeed: pace min/mile for 6 mph = 10:00', () => {
    const r = config.calculate({ mode: 'calcSpeed', distance: '6', distanceUnit: 'mi', time: '1', timeUnit: 'hr' });
    const paceVal = getValue(r, 'paceMile');
    expect(paceVal).toContain('10:00');
  });

  it('calcSpeed: pace min/km for 12 km/h = 5:00', () => {
    const r = config.calculate({ mode: 'calcSpeed', distance: '12', distanceUnit: 'km', time: '1', timeUnit: 'hr' });
    const paceVal = getValue(r, 'paceKm');
    expect(paceVal).toContain('5:00');
  });

  it('calcSpeed: shows formula S = D / T', () => {
    const r = config.calculate({ mode: 'calcSpeed', distance: '100', distanceUnit: 'km', time: '2', timeUnit: 'hr' });
    expect(getValue(r, 'formula')).toContain('S = D / T');
  });

  it('calcSpeed: shows step-by-step', () => {
    const r = config.calculate({ mode: 'calcSpeed', distance: '60', distanceUnit: 'mi', time: '1', timeUnit: 'hr' });
    expect(getValue(r, 'steps')).toContain('÷');
  });

  it('calcSpeed: returns empty for zero time', () => {
    const r = config.calculate({ mode: 'calcSpeed', distance: '60', distanceUnit: 'mi', time: '0', timeUnit: 'hr' });
    expect(r).toEqual([]);
  });

  it('calcSpeed: returns empty for NaN distance', () => {
    const r = config.calculate({ mode: 'calcSpeed', distance: 'abc', distanceUnit: 'mi', time: '1', timeUnit: 'hr' });
    expect(r).toEqual([]);
  });

  it('calcSpeed: kilometers mode shows correct km/h', () => {
    const r = config.calculate({ mode: 'calcSpeed', distance: '100', distanceUnit: 'km', time: '2', timeUnit: 'hr' });
    // 100 km / 2 hr = 50 km/h
    near(parseNumber(getValue(r, 'speedKmh')), 50);
    near(parseNumber(getValue(r, 'result')), 31.07, 0.1);
  });

  it('calcSpeed: meters and seconds', () => {
    const r = config.calculate({ mode: 'calcSpeed', distance: '400', distanceUnit: 'm', time: '50', timeUnit: 'sec' });
    // 400 m / 50 s = 8 m/s
    near(parseNumber(getValue(r, 'speedMs')), 8);
  });

  it('calcSpeed: feet and minutes', () => {
    const r = config.calculate({ mode: 'calcSpeed', distance: '5280', distanceUnit: 'ft', time: '10', timeUnit: 'min' });
    // 5280 ft = 1 mi, 10 min = 1/6 hr, speed = 6 mph
    near(parseNumber(getValue(r, 'result')), 6, 0.1);
  });

  // ─── calcDistance mode ───────────────────────────────────
  it('calcDistance: 60 mph for 2 hours = 120 mi', () => {
    const r = config.calculate({ mode: 'calcDistance', speed: '60', speedUnit: 'mph', time: '2', timeUnit: 'hr', distanceResultUnit: 'mi' });
    near(parseNumber(getValue(r, 'result')), 120);
    expect(getValue(r, 'result')).toContain('mi');
  });

  it('calcDistance: shows formula D = S × T', () => {
    const r = config.calculate({ mode: 'calcDistance', speed: '60', speedUnit: 'mph', time: '1', timeUnit: 'hr', distanceResultUnit: 'mi' });
    expect(getValue(r, 'formula')).toContain('D = S × T');
  });

  it('calcDistance: returns empty for NaN speed', () => {
    const r = config.calculate({ mode: 'calcDistance', speed: '', speedUnit: 'mph', time: '1', timeUnit: 'hr', distanceResultUnit: 'mi' });
    expect(r).toEqual([]);
  });

  // ─── calcTime mode ───────────────────────────────────────
  it('calcTime: 120 miles at 60 mph = 2 hours', () => {
    const r = config.calculate({ mode: 'calcTime', distance: '120', distanceUnit: 'mi', speed: '60', speedUnit: 'mph', timeResultUnit: 'hr' });
    near(parseNumber(getValue(r, 'result')), 2);
    expect(getValue(r, 'result')).toContain('hours');
  });

  it('calcTime: shows formula T = D / S', () => {
    const r = config.calculate({ mode: 'calcTime', distance: '100', distanceUnit: 'km', speed: '50', speedUnit: 'kmh', timeResultUnit: 'hr' });
    expect(getValue(r, 'formula')).toContain('T = D / S');
  });

  it('calcTime: returns empty for zero speed', () => {
    const r = config.calculate({ mode: 'calcTime', distance: '10', distanceUnit: 'mi', speed: '0', speedUnit: 'mph', timeResultUnit: 'hr' });
    expect(r).toEqual([]);
  });

  it('calcTime: time in minutes', () => {
    const r = config.calculate({ mode: 'calcTime', distance: '60', distanceUnit: 'mi', speed: '60', speedUnit: 'mph', timeResultUnit: 'min' });
    near(parseNumber(getValue(r, 'result')), 60);
    expect(getValue(r, 'result')).toContain('minutes');
  });
});
