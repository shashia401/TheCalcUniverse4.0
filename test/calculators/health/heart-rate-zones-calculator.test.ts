import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/health/heart-rate-zones/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Heart Rate Zones Calculator', () => {
  it('calculates zones for age 35 using Karvonen with default resting HR', () => {
    const r = config.calculate({
      age: '35',
      method: 'karvonen',
    });
    // 220 - 35 = 185 maxHR; default RHR = 60; HRR = 125
    near(parseNumber(getValue(r, 'maxHR')), 185);

    // Zone 1: 50-60% of HRR + RHR => 0.5*125+60=122.5→123, 0.6*125+60=135
    expect(getValue(r, 'zone1')).toMatch(/123.*135 bpm/);
    // Zone 2: 60-70% of HRR + RHR => 0.6*125+60=135, 0.7*125+60=147.5→148
    expect(getValue(r, 'zone2')).toMatch(/135.*148 bpm/);
    // Zone 5: 90-100% of HRR + RHR => 0.9*125+60=172.5→173, 1.0*125+60=185
    expect(getValue(r, 'zone5')).toMatch(/173.*185 bpm/);

    expect(r.length).toBeGreaterThan(0);
  });

  it('uses supplied resting HR and shows rhr/hrr results with Karvonen', () => {
    const r = config.calculate({
      age: '40',
      restingHR: '55',
      method: 'karvonen',
    });
    // 220 - 40 = 180 maxHR; RHR = 55; HRR = 125
    near(parseNumber(getValue(r, 'maxHR')), 180);
    expect(getValue(r, 'rhr')).toContain('55');
    expect(getValue(r, 'hrr')).toContain('125');
    expect(getValue(r, 'methodUsed')).toContain('Karvonen');

    // Zone 1: 0.5*125+55=117.5→118, 0.6*125+55=130
    expect(getValue(r, 'zone1')).toMatch(/118.*130 bpm/);
  });

  it('calculates zones using % Max HR method', () => {
    const r = config.calculate({
      age: '30',
      method: 'maxpct',
    });
    // 220 - 30 = 190 maxHR
    near(parseNumber(getValue(r, 'maxHR')), 190);
    expect(getValue(r, 'methodUsed')).toContain('Max HR');

    // Zone 1: 0.5*190=95, 0.6*190=114
    expect(getValue(r, 'zone1')).toMatch(/95.*114 bpm/);
    // Zone 5: 0.9*190=171, 1.0*190=190
    expect(getValue(r, 'zone5')).toMatch(/171.*190 bpm/);
  });

  it('outputs all 5 zones plus summary results', () => {
    const r = config.calculate({
      age: '25',
      method: 'karvonen',
    });
    // maxHR + methodUsed + 5 zones + eightTwenty = 8 (no rhr/hrr since no restingHR)
    expect(r).toHaveLength(8);
    expect(getValue(r, 'zone1')).toBeTruthy();
    expect(getValue(r, 'zone2')).toBeTruthy();
    expect(getValue(r, 'zone3')).toBeTruthy();
    expect(getValue(r, 'zone4')).toBeTruthy();
    expect(getValue(r, 'zone5')).toBeTruthy();
    expect(getValue(r, 'eightTwenty')).toContain('80%');
  });

  it('returns 10 results when resting HR is provided', () => {
    const r = config.calculate({
      age: '45',
      restingHR: '65',
      method: 'maxpct',
    });
    // maxHR + rhr + hrr + methodUsed + 5 zones + eightTwenty = 10
    expect(r).toHaveLength(10);
    expect(getValue(r, 'rhr')).toContain('65');
    expect(getValue(r, 'hrr')).toContain('110');
  });

  it('returns empty for empty inputs (edge case guard)', () => {
    expect(config.calculate({})).toHaveLength(0);
  });

  it('returns empty for invalid age values (NaN guard)', () => {
    expect(config.calculate({ age: '0', method: 'karvonen' })).toHaveLength(0);
    expect(config.calculate({ age: '-5', method: 'karvonen' })).toHaveLength(0);
    expect(config.calculate({ age: 'abc', method: 'karvonen' })).toHaveLength(0);
  });

  it('handles missing method gracefully (defaults to karvonen)', () => {
    const r = config.calculate({ age: '35' });
    // Without method, defaults to karvonen
    near(parseNumber(getValue(r, 'maxHR')), 185);
    expect(getValue(r, 'methodUsed')).toContain('Karvonen');
    expect(r.length).toBeGreaterThan(0);
  });

  it('handles very young age (10 years old)', () => {
    const r = config.calculate({
      age: '10',
      method: 'karvonen',
    });
    // 220 - 10 = 210 maxHR
    near(parseNumber(getValue(r, 'maxHR')), 210);
    expect(getValue(r, 'zone1')).toBeTruthy();
  });

  it('handles very old age (100 years old)', () => {
    const r = config.calculate({
      age: '100',
      method: 'maxpct',
    });
    // 220 - 100 = 120 maxHR
    near(parseNumber(getValue(r, 'maxHR')), 120);
    expect(getValue(r, 'zone5')).toBeTruthy();
  });

  it('Karvonen zones are higher than %MaxHR zones for fit individuals', () => {
    const rKarvonen = config.calculate({
      age: '30',
      restingHR: '50',
      method: 'karvonen',
    });
    const rMaxPct = config.calculate({
      age: '30',
      method: 'maxpct',
    });

    // Parse Zone 2 low values from both methods
    const z2Karvonen = parseInt(getValue(rKarvonen, 'zone2').split('–')[0]);
    const z2MaxPct = parseInt(getValue(rMaxPct, 'zone2').split('–')[0]);

    // Karvonen should be higher for someone with low resting HR
    expect(z2Karvonen).toBeGreaterThan(z2MaxPct);
  });

  it('educational content exists and has required sections', () => {
    expect(config.educational).toBeDefined();
    expect(config.educational!.explanation.length).toBeGreaterThan(100);
    expect(config.educational!.faqs.length).toBeGreaterThanOrEqual(7);
    expect(config.educational!.variables.length).toBeGreaterThanOrEqual(3);
    expect(config.educational!.howToUse.length).toBeGreaterThanOrEqual(3);
    expect(config.educational!.commonUses.length).toBeGreaterThanOrEqual(2);
    expect(config.educational!.citations.length).toBeGreaterThanOrEqual(2);
  });

  it('has worked examples, pro tips, limitations, and quick reference', () => {
    expect(config.educational!.workedExamples).toBeDefined();
    expect(config.educational!.workedExamples!.length).toBeGreaterThanOrEqual(3);
    expect(config.educational!.proTips).toBeDefined();
    expect(config.educational!.proTips!.length).toBeGreaterThanOrEqual(4);
    expect(config.educational!.limitations).toBeDefined();
    expect(config.educational!.limitations!.length).toBeGreaterThanOrEqual(1);
    expect(config.educational!.quickReference).toBeDefined();
    expect(config.educational!.quickReference!.length).toBeGreaterThanOrEqual(5);
  });
});
