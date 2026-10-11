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

  // ── Audit regressions (expected values hand-derived: Fox maxHR = 220 - age; Karvonen = HRR * p + RHR) ──
  it('James 35 / RHR 62 Karvonen: maxHR 185, HRR 123, Zone 2 = 135.8-148.1 -> 136-148', () => {
    const r = config.calculate({ age: '35', restingHR: '62', method: 'karvonen' });
    expect(getValue(r, 'hrr')).toBe('123 bpm');
    expect(getValue(r, 'zone2')).toMatch(/^136–148 bpm/);
    // 80/20 band = Zone 1 low (0.5*123+62 = 123.5 -> 124) to Zone 2 high (148)
    expect(getValue(r, 'eightTwenty')).toContain('124–148 bpm');
  });

  it('Maria 42 / RHR 48: %Max HR Zone 2 = 106.8-124.6 -> 107-125; Karvonen Zone 2 = 126-139', () => {
    const pct = config.calculate({ age: '42', restingHR: '48', method: 'maxpct' });
    expect(getValue(pct, 'zone2')).toMatch(/^107–125 bpm/);
    // %Max 80/20 band must not add RHR: 0.5*178 = 89 to 0.7*178 = 124.6 -> 125
    expect(getValue(pct, 'eightTwenty')).toContain('89–125 bpm');
    const kar = config.calculate({ age: '42', restingHR: '48', method: 'karvonen' });
    expect(getValue(kar, 'zone2')).toMatch(/^126–139 bpm/);
  });

  it('Tom 28 / RHR 65: zones 141-154, 154-167, 167-179, 179-192 (HRR 127)', () => {
    const r = config.calculate({ age: '28', restingHR: '65', method: 'karvonen' });
    expect(getValue(r, 'zone2')).toMatch(/^141–154 bpm/);
    expect(getValue(r, 'zone3')).toMatch(/^154–167 bpm/);
    expect(getValue(r, 'zone4')).toMatch(/^167–179 bpm/);
    expect(getValue(r, 'zone5')).toMatch(/^179–192 bpm/);
  });

  it('Karvonen without a resting HR states the assumed 60 bpm instead of hiding it', () => {
    const r = config.calculate({ age: '35', method: 'karvonen' });
    expect(getValue(r, 'methodUsed')).toContain('assumed RHR 60');
    expect(r.find((x) => x.id === 'maxHR')!.interpretation).toContain('assume a resting rate of 60');
  });

  it('resting HR at or above estimated max HR is rejected (HRR would be <= 0)', () => {
    expect(config.calculate({ age: '100', restingHR: '120', method: 'karvonen' })).toEqual([]);
    const ok = config.calculate({ age: '100', restingHR: '100', method: 'karvonen' });
    expect(getValue(ok, 'hrr')).toBe('20 bpm'); // 120 - 100
  });
});
