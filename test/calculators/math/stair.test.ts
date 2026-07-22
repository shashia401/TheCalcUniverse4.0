import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/stair/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Stair Calculator', () => {
  describe('Standard calculation (105" rise, 7" target riser, 11" tread)', () => {
    it('calculates correct number of steps', () => {
      const r = config.calculate({
        totalRise: '105',
        targetRiserHeight: '7',
        treadDepth: '11',
        stringerThickness: '1.5',
        unitSystem: 'in',
        includeOverhang: 'yes',
      });
      // 105 / 7 = 15 exactly
      expect(getValue(r, 'numberOfSteps')).toBe('15 steps');
    });

    it('calculates actual riser height', () => {
      const r = config.calculate({
        totalRise: '105',
        targetRiserHeight: '7',
        treadDepth: '11',
        stringerThickness: '1.5',
        unitSystem: 'in',
        includeOverhang: 'yes',
      });
      near(parseNumber(getValue(r, 'riserHeight')), 7.0, 0.01);
    });

    it('calculates total run', () => {
      const r = config.calculate({
        totalRise: '105',
        targetRiserHeight: '7',
        treadDepth: '11',
        stringerThickness: '1.5',
        unitSystem: 'in',
        includeOverhang: 'yes',
      });
      // 14 treads * 11" = 154"
      near(parseNumber(getValue(r, 'totalRun')), 154, 0.01);
    });

    it('calculates stringer length via Pythagorean theorem', () => {
      const r = config.calculate({
        totalRise: '105',
        targetRiserHeight: '7',
        treadDepth: '11',
        stringerThickness: '1.5',
        unitSystem: 'in',
        includeOverhang: 'yes',
      });
      // sqrt(105^2 + 154^2) = sqrt(11025 + 23716) = sqrt(34741) = 186.39
      near(parseNumber(getValue(r, 'stringerLength')), 186.39, 0.1);
    });

    it('calculates stair angle', () => {
      const r = config.calculate({
        totalRise: '105',
        targetRiserHeight: '7',
        treadDepth: '11',
        stringerThickness: '1.5',
        unitSystem: 'in',
        includeOverhang: 'yes',
      });
      // atan(105/154) * 180/pi = atan(0.6818) * 57.296 = 34.3 deg
      near(parseNumber(getValue(r, 'stringerAngle')), 34.3, 0.5);
    });
  });

  describe('IBC compliance checks', () => {
    it('passes IBC with standard dimensions (7" riser, 11" tread)', () => {
      const r = config.calculate({
        totalRise: '105',
        targetRiserHeight: '7',
        treadDepth: '11',
        stringerThickness: '1.5',
        unitSystem: 'in',
        includeOverhang: 'yes',
      });
      expect(getValue(r, 'ibcStatus')).toContain('Passes');
    });

    it('fails IBC when riser is too high (8.5" target)', () => {
      const r = config.calculate({
        totalRise: '110',
        targetRiserHeight: '8.5',
        treadDepth: '11',
        stringerThickness: '1.5',
        unitSystem: 'in',
        includeOverhang: 'yes',
      });
      // 110/8.5 = 12.94 -> ceil -> 13 risers
      // 110/13 = 8.46" actual riser > 7.75 -> fails IBC
      expect(getValue(r, 'ibcStatus')).toContain('Does not meet');
    });

    it('fails IBC when tread is too short (under 10")', () => {
      const r = config.calculate({
        totalRise: '105',
        targetRiserHeight: '7',
        treadDepth: '9',
        stringerThickness: '1.5',
        unitSystem: 'in',
        includeOverhang: 'yes',
      });
      expect(getValue(r, 'ibcStatus')).toContain('Does not meet');
    });
  });

  describe('Changing riser height adjusts step count', () => {
    it('7.5" target gives fewer steps than 6.5" target', () => {
      const r1 = config.calculate({
        totalRise: '105',
        targetRiserHeight: '7.5',
        treadDepth: '11',
        stringerThickness: '1.5',
        unitSystem: 'in',
        includeOverhang: 'yes',
      });
      const r2 = config.calculate({
        totalRise: '105',
        targetRiserHeight: '6.5',
        treadDepth: '11',
        stringerThickness: '1.5',
        unitSystem: 'in',
        includeOverhang: 'yes',
      });
      const steps7_5 = parseInt(getValue(r1, 'numberOfSteps'), 10);
      const steps6_5 = parseInt(getValue(r2, 'numberOfSteps'), 10);
      // 105 / 7.5 = 14 risers, 105 / 6.5 = 16.15 -> ceil -> 17 risers
      expect(steps7_5).toBe(14);
      expect(steps6_5).toBe(17);
    });

    it('actual riser height is always rise / numberOfRisers', () => {
      const r = config.calculate({
        totalRise: '106',
        targetRiserHeight: '7.25',
        treadDepth: '11',
        stringerThickness: '1.5',
        unitSystem: 'in',
        includeOverhang: 'yes',
      });
      // 106/7.25 = 14.62 -> ceil -> 15 risers
      // actual = 106/15 = 7.0667
      near(parseNumber(getValue(r, 'riserHeight')), 7.067, 0.01);
    });
  });

  describe('Validation', () => {
    it('returns empty for missing total rise', () => {
      const r = config.calculate({
        totalRise: '',
        targetRiserHeight: '7',
        treadDepth: '11',
        stringerThickness: '1.5',
        unitSystem: 'in',
        includeOverhang: 'yes',
      });
      expect(r).toEqual([]);
    });

    it('returns empty for zero total rise', () => {
      const r = config.calculate({
        totalRise: '0',
        targetRiserHeight: '7',
        treadDepth: '11',
        stringerThickness: '1.5',
        unitSystem: 'in',
        includeOverhang: 'yes',
      });
      expect(r).toEqual([]);
    });

    it('returns empty for negative tread depth', () => {
      const r = config.calculate({
        totalRise: '105',
        targetRiserHeight: '7',
        treadDepth: '-5',
        stringerThickness: '1.5',
        unitSystem: 'in',
        includeOverhang: 'yes',
      });
      expect(r).toEqual([]);
    });
  });

  describe('Results metadata', () => {
    it('recommends 2x12 lumber', () => {
      const r = config.calculate({
        totalRise: '105',
        targetRiserHeight: '7',
        treadDepth: '11',
        stringerThickness: '1.5',
        unitSystem: 'in',
        includeOverhang: 'yes',
      });
      expect(getValue(r, 'materialRecommendation')).toContain('2x12');
    });

    it('includes stair geometry data as JSON', () => {
      const r = config.calculate({
        totalRise: '105',
        targetRiserHeight: '7',
        treadDepth: '11',
        stringerThickness: '1.5',
        unitSystem: 'in',
        includeOverhang: 'yes',
      });
      const data = JSON.parse(getValue(r, 'stairData'));
      expect(data.numberOfRisers).toBe(15);
      expect(data.numberOfTreads).toBe(14);
      expect(data.ibcCompliant).toBe(true);
    });
  });
});
