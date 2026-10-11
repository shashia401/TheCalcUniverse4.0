import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/health/pace/index';
import { getValue } from '../../helpers';

describe('Pace calculator', () => {
  describe('Pace mode — calculates pace from time and distance', () => {
    it('computes marathon pace in miles', () => {
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
      // 3:30:00 marathon = 210 min / 26.21875 mi ≈ 8:01/mi
      expect(pace).toMatch(/8:0\d/);
    });

    it('computes 5K pace in km', () => {
      const r = config.calculate({
        distanceUnit: 'km',
        distance: '5',
        customDistance: '',
        hours: '0',
        minutes: '25',
        seconds: '0',
        calcMode: 'pace',
        paceMinutes: '',
        paceSeconds: '',
      });
      const pace = getValue(r, 'pace');
      expect(pace).toContain('/km');
      // 25:00 / 5 km = 5:00/km
      expect(pace).toBe('5:00 /km');
    });

    it('computes half marathon pace', () => {
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
      const pace = getValue(r, 'pace');
      expect(pace).toContain('/mi');
      // 1:45:00 / 13.109375 mi ≈ 8:00/mi
      expect(pace).toMatch(/8:0\d/);
    });
  });

  describe('Time mode — calculates finish time from distance and pace', () => {
    it('computes 10K time from 5:00/km pace', () => {
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
      // 10 km × 5:00/km = 50:00
      expect(time).toBe('50:00');
    });

    it('computes marathon time from 9:00/mi pace', () => {
      const r = config.calculate({
        distanceUnit: 'miles',
        distance: 'marathon',
        customDistance: '',
        hours: '',
        minutes: '',
        seconds: '',
        calcMode: 'time',
        paceMinutes: '9',
        paceSeconds: '0',
      });
      const time = getValue(r, 'totalTime');
      // 26.21875 mi × 9:00/mi = 236 min ≈ 3:56:00
      expect(time).toMatch(/3:5\d:\d{2}/);
    });
  });

  describe('Distance mode — calculates distance from time and pace', () => {
    it('computes distance from 1hr at 10:00/mi', () => {
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
      const dist = getValue(r, 'distance');
      expect(dist).toContain('mi');
      // 60 min / 10 min/mi = 6.00 mi
      expect(dist).toBe('6.00 mi');
    });

    it('computes distance from 30min at 6:00/km', () => {
      const r = config.calculate({
        distanceUnit: 'km',
        distance: 'custom',
        customDistance: '',
        hours: '0',
        minutes: '30',
        seconds: '0',
        calcMode: 'distance',
        paceMinutes: '6',
        paceSeconds: '0',
      });
      const dist = getValue(r, 'distance');
      // 30 min / 6 min/km = 5.00 km
      expect(dist).toBe('5.00 km');
    });
  });

  describe('Speed display', () => {
    it('shows speed in both mph and km/h', () => {
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
      const speed = getValue(r, 'speed');
      expect(speed).toContain('mph');
      expect(speed).toContain('km/h');
    });
  });

  describe('Splits', () => {
    it('generates split points for a half marathon', () => {
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

    it('does not generate splits for very short distances', () => {
      const r = config.calculate({
        distanceUnit: 'miles',
        distance: '0.25',
        customDistance: '',
        hours: '0',
        minutes: '1',
        seconds: '30',
        calcMode: 'pace',
        paceMinutes: '',
        paceSeconds: '',
      });
      // 400m is < 1 mi, no splits generated
      const splitResult = r.find((x) => x.id === 'splitCount');
      expect(splitResult).toBeUndefined();
    });
  });

  describe('Edge cases — returns empty array for invalid inputs', () => {
    it('returns empty when time is zero', () => {
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

    it('returns empty when pace is zero in time mode', () => {
      const r = config.calculate({
        distanceUnit: 'km',
        distance: '10',
        customDistance: '',
        hours: '',
        minutes: '',
        seconds: '',
        calcMode: 'time',
        paceMinutes: '0',
        paceSeconds: '0',
      });
      expect(r).toEqual([]);
    });

    it('returns empty when time and pace are zero in distance mode', () => {
      const r = config.calculate({
        distanceUnit: 'miles',
        distance: 'custom',
        customDistance: '',
        hours: '0',
        minutes: '0',
        seconds: '0',
        calcMode: 'distance',
        paceMinutes: '0',
        paceSeconds: '0',
      });
      expect(r).toEqual([]);
    });

    it('returns empty for NaN custom distance', () => {
      const r = config.calculate({
        distanceUnit: 'miles',
        distance: 'custom',
        customDistance: 'abc',
        hours: '1',
        minutes: '0',
        seconds: '0',
        calcMode: 'pace',
        paceMinutes: '',
        paceSeconds: '',
      });
      expect(r).toEqual([]);
    });

    it('returns empty for negative pace seconds', () => {
      const r = config.calculate({
        distanceUnit: 'km',
        distance: '10',
        customDistance: '',
        hours: '',
        minutes: '',
        seconds: '',
        calcMode: 'time',
        paceMinutes: '5',
        paceSeconds: '-10',
      });
      // paceSec < 0 should be caught
      expect(r).toEqual([]);
    });
  });

  describe('Unit handling', () => {
    it('displays miles unit when miles selected', () => {
      const r = config.calculate({
        distanceUnit: 'miles',
        distance: '5',
        customDistance: '',
        hours: '0',
        minutes: '30',
        seconds: '0',
        calcMode: 'pace',
        paceMinutes: '',
        paceSeconds: '',
      });
      expect(getValue(r, 'pace')).toContain('/mi');
      expect(getValue(r, 'distance')).toContain('mi');
    });

    it('displays km unit when km selected', () => {
      const r = config.calculate({
        distanceUnit: 'km',
        distance: '5',
        customDistance: '',
        hours: '0',
        minutes: '25',
        seconds: '0',
        calcMode: 'pace',
        paceMinutes: '',
        paceSeconds: '',
      });
      expect(getValue(r, 'pace')).toContain('/km');
      expect(getValue(r, 'distance')).toContain('km');
    });
  });

  describe('Result structure', () => {
    it('returns pace, totalTime, distance, and speed results', () => {
      const r = config.calculate({
        distanceUnit: 'miles',
        distance: '10',
        customDistance: '',
        hours: '1',
        minutes: '0',
        seconds: '0',
        calcMode: 'pace',
        paceMinutes: '',
        paceSeconds: '',
      });
      const ids = r.map((x) => x.id);
      expect(ids).toContain('pace');
      expect(ids).toContain('totalTime');
      expect(ids).toContain('distance');
      expect(ids).toContain('speed');
    });

    it('highlights the pace result when in pace mode', () => {
      const r = config.calculate({
        distanceUnit: 'miles',
        distance: '5',
        customDistance: '',
        hours: '0',
        minutes: '30',
        seconds: '0',
        calcMode: 'pace',
        paceMinutes: '',
        paceSeconds: '',
      });
      const paceResult = r.find((x) => x.id === 'pace');
      expect(paceResult?.highlight).toBe(true);
    });

    it('highlights the time result when in time mode', () => {
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
      const timeResult = r.find((x) => x.id === 'totalTime');
      expect(timeResult?.highlight).toBe(true);
    });
  });
  // ── Audit regressions (expected values derived by hand, 1 mi = 1.609344 km) ──
  describe('Audit regressions', () => {
    const run = (o: Record<string, string>) =>
      config.calculate({ distanceUnit: 'km', distance: '5', customDistance: '', hours: '0', minutes: '0', seconds: '0', calcMode: 'pace', paceMinutes: '', paceSeconds: '', ...o });

    it('5K preset is 5 KILOMETRES even when the unit is miles: 25:00 = 3.11 mi at 8:03/mi (482.8 s)', () => {
      const r = run({ distanceUnit: 'miles', distance: '5', minutes: '25' });
      expect(getValue(r, 'distance')).toBe('3.11 mi');
      expect(getValue(r, 'pace')).toBe('8:03 /mi');
    });

    it('10K preset in miles = 6.21 mi; in km mode 50:00 = 5:00/km', () => {
      expect(getValue(run({ distanceUnit: 'miles', distance: '10', minutes: '50' }), 'distance')).toBe('6.21 mi');
      expect(getValue(run({ distance: '10', minutes: '50' }), 'pace')).toBe('5:00 /km');
    });

    it('10 mi preset in km mode = 16.09 km: 1:20:00 -> 298.26 s/km = 4:58/km', () => {
      const r = run({ distance: '10_mi', hours: '1', minutes: '20' });
      expect(getValue(r, 'distance')).toBe('16.09 km');
      expect(getValue(r, 'pace')).toBe('4:58 /km');
    });

    it('400 m / 800 m presets are metres in either unit: 1:30 over 400 m = 362.1 s/mi = 6:02/mi', () => {
      const m = run({ distanceUnit: 'miles', distance: '0.4', minutes: '1', seconds: '30' });
      expect(getValue(m, 'distance')).toBe('400 m');
      expect(getValue(m, 'pace')).toBe('6:02 /mi');
      expect(getValue(run({ distance: '0.8', minutes: '3' }), 'distance')).toBe('800 m');
    });

    it('rounds to whole seconds before splitting: 24:59.6 over 5 km is 5:00/km and 25:00 (never 4:60 or 24:60)', () => {
      const r = run({ minutes: '24', seconds: '59.6' });
      expect(getValue(r, 'pace')).toBe('5:00 /km'); // 299.92 s
      expect(getValue(r, 'totalTime')).toBe('25:00');
      const long = run({ distance: 'marathon', hours: '3', minutes: '59', seconds: '59.6' });
      expect(getValue(long, 'totalTime')).toBe('4:00:00');
    });

    it('splits: 10 km in 50:00 gives 1..10 km at 5:00 steps; panel data lives in _splits', () => {
      const splits = JSON.parse(getValue(run({ distance: '10', minutes: '50' }), '_splits'));
      expect(splits.map((s: { d: number }) => s.d)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      expect(splits[0].time).toBe('5:00');
      expect(splits[9].time).toBe('50:00');
    });

    it('marathon in 3:30:00 (298.61 s/km): 5 km split 1493 s = 24:53 and 40 km split 11945 s = 3:19:05, none past 42.2', () => {
      const splits = JSON.parse(getValue(run({ distance: 'marathon', hours: '3', minutes: '30' }), '_splits'));
      expect(splits.map((s: { d: number }) => s.d)).toEqual([5, 10, 15, 20, 25, 30, 35, 40]);
      expect(splits[0].time).toBe('24:53');
      expect(splits[7].time).toBe('3:19:05');
    });

    it('splits never run past a non-integer finish: custom 5.5 km stops at 5 km', () => {
      const splits = JSON.parse(getValue(run({ distance: 'custom', customDistance: '5.5', minutes: '33' }), '_splits'));
      expect(splits.map((s: { d: number }) => s.d)).toEqual([1, 2, 3, 4, 5]);
    });

    it('Riegel example in the text: 22:00 5K -> 1:41:12 half marathon and 3:31:00 marathon', () => {
      const riegel = (km: number) => Math.round(1320 * (km / 5) ** 1.06);
      expect(riegel(21.0975)).toBe(1 * 3600 + 41 * 60 + 12);
      expect(riegel(42.195)).toBe(3 * 3600 + 31 * 60);
      expect(config.educational!.explanation).toContain('1:41 half marathon and a 3:31 marathon');
    });

    it('km <-> mile pace conversions quoted in the FAQ: 8:00/mi = 4:58/km, 5:00/km = 8:03/mi', () => {
      expect(Math.round(480 / 1.609344)).toBe(298); // 4:58
      expect(Math.round(300 * 1.609344)).toBe(483); // 8:03
    });
  });
});
