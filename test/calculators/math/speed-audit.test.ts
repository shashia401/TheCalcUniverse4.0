import { describe, it, expect } from 'vitest';
import speed from '../../../src/calculators/math/speed';

// Expected values recomputed independently in Python from the exact definitions
// (1 mi = 1609.344 m, 1 nmi = 1852 m, 1 mph = 0.44704 m/s, 1 knot = 1852/3600 m/s).
type R = { id: string; value: string }[];
const val = (r: R, id: string) => r.find((x) => x.id === id)?.value;
const run = (o: Record<string, string>) => speed.calculate(o) as R;

describe('speed audit', () => {
  it('60 miles in 1 hour is exactly 60 mph (the old 2.23694 factor printed 60.000027 mph)', () => {
    const r = run({ mode: 'calcSpeed', distance: '60', distanceUnit: 'mi', time: '1', timeUnit: 'hr' });
    expect(val(r, 'result')).toBe('60 mph');
    expect(val(r, 'speedKmh')).toBe('96.56064 km/h');
    expect(val(r, 'speedMs')).toBe('26.8224 m/s');
    expect(val(r, 'speedKnots')).toBe('52.138575 kn');
  });

  it('marathon in 4 hours (worked example): 6.55 mph, 10.541 km/h, 2.928 m/s, 5.692 knots, 9:10 /mi, 5:42 /km', () => {
    const r = run({ mode: 'calcSpeed', distance: '26.2', distanceUnit: 'mi', time: '4', timeUnit: 'hr' });
    expect(val(r, 'result')).toBe('6.55 mph');
    expect(val(r, 'speedKmh')).toBe('10.541203 km/h');
    expect(val(r, 'speedMs')).toBe('2.928112 m/s');
    expect(val(r, 'speedKnots')).toBe('5.691794 kn');
    expect(val(r, 'paceMile')).toBe('9:10');
    expect(val(r, 'paceKm')).toBe('5:42');
  });

  it('nautical miles exist: 2,225 nmi at 18 knots = 123.611111 h (the old example fed statute miles)', () => {
    const r = run({ mode: 'calcTime', distance: '2225', distanceUnit: 'nmi', speed: '18', speedUnit: 'knots', timeResultUnit: 'hr' });
    expect(val(r, 'result')).toBe('123.611111 hours');
    const asStatute = run({ mode: 'calcTime', distance: '2225', distanceUnit: 'mi', speed: '18', speedUnit: 'knots', timeResultUnit: 'hr' });
    expect(val(asStatute, 'result')).not.toBe('123.611111 hours');
  });

  it('commute: 35 mi at 28 mph = 75 minutes', () => {
    const r = run({ mode: 'calcTime', distance: '35', distanceUnit: 'mi', speed: '28', speedUnit: 'mph', timeResultUnit: 'min' });
    expect(val(r, 'result')).toBe('75 minutes');
  });

  it('distance: 90 minutes at 6 km/h = 9 km = 5.592341 mi, and in nautical miles', () => {
    const base = { mode: 'calcDistance', speed: '6', speedUnit: 'kmh', time: '90', timeUnit: 'min' };
    expect(val(run({ ...base, distanceResultUnit: 'km' }), 'result')).toBe('9 km');
    expect(val(run({ ...base, distanceResultUnit: 'mi' }), 'result')).toBe('5.592341 mi');
    expect(val(run({ ...base, distanceResultUnit: 'nmi' }), 'result')).toBe('4.859611 nmi');
  });

  it('rejects negatives, junk and zero divisors', () => {
    const base = { mode: 'calcSpeed', distance: '60', distanceUnit: 'mi', time: '1', timeUnit: 'hr' };
    expect(run({ ...base, distance: '-60' })).toEqual([]);
    expect(run({ ...base, time: '1h' })).toEqual([]);
    expect(run({ ...base, time: '0' })).toEqual([]);
    expect(run({ ...base, time: 'Infinity' })).toEqual([]);
    expect(run({ mode: 'calcTime', distance: '10', distanceUnit: 'mi', speed: '0', speedUnit: 'mph' })).toEqual([]);
  });
});
