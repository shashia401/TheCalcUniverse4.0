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
});
