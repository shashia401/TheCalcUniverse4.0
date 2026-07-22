import { describe, it, expect } from 'vitest';
import stairConfig from '../../../src/calculators/diy/stair/index';
import { getValue } from '../../helpers';

describe('Stair Calculator', () => {
  describe('basic rise/run calculations', () => {
    it('calculates number of steps for 105 inch total rise', () => {
      const results = stairConfig.calculate({
        totalRise: '105',
        targetRiserHeight: '7',
        treadDepth: '11',
      });
      const steps = getValue(results, 'numberOfSteps');
      expect(steps).toContain('15');
    });

    it('calculates actual riser height', () => {
      const results = stairConfig.calculate({
        totalRise: '105',
        targetRiserHeight: '7',
        treadDepth: '11',
      });
      const riser = getValue(results, 'riserHeight');
      expect(riser).toContain('7.00');
    });

    it('calculates stringer length', () => {
      const results = stairConfig.calculate({
        totalRise: '105',
        targetRiserHeight: '7',
        treadDepth: '11',
      });
      const stringer = getValue(results, 'stringerLength');
      expect(stringer).toBeTruthy();
      // sqrt(105^2 + 154^2) = ~186.4 inches
      expect(stringer).toContain('186');
    });

    it('calculates stair angle', () => {
      const results = stairConfig.calculate({
        totalRise: '105',
        targetRiserHeight: '7',
        treadDepth: '11',
      });
      const angle = getValue(results, 'stringerAngle');
      expect(angle).toContain('34');
    });
  });

  describe('IBC compliance', () => {
    it('passes IBC for standard 7/11 stairs', () => {
      const results = stairConfig.calculate({
        totalRise: '105',
        targetRiserHeight: '7',
        treadDepth: '11',
      });
      const ibc = getValue(results, 'ibcStatus');
      expect(ibc).toContain('Passes');
    });

    it('warns when riser exceeds 7.75 inches', () => {
      // 95" total rise with 8" target → ceil(95/8)=12 → 95/12=7.92" (exceeds 7.75)
      const results = stairConfig.calculate({
        totalRise: '95',
        targetRiserHeight: '8',
        treadDepth: '11',
      });
      const ibc = getValue(results, 'ibcStatus');
      expect(ibc).toContain('Warning');
    });

    it('warns when tread is under 10 inches', () => {
      const results = stairConfig.calculate({
        totalRise: '105',
        targetRiserHeight: '7',
        treadDepth: '9',
      });
      const ibc = getValue(results, 'ibcStatus');
      expect(ibc).toContain('Warning');
    });
  });

  describe('comfort check', () => {
    it('shows comfort value for standard stairs', () => {
      const results = stairConfig.calculate({
        totalRise: '105',
        targetRiserHeight: '7',
        treadDepth: '11',
      });
      const comfort = getValue(results, 'comfortCheck');
      expect(comfort).toContain('25');
      expect(comfort).toContain('ideal');
    });
  });

  describe('unit system', () => {
    it('displays feet+inches when unit system is ft', () => {
      const results = stairConfig.calculate({
        totalRise: '105',
        targetRiserHeight: '7',
        treadDepth: '11',
        unitSystem: 'ft',
      });
      const totalRun = getValue(results, 'totalRun');
      // 14 treads × 11" = 154" = 12' 10.00"
      expect(totalRun).toContain("'");
    });

    it('displays inches only when unit system is in', () => {
      const results = stairConfig.calculate({
        totalRise: '105',
        targetRiserHeight: '7',
        treadDepth: '11',
        unitSystem: 'in',
      });
      const totalRun = getValue(results, 'totalRun');
      expect(totalRun).toContain('"');
      expect(totalRun).not.toContain("'");
    });
  });

  describe('input validation', () => {
    it('returns empty array for missing total rise', () => {
      const results = stairConfig.calculate({
        targetRiserHeight: '7',
        treadDepth: '11',
      });
      expect(results).toEqual([]);
    });

    it('returns empty array for zero total rise', () => {
      const results = stairConfig.calculate({
        totalRise: '0',
        targetRiserHeight: '7',
        treadDepth: '11',
      });
      expect(results).toEqual([]);
    });

    it('returns empty array for NaN values', () => {
      const results = stairConfig.calculate({
        totalRise: 'abc',
        targetRiserHeight: '7',
        treadDepth: '11',
      });
      expect(results).toEqual([]);
    });
  });

  describe('educational content', () => {
    it('has formula defined', () => {
      expect(stairConfig.educational.formula).toBeTruthy();
    });

    it('has at least 3 variables', () => {
      expect(stairConfig.educational.variables.length).toBeGreaterThanOrEqual(3);
    });

    it('has 5 or more FAQs', () => {
      expect(stairConfig.educational.faqs.length).toBeGreaterThanOrEqual(5);
    });

    it('has how-to-use instructions', () => {
      expect(stairConfig.educational.howToUse?.length).toBeGreaterThanOrEqual(1);
    });

    it('has explanation', () => {
      expect(stairConfig.educational.explanation).toBeTruthy();
    });
  });
});
