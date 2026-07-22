import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/base-converter/index';
import { getValue, parseNumber } from '../../helpers';

describe('Number Base Converter', () => {
  describe('Basic conversions', () => {
    it('converts decimal 42 to binary', () => {
      const r = config.calculate({ input: '42', fromBase: '10', toBase: '2' });
      expect(getValue(r, 'result')).toBe('101010');
    });

    it('converts binary 101010 to decimal', () => {
      const r = config.calculate({ input: '101010', fromBase: '2', toBase: '10' });
      expect(getValue(r, 'result')).toBe('42');
    });

    it('converts hex FF to decimal', () => {
      const r = config.calculate({ input: 'FF', fromBase: '16', toBase: '10' });
      expect(getValue(r, 'result')).toBe('255');
    });

    it('converts decimal 255 to hex', () => {
      const r = config.calculate({ input: '255', fromBase: '10', toBase: '16' });
      expect(getValue(r, 'result')).toBe('FF');
    });

    it('converts octal 17 to decimal', () => {
      const r = config.calculate({ input: '17', fromBase: '8', toBase: '10' });
      expect(getValue(r, 'result')).toBe('15');
    });

    it('converts decimal 15 to octal', () => {
      const r = config.calculate({ input: '15', fromBase: '10', toBase: '8' });
      expect(getValue(r, 'result')).toBe('17');
    });
  });

  describe('Base 36 conversions', () => {
    it('converts base-36 Z to decimal 35', () => {
      const r = config.calculate({ input: 'Z', fromBase: '36', toBase: '10' });
      expect(getValue(r, 'result')).toBe('35');
    });

    it('converts decimal 35 to base-36', () => {
      const r = config.calculate({ input: '35', fromBase: '10', toBase: '36' });
      expect(getValue(r, 'result')).toBe('Z');
    });

    it('converts base-36 HELLO to decimal', () => {
      const r = config.calculate({ input: 'HELLO', fromBase: '36', toBase: '10' });
      // H=17, E=14, L=21, L=21, O=24
      // 17*36^4 + 14*36^3 + 21*36^2 + 21*36^1 + 24*36^0
      const expected = 17 * Math.pow(36, 4) + 14 * Math.pow(36, 3) + 21 * Math.pow(36, 2) + 21 * 36 + 24;
      expect(parseInt(getValue(r, 'result'), 10)).toBe(expected);
    });
  });

  describe('Intermediate decimal value', () => {
    it('shows decimal value for hex to binary conversion', () => {
      const r = config.calculate({ input: 'FF', fromBase: '16', toBase: '2' });
      expect(getValue(r, 'decimalValue')).toBe('255');
    });

    it('shows decimal value for octal to hex conversion', () => {
      const r = config.calculate({ input: '777', fromBase: '8', toBase: '16' });
      expect(getValue(r, 'decimalValue')).toBe('511');
    });
  });

  describe('Input validation', () => {
    it('shows validation success for valid input', () => {
      const r = config.calculate({ input: '1010', fromBase: '2', toBase: '10' });
      expect(getValue(r, 'originalValid')).toContain('valid');
    });

    it('returns empty for invalid binary digit', () => {
      const r = config.calculate({ input: '123', fromBase: '2', toBase: '10' });
      expect(r).toEqual([]);
    });

    it('returns empty for invalid hex digit', () => {
      const r = config.calculate({ input: 'GG', fromBase: '16', toBase: '10' });
      expect(r).toEqual([]);
    });

    it('returns empty for digit out of base range (base 10)', () => {
      const r = config.calculate({ input: 'ABC', fromBase: '10', toBase: '2' });
      expect(r).toEqual([]);
    });
  });

  describe('Digit count (length)', () => {
    it('shows length=8 for decimal 255 converted to binary', () => {
      const r = config.calculate({ input: '255', fromBase: '10', toBase: '2' });
      expect(getValue(r, 'length')).toBe('8');
    });

    it('shows length=2 for decimal 255 converted to hex', () => {
      const r = config.calculate({ input: '255', fromBase: '10', toBase: '16' });
      expect(getValue(r, 'length')).toBe('2');
    });

    it('shows length=1 for zero', () => {
      const r = config.calculate({ input: '0', fromBase: '10', toBase: '2' });
      expect(getValue(r, 'result')).toBe('0');
      expect(getValue(r, 'length')).toBe('1');
    });
  });

  describe('Edge cases', () => {
    it('returns empty for empty input', () => {
      expect(config.calculate({})).toEqual([]);
    });

    it('returns empty for empty input string', () => {
      expect(config.calculate({ input: '', fromBase: '10', toBase: '2' })).toEqual([]);
    });

    it('returns empty for NaN fromBase', () => {
      expect(config.calculate({ input: '42', fromBase: 'abc', toBase: '2' })).toEqual([]);
    });

    it('returns empty for NaN toBase', () => {
      expect(config.calculate({ input: '42', fromBase: '10', toBase: 'xyz' })).toEqual([]);
    });

    it('returns empty for fromBase below minimum 2', () => {
      expect(config.calculate({ input: '1', fromBase: '1', toBase: '10' })).toEqual([]);
    });

    it('returns empty for fromBase above maximum 36', () => {
      expect(config.calculate({ input: '1', fromBase: '37', toBase: '10' })).toEqual([]);
    });

    it('returns empty for toBase below minimum 2', () => {
      expect(config.calculate({ input: '1', fromBase: '10', toBase: '1' })).toEqual([]);
    });

    it('returns empty for toBase above maximum 36', () => {
      expect(config.calculate({ input: '1', fromBase: '10', toBase: '37' })).toEqual([]);
    });
  });

  describe('Various bases', () => {
    it('converts base 3 to base 10', () => {
      const r = config.calculate({ input: '210', fromBase: '3', toBase: '10' });
      // 2*9 + 1*3 + 0 = 18 + 3 = 21
      expect(getValue(r, 'result')).toBe('21');
    });

    it('converts base 10 to base 5', () => {
      const r = config.calculate({ input: '42', fromBase: '10', toBase: '5' });
      // 42 in base 5 = 132 (1*25 + 3*5 + 2 = 25 + 15 + 2 = 42)
      expect(getValue(r, 'result')).toBe('132');
    });

    it('converts base 12 to base 10', () => {
      const r = config.calculate({ input: 'A0', fromBase: '12', toBase: '10' });
      // A=10, so 10*12 + 0 = 120
      expect(getValue(r, 'result')).toBe('120');
    });

    it('converts base 10 to base 20', () => {
      const r = config.calculate({ input: '399', fromBase: '10', toBase: '20' });
      // 399 in base 20 = JJ (19*20 + 19 = 380 + 19 = 399)
      expect(getValue(r, 'result')).toBe('JJ');
    });

    it('handles lowercase hex input', () => {
      const r = config.calculate({ input: 'ff', fromBase: '16', toBase: '10' });
      expect(getValue(r, 'result')).toBe('255');
    });
  });
});
