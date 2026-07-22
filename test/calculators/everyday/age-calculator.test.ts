import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/everyday/age-calculator/index';
import { getValue, parseNumber } from '../../helpers';

describe('Age Calculator', () => {
  it('calculates exact age with default (today) reference date', () => {
    const r = config.calculate({
      birthDate: '2000-01-15',
      toDate: '',
    });
    const age = getValue(r, 'exactAge');
    expect(age).toContain('years');
    expect(age).toContain('months');
    expect(age).toContain('days');
  });

  it('calculates exact age with specific reference date', () => {
    const r = config.calculate({
      birthDate: '1995-03-22',
      toDate: '2025-03-22',
    });
    expect(getValue(r, 'exactAge')).toContain('30 years');
  });

  it('returns total days, weeks, months, and hours', () => {
    const r = config.calculate({
      birthDate: '2020-01-01',
      toDate: '2021-01-01',
    });
    const days = parseNumber(getValue(r, 'totalDays'));
    expect(days).toBeGreaterThan(364);
    const weeks = parseNumber(getValue(r, 'totalWeeks'));
    expect(weeks).toBeGreaterThan(50);
    expect(getValue(r, 'totalMonths')).toBeTruthy();
    expect(getValue(r, 'totalHours')).toBeTruthy();
  });

  it('shows countdown to next birthday', () => {
    const r = config.calculate({
      birthDate: '1995-06-15',
      toDate: '2025-06-10',
    });
    expect(getValue(r, 'nextBirthday')).toContain('days');
  });

  it('handles February 29 leap year birthday', () => {
    const r = config.calculate({
      birthDate: '2000-02-29',
      toDate: '2025-03-01',
    });
    expect(getValue(r, 'exactAge')).toContain('25 years');
  });

  it('returns empty for invalid birth date', () => {
    const r1 = config.calculate({ birthDate: '', toDate: '' });
    expect(r1).toEqual([]);
    const r2 = config.calculate({ birthDate: 'not-a-date', toDate: '' });
    expect(r2).toEqual([]);
  });

  it('returns empty when birth date is after reference date', () => {
    const r = config.calculate({
      birthDate: '2030-01-01',
      toDate: '2020-01-01',
    });
    expect(r).toEqual([]);
  });

  it('returns zodiac sign for a known birth date', () => {
    const r = config.calculate({
      birthDate: '1990-03-15',
      toDate: '2025-01-01',
    });
    const zodiac = getValue(r, 'zodiacSign');
    // March 15 = Pisces
    expect(zodiac).toBe('Pisces');
  });

  it('returns zodiac sign for a December birth date', () => {
    const r = config.calculate({
      birthDate: '1995-12-25',
      toDate: '2025-01-01',
    });
    const zodiac = getValue(r, 'zodiacSign');
    // December 25 = Capricorn
    expect(zodiac).toBe('Capricorn');
  });

  it('returns Chinese zodiac animal', () => {
    const r = config.calculate({
      birthDate: '2000-01-01',
      toDate: '2025-01-01',
    });
    const chineseZodiac = getValue(r, 'chineseZodiac');
    // 2000 = Dragon
    expect(chineseZodiac).toBe('Dragon');
  });

  it('returns birth weekday', () => {
    const r = config.calculate({
      birthDate: '2000-01-01',
      toDate: '2025-01-01',
    });
    const weekday = getValue(r, 'birthWeekday');
    // Jan 1, 2000 was a Saturday
    expect(weekday).toBe('Saturday');
  });

  it('returns 10,000-day milestone date', () => {
    const r = config.calculate({
      birthDate: '1990-01-01',
      toDate: '2017-05-01',
    });
    const day10k = getValue(r, 'day10k');
    expect(day10k).toBeTruthy();
    // 10,000 days from Jan 1, 1990 is approximately May 18, 2017
    expect(day10k).toContain('2017');
  });

  it('returns next decade birthday', () => {
    const r = config.calculate({
      birthDate: '1995-03-15',
      toDate: '2025-01-01',
    });
    const nextDecade = getValue(r, 'nextDecade');
    expect(nextDecade).toBeTruthy();
    expect(nextDecade).toContain('year');
  });

  it('handles birthday on month boundary correctly', () => {
    const r = config.calculate({
      birthDate: '2000-01-31',
      toDate: '2025-03-01',
    });
    expect(getValue(r, 'exactAge')).toContain('25 years');
  });

  it('handles leap year birthday in non-leap target year', () => {
    const r = config.calculate({
      birthDate: '2000-02-29',
      toDate: '2025-02-28',
    });
    const age = getValue(r, 'exactAge');
    expect(age).toContain('24 years');
  });
});
