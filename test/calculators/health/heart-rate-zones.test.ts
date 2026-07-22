import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/health/heart-rate-zones/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Heart Rate Zones calculator', () => {
  it('calculates zones for age 35 using default RHR and Karvonen', () => {
    const r = config.calculate({
      age: '35',
      method: 'karvonen',
    });
    // 220 - 35 = 185 maxHR; default RHR = 60; HRR = 125
    near(parseNumber(getValue(r, 'maxHR')), 185);

    // Zone 1: 50-60% of HRR + RHR => 0.5*125+60=122.5→123, 0.6*125+60=135→135
    expect(getValue(r, 'zone1')).toMatch(/123.*135 bpm/);

    // Zone 2: 60-70% of HRR + RHR => 0.6*125+60=135, 0.7*125+60=147.5→148
    expect(getValue(r, 'zone2')).toMatch(/135.*148 bpm/);

    // Zone 5: 90-100% of HRR + RHR => 0.9*125+60=172.5→173, 1.0*125+60=185
    expect(getValue(r, 'zone5')).toMatch(/173.*185 bpm/);

    expect(r.length).toBeGreaterThan(0);
  });

  it('uses supplied resting HR and shows rhr/hrr results', () => {
    const r = config.calculate({
      age: '40',
      restingHR: '55',
      method: 'karvonen',
    });
    // 220 - 40 = 180 maxHR; RHR = 55; HRR = 125
    near(parseNumber(getValue(r, 'maxHR')), 180);
    expect(getValue(r, 'rhr')).toContain('55');
    expect(getValue(r, 'hrr')).toContain('125');
    // Karvonen formula should be shown
    expect(getValue(r, 'methodUsed')).toContain('Karvonen');

    // Zone 1: 0.5*125+55=117.5→118, 0.6*125+55=130→130
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

    // Zone 1: 0.5*190=95→95, 0.6*190=114→114
    expect(getValue(r, 'zone1')).toMatch(/95.*114 bpm/);

    // Zone 5: 0.9*190=171→171, 1.0*190=190→190
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

  it('returns 10 results when resting HR is provided (extra rhr/hrr)', () => {
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

  it('returns empty for empty inputs', () => {
    expect(config.calculate({})).toHaveLength(0);
  });

  it('returns empty for invalid age', () => {
    expect(config.calculate({ age: '0', method: 'karvonen' })).toHaveLength(0);
    expect(config.calculate({ age: '-5', method: 'karvonen' })).toHaveLength(0);
    expect(config.calculate({ age: 'abc', method: 'karvonen' })).toHaveLength(0);
  });
});
