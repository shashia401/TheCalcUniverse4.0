import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/everyday/moon-phase/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Moon Phase Calculator', () => {
  it('returns New Moon for the known new moon date (2000-01-06)', () => {
    const r = config.calculate({ dateOfBirth: '2000-01-06' });
    expect(getValue(r, 'moonPhase')).toBe('New Moon');
  });

  it('returns illumination ~0% for new moon', () => {
    const r = config.calculate({ dateOfBirth: '2000-01-06' });
    near(parseNumber(getValue(r, 'illumination')), 0, 1);
  });

  it('returns Full Moon near known full moon dates', () => {
    // Known full moon: 2024-06-21 was near a full moon
    const r = config.calculate({ dateOfBirth: '2024-06-21' });
    expect(getValue(r, 'moonPhase')).toBe('Full Moon');
    near(parseNumber(getValue(r, 'illumination')), 100, 1);
  });

  it('returns illumination between 0 and 100 for any date', () => {
    const dates = ['2024-01-15', '2024-06-21', '2024-10-31', '2025-03-14'];
    for (const date of dates) {
      const r = config.calculate({ dateOfBirth: date });
      const illum = parseNumber(getValue(r, 'illumination'));
      expect(illum).toBeGreaterThanOrEqual(0);
      expect(illum).toBeLessThanOrEqual(100);
    }
  });

  it('returns a valid zodiac sign', () => {
    const r = config.calculate({ dateOfBirth: '1990-04-15' });
    expect(getValue(r, 'zodiacSign')).toBe('Aries');
  });

  it('returns correct zodiac sign for various dates', () => {
    expect(getValue(config.calculate({ dateOfBirth: '2024-03-25' }), 'zodiacSign')).toBe('Aries');
    expect(getValue(config.calculate({ dateOfBirth: '2024-07-04' }), 'zodiacSign')).toBe('Cancer');
    expect(getValue(config.calculate({ dateOfBirth: '2024-12-25' }), 'zodiacSign')).toBe('Capricorn');
    expect(getValue(config.calculate({ dateOfBirth: '2024-02-14' }), 'zodiacSign')).toBe('Aquarius');
  });

  it('returns next full moon date', () => {
    const r = config.calculate({ dateOfBirth: '2024-01-06' });
    expect(getValue(r, 'nextFullMoon')).toBeTruthy();
    expect(getValue(r, 'nextFullMoon')).toContain('2024');
  });

  it('returns days until next full moon as a positive number', () => {
    const r = config.calculate({ dateOfBirth: '2024-06-15' });
    const days = parseInt(getValue(r, 'daysUntilNextFull'));
    expect(days).toBeGreaterThan(0);
    expect(days).toBeLessThan(30);
  });

  it('returns phase emoji', () => {
    const r = config.calculate({ dateOfBirth: '2000-01-06' });
    expect(getValue(r, 'phaseEmoji')).toBeTruthy();
  });

  it('returns all required result ids', () => {
    const r = config.calculate({ dateOfBirth: '2024-08-15' });
    expect(getValue(r, 'moonPhase')).toBeTruthy();
    expect(getValue(r, 'illumination')).toBeTruthy();
    expect(getValue(r, 'phaseEmoji')).toBeTruthy();
    expect(getValue(r, 'nextFullMoon')).toBeTruthy();
    expect(getValue(r, 'daysUntilNextFull')).toBeTruthy();
    expect(getValue(r, 'zodiacSign')).toBeTruthy();
  });

  it('returns empty for missing date', () => {
    const r = config.calculate({ dateOfBirth: '' });
    expect(r).toEqual([]);
  });

  it('returns empty for invalid date', () => {
    const r = config.calculate({ dateOfBirth: 'not-a-date' });
    expect(r).toEqual([]);
  });
});
