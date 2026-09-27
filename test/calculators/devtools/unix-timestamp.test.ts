import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/devtools/unix-timestamp/index';
import { getValue } from '../../helpers';

describe('Unix Timestamp Converter', () => {
  describe('Timestamp to Date', () => {
    it('converts seconds timestamp to date', () => {
      const r = config.calculate({
        mode: 'ts-to-date',
        timestamp: '1713484800',
        dateInput: '',
      });
      expect(getValue(r, 'localDate')).toBeTruthy();
      expect(getValue(r, 'utcDate')).toContain('2024');
      expect(getValue(r, 'isoString')).toContain('2024');
      expect(getValue(r, 'milliseconds')).toBe('1713484800000');
    });

    it('matches the worked example for timestamp 1715875200 (regression: narrative previously claimed 14:00:00 GMT, actual UTC time is 16:00:00 GMT)', () => {
      const r = config.calculate({
        mode: 'ts-to-date',
        timestamp: '1715875200',
        dateInput: '',
      });
      expect(getValue(r, 'utcDate')).toBe('Thu, 16 May 2024 16:00:00 GMT');
      expect(getValue(r, 'isoString')).toBe('2024-05-16T16:00:00.000Z');
    });

    it('converts epoch zero to date', () => {
      const r = config.calculate({
        mode: 'ts-to-date',
        timestamp: '0',
        dateInput: '',
      });
      expect(getValue(r, 'localDate')).toBeTruthy();
      expect(getValue(r, 'milliseconds')).toBe('0');
    });

    it('detects millisecond timestamps', () => {
      const r = config.calculate({
        mode: 'ts-to-date',
        timestamp: '1713484800000',
        dateInput: '',
      });
      expect(getValue(r, 'milliseconds')).toBe('1713484800000');
      expect(getValue(r, 'isoString')).toContain('2024');
    });

    it('handles future timestamps', () => {
      const r = config.calculate({
        mode: 'ts-to-date',
        timestamp: '1893456000',
        dateInput: '',
      });
      expect(getValue(r, 'localDate')).toBeTruthy();
      expect(getValue(r, 'isoString')).toContain('2030');
    });
  });

  describe('Date to Timestamp', () => {
    it('converts ISO date to timestamp', () => {
      const r = config.calculate({
        mode: 'date-to-ts',
        timestamp: '',
        dateInput: '2024-04-19',
      });
      expect(getValue(r, 'seconds')).toBeTruthy();
      expect(parseInt(getValue(r, 'seconds'), 10)).toBeGreaterThan(0);
      expect(getValue(r, 'ms')).toBeTruthy();
      expect(getValue(r, 'ms')).toBe(
        `${parseInt(getValue(r, 'seconds'), 10) * 1000}`
      );
    });

    it('converts full ISO 8601 string', () => {
      const r = config.calculate({
        mode: 'date-to-ts',
        timestamp: '',
        dateInput: '2024-04-19T12:00:00Z',
      });
      expect(getValue(r, 'seconds')).toBeTruthy();
    });

    it('converts date with time', () => {
      const r = config.calculate({
        mode: 'date-to-ts',
        timestamp: '',
        dateInput: '2024-01-01 00:00:00',
      });
      expect(getValue(r, 'seconds')).toBeTruthy();
    });

    it('matches the worked example for "2026-07-04T12:00:00Z" (regression: narrative previously claimed 1782753600, which is actually 2026-06-29T17:20:00Z, not the requested date)', () => {
      const r = config.calculate({
        mode: 'date-to-ts',
        timestamp: '',
        dateInput: '2026-07-04T12:00:00Z',
      });
      expect(getValue(r, 'seconds')).toBe('1783166400');
      expect(getValue(r, 'ms')).toBe('1783166400000');
    });
  });

  describe('Edge cases and validation', () => {
    it('returns empty array for empty timestamp in ts-to-date mode', () => {
      const r = config.calculate({
        mode: 'ts-to-date',
        timestamp: '',
        dateInput: '',
      });
      expect(r).toEqual([]);
    });

    it('returns empty array for non-numeric timestamp', () => {
      const r = config.calculate({
        mode: 'ts-to-date',
        timestamp: 'abc',
        dateInput: '',
      });
      expect(r).toEqual([]);
    });

    it('returns empty array for empty date input in date-to-ts mode', () => {
      const r = config.calculate({
        mode: 'date-to-ts',
        timestamp: '',
        dateInput: '',
      });
      expect(r).toEqual([]);
    });

    it('returns empty array for invalid date string', () => {
      const r = config.calculate({
        mode: 'date-to-ts',
        timestamp: '',
        dateInput: 'not-a-date',
      });
      expect(r).toEqual([]);
    });

    it('returns empty array for unparseable date format', () => {
      const r = config.calculate({
        mode: 'date-to-ts',
        timestamp: '',
        dateInput: 'foo-bar-baz',
      });
      expect(r).toEqual([]);
    });

    it('handles whitespace-only timestamp', () => {
      const r = config.calculate({
        mode: 'ts-to-date',
        timestamp: '   ',
        dateInput: '',
      });
      expect(r).toEqual([]);
    });
  });

  describe('educational content', () => {
    it('has formula', () => {
      expect(config.educational.formula).toBeTruthy();
    });

    it('has formulaDescription over 100 chars', () => {
      expect(config.educational.formulaDescription!.length).toBeGreaterThan(100);
    });

    it('has 3-5 variables', () => {
      expect(config.educational.variables!.length).toBeGreaterThanOrEqual(3);
      expect(config.educational.variables!.length).toBeLessThanOrEqual(5);
    });

    it('has 3-5 howToUse steps', () => {
      expect(config.educational.howToUse!.length).toBeGreaterThanOrEqual(3);
      expect(config.educational.howToUse!.length).toBeLessThanOrEqual(5);
    });

    it('has 2-4 quickReference items', () => {
      expect(config.educational.quickReference!.length).toBeGreaterThanOrEqual(2);
      expect(config.educational.quickReference!.length).toBeLessThanOrEqual(4);
    });

    it('has 3-5 commonUses items', () => {
      expect(config.educational.commonUses!.length).toBeGreaterThanOrEqual(3);
      expect(config.educational.commonUses!.length).toBeLessThanOrEqual(5);
    });

    it('has explanation over 300 chars', () => {
      expect(config.educational.explanation!.length).toBeGreaterThan(300);
    });

    it('has 2-5 FAQs', () => {
      expect(config.educational.faqs!.length).toBeGreaterThanOrEqual(2);
      expect(config.educational.faqs!.length).toBeLessThanOrEqual(5);
    });

    it('has diagram with svg, alt, and caption', () => {
      expect(config.educational.diagram).toBeDefined();
      expect(config.educational.diagram!.svg).toBeTruthy();
      expect(config.educational.diagram!.alt).toBeTruthy();
      expect(config.educational.diagram!.caption).toBeTruthy();
    });

    it('has 1-2 citations with real URLs', () => {
      const citations = (config.educational as any).citations;
      expect(citations).toBeDefined();
      expect(citations.length).toBeGreaterThanOrEqual(1);
      expect(citations.length).toBeLessThanOrEqual(2);
      for (const c of citations) {
        expect(c.title).toBeTruthy();
        expect(c.url).toMatch(/^https?:\/\//);
      }
    });
  });
});
