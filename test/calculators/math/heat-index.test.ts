import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/heat-index/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Heat Index calculator', () => {
  it('calculates heat index for 90°F at 60% humidity', () => {
    const r = config.calculate({ temperature: '90', humidity: '60' });
    near(parseNumber(getValue(r, 'heatIndex')), 99.7, 0.3);
  });

  it('calculates heat index for 85°F at 70% humidity', () => {
    const r = config.calculate({ temperature: '85', humidity: '70' });
    near(parseNumber(getValue(r, 'heatIndex')), 92.9, 0.3);
  });

  it('calculates heat index for 100°F at 40% humidity', () => {
    const r = config.calculate({ temperature: '100', humidity: '40' });
    near(parseNumber(getValue(r, 'heatIndex')), 109.3, 0.5);
  });

  it('returns temperature when below 80°F (simplified)', () => {
    const r = config.calculate({ temperature: '75', humidity: '80' });
    near(parseNumber(getValue(r, 'heatIndex')), 75);
  });

  it('labels danger tier as "Safe" below 80°F', () => {
    const r = config.calculate({ temperature: '75', humidity: '50' });
    expect(getValue(r, 'dangerTier')).toBe('Safe');
  });

  it('labels danger tier as "Caution" in 80-90°F range', () => {
    const r = config.calculate({ temperature: '85', humidity: '50' });
    expect(getValue(r, 'dangerTier')).toBe('Caution');
  });

  it('labels danger tier as "Extreme Caution" in 90-103°F range', () => {
    // 90°F at 45% gives HI ~ 92°F
    const r = config.calculate({ temperature: '90', humidity: '45' });
    expect(getValue(r, 'dangerTier')).toBe('Extreme Caution');
  });

  it('labels danger tier as "Danger" in 103-124°F range', () => {
    // 95°F at 60% gives HI ~ 113°F
    const r = config.calculate({ temperature: '95', humidity: '60' });
    const hi = parseNumber(getValue(r, 'heatIndex'));
    expect(hi).toBeGreaterThanOrEqual(103);
    expect(hi).toBeLessThan(125);
    expect(getValue(r, 'dangerTier')).toBe('Danger');
  });

  it('labels danger tier as "Extreme Danger" at 125°F+', () => {
    const r = config.calculate({ temperature: '110', humidity: '70' });
    const hi = parseNumber(getValue(r, 'heatIndex'));
    expect(hi).toBeGreaterThanOrEqual(125);
    expect(getValue(r, 'dangerTier')).toBe('Extreme Danger');
  });

  it('includes safety recommendations for Extreme Danger', () => {
    const r = config.calculate({ temperature: '110', humidity: '70' });
    const recs = getValue(r, 'safetyRecommendations');
    expect(recs).toContain('911');
    expect(recs).toContain('heatstroke');
  });

  it('includes safety recommendations for Danger tier', () => {
    // 95°F at 60% gives HI ~ 113°F (Danger range)
    const r = config.calculate({ temperature: '95', humidity: '60' });
    const recs = getValue(r, 'safetyRecommendations');
    expect(recs).toContain('Heat cramps');
    expect(recs).toContain('Heatstroke');
  });

  it('returns empty for missing temperature', () => {
    const r = config.calculate({ temperature: '', humidity: '60' });
    expect(r).toEqual([]);
  });

  it('returns empty for missing humidity', () => {
    const r = config.calculate({ temperature: '90', humidity: '' });
    expect(r).toEqual([]);
  });

  it('returns empty for invalid temperature', () => {
    const r = config.calculate({ temperature: 'abc', humidity: '60' });
    expect(r).toEqual([]);
  });

  it('returns empty for humidity below 0', () => {
    const r = config.calculate({ temperature: '90', humidity: '-5' });
    expect(r).toEqual([]);
  });

  it('returns empty for humidity above 100', () => {
    const r = config.calculate({ temperature: '90', humidity: '110' });
    expect(r).toEqual([]);
  });

  it('outputs chart data', () => {
    const r = config.calculate({ temperature: '90', humidity: '60' });
    const chart = r.find(x => x.id === '_chartData');
    expect(chart).toBeTruthy();
    expect(chart!.value).toContain('heatIndex');
  });
});
