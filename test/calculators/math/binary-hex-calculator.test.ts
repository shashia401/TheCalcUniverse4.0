import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/binary-hex/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Binary & Hex calculator', () => {
  describe('Convert mode', () => {
    it('converts decimal 42 to binary 101010', () => {
      const r = config.calculate({ mode: 'Convert', fromBase: 'Decimal', toBase: 'Binary', value: '42' });
      expect(getValue(r, 'convertedResult')).toBe('101010');
    });

    it('converts binary 1010 to decimal 10', () => {
      const r = config.calculate({ mode: 'Convert', fromBase: 'Binary', toBase: 'Decimal', value: '1010' });
      expect(getValue(r, 'convertedResult')).toBe('10');
    });

    it('converts hex FF to decimal 255', () => {
      const r = config.calculate({ mode: 'Convert', fromBase: 'Hex', toBase: 'Decimal', value: 'FF' });
      near(parseNumber(getValue(r, 'convertedResult')), 255);
    });

    it('converts octal 17 to decimal 15', () => {
      const r = config.calculate({ mode: 'Convert', fromBase: 'Octal', toBase: 'Decimal', value: '17' });
      near(parseNumber(getValue(r, 'convertedResult')), 15);
    });

    it('shows positional breakdown', () => {
      const r = config.calculate({ mode: 'Convert', fromBase: 'Binary', toBase: 'Decimal', value: '1010' });
      const formula = getValue(r, 'formulaString');
      expect(formula).toContain('×');
      expect(formula).toContain('=');
    });

    it('returns all 4 base representations', () => {
      const r = config.calculate({ mode: 'Convert', fromBase: 'Decimal', toBase: 'Hex', value: '42' });
      expect(getValue(r, 'resultDecimal')).toBe('42');
      expect(getValue(r, 'resultBinary')).toBeTruthy();
      expect(getValue(r, 'resultHex')).toBe('2A');
      expect(getValue(r, 'resultOctal')).toBeTruthy();
    });

    it('returns empty for invalid value in base', () => {
      const r = config.calculate({ mode: 'Convert', fromBase: 'Binary', toBase: 'Decimal', value: '123' });
      expect(r).toEqual([]);
    });

    it('returns empty for empty value string', () => {
      const r = config.calculate({ mode: 'Convert', fromBase: 'Decimal', toBase: 'Binary', value: '' });
      expect(r).toEqual([]);
    });

    it('handles negative decimal to binary conversion', () => {
      const r = config.calculate({ mode: 'Convert', fromBase: 'Decimal', toBase: 'Binary', value: '-5' });
      expect(getValue(r, 'convertedResult')).toBe('-101');
    });

    it('handles hex to binary conversion', () => {
      const r = config.calculate({ mode: 'Convert', fromBase: 'Hex', toBase: 'Binary', value: 'A' });
      expect(getValue(r, 'convertedResult')).toBe('1010');
    });

    it('handles hex with lowercase letters', () => {
      const r = config.calculate({ mode: 'Convert', fromBase: 'Hex', toBase: 'Decimal', value: 'ff' });
      near(parseNumber(getValue(r, 'convertedResult')), 255);
    });

    it('shows signed and unsigned with bit width', () => {
      const r = config.calculate({ mode: 'Convert', fromBase: 'Decimal', toBase: 'Binary', value: '255', bitWidth: '8' });
      expect(getValue(r, 'resultSigned')).toBe('-1');
      expect(getValue(r, 'resultUnsigned')).toBe('255');
    });

    it('handles max 64-bit unsigned value', () => {
      const r = config.calculate({ mode: 'Convert', fromBase: 'Hex', toBase: 'Decimal', value: 'FFFFFFFFFFFFFFFF', bitWidth: '64' });
      expect(getValue(r, 'resultUnsigned')).toBe('18446744073709551615');
    });
  });

  describe('Calculate mode', () => {
    it('adds two binary numbers', () => {
      const r = config.calculate({ mode: 'Calculate', base: 'Binary', operation: 'Add', value1: '1010', value2: '11' });
      expect(getValue(r, 'calcResult')).toBe('1101');
    });

    it('subtracts two decimal numbers', () => {
      const r = config.calculate({ mode: 'Calculate', base: 'Decimal', operation: 'Subtract', value1: '10', value2: '3' });
      expect(getValue(r, 'calcResult')).toBe('7');
    });

    it('multiplies two decimal numbers', () => {
      const r = config.calculate({ mode: 'Calculate', base: 'Decimal', operation: 'Multiply', value1: '6', value2: '7' });
      near(parseNumber(getValue(r, 'calcResult')), 42);
    });

    it('divides two decimal numbers (integer division)', () => {
      const r = config.calculate({ mode: 'Calculate', base: 'Decimal', operation: 'Divide', value1: '15', value2: '4' });
      near(parseNumber(getValue(r, 'calcResult')), 3);
    });

    it('performs AND operation', () => {
      const r = config.calculate({ mode: 'Calculate', base: 'Binary', operation: 'AND', value1: '1100', value2: '1010' });
      expect(getValue(r, 'calcResult')).toBe('1000');
    });

    it('performs OR operation', () => {
      const r = config.calculate({ mode: 'Calculate', base: 'Binary', operation: 'OR', value1: '1100', value2: '1010' });
      expect(getValue(r, 'calcResult')).toBe('1110');
    });

    it('performs XOR operation', () => {
      const r = config.calculate({ mode: 'Calculate', base: 'Binary', operation: 'XOR', value1: '1100', value2: '1010' });
      expect(getValue(r, 'calcResult')).toBe('110');
    });

    it('performs NOT operation', () => {
      const r = config.calculate({ mode: 'Calculate', base: 'Decimal', operation: 'NOT', value1: '0' });
      expect(getValue(r, 'calcResult')).toBe('-1');
    });

    it('performs left shift', () => {
      const r = config.calculate({ mode: 'Calculate', base: 'Decimal', operation: 'Left Shift', value1: '3', value2: '2' });
      near(parseNumber(getValue(r, 'calcResult')), 12);
    });

    it('performs right shift', () => {
      const r = config.calculate({ mode: 'Calculate', base: 'Decimal', operation: 'Right Shift', value1: '16', value2: '2' });
      near(parseNumber(getValue(r, 'calcResult')), 4);
    });

    it('shows step detail', () => {
      const r = config.calculate({ mode: 'Calculate', base: 'Binary', operation: 'Add', value1: '1', value2: '1' });
      expect(getValue(r, 'stepDetail')).toBeTruthy();
    });

    it('shows result in all bases', () => {
      const r = config.calculate({ mode: 'Calculate', base: 'Decimal', operation: 'Add', value1: '5', value2: '3' });
      expect(getValue(r, 'resultDecimal')).toBe('8');
      expect(getValue(r, 'resultBinary')).toBe('1000');
      expect(getValue(r, 'resultHex')).toBe('8');
    });

    it('returns empty for NaN input', () => {
      const r = config.calculate({ mode: 'Calculate', base: 'Decimal', operation: 'Add', value1: 'abc', value2: '3' });
      expect(r).toEqual([]);
    });

    it('returns empty for empty first operand', () => {
      const r = config.calculate({ mode: 'Calculate', base: 'Decimal', operation: 'Add', value1: '', value2: '3' });
      expect(r).toEqual([]);
    });

    it('returns empty for empty second operand', () => {
      const r = config.calculate({ mode: 'Calculate', base: 'Decimal', operation: 'Add', value1: '5', value2: '' });
      expect(r).toEqual([]);
    });

    it('returns empty for invalid hex value', () => {
      const r = config.calculate({ mode: 'Calculate', base: 'Hex', operation: 'Add', value1: 'GG', value2: '1' });
      expect(r).toEqual([]);
    });

    it('returns empty for invalid base digits in binary', () => {
      const r = config.calculate({ mode: 'Calculate', base: 'Binary', operation: 'Add', value1: '102', value2: '1' });
      expect(r).toEqual([]);
    });

    it('handles hex arithmetic', () => {
      const r = config.calculate({ mode: 'Calculate', base: 'Hex', operation: 'Add', value1: 'A', value2: '5' });
      expect(getValue(r, 'calcResult')).toBe('F');
    });

    it('shows overflow flag for 8-bit signed overflow', () => {
      const r = config.calculate({ mode: 'Calculate', base: 'Decimal', operation: 'Add', value1: '127', value2: '1', bitWidth: '8' });
      const flags = getValue(r, 'flags');
      expect(flags).toContain('Signed overflow');
    });

    it('shows carry flag for 8-bit unsigned overflow', () => {
      const r = config.calculate({ mode: 'Calculate', base: 'Decimal', operation: 'Add', value1: '255', value2: '1', bitWidth: '8' });
      const flags = getValue(r, 'flags');
      expect(flags).toContain('Carry');
    });

    it('performs AND in 8-bit showing signed/unsigned', () => {
      const r = config.calculate({ mode: 'Calculate', base: 'Hex', operation: 'AND', value1: 'FF', value2: '0F', bitWidth: '8' });
      expect(getValue(r, 'calcResult')).toBe('F');
      expect(getValue(r, 'unsignedDecimal')).toBe('15');
    });

    it('handles division by zero gracefully', () => {
      const r = config.calculate({ mode: 'Calculate', base: 'Decimal', operation: 'Divide', value1: '10', value2: '0' });
      expect(r).toEqual([]);
    });
  });

  describe('Educational content', () => {
    it('has formula text', () => {
      expect(config.educational?.formula).toBeTruthy();
      expect(config.educational?.formula?.length).toBeGreaterThan(10);
    });

    it('has formula description', () => {
      expect(config.educational?.formulaDescription).toBeTruthy();
      expect(config.educational?.formulaDescription?.length).toBeGreaterThan(50);
    });

    it('has variables defined', () => {
      expect(config.educational?.variables?.length).toBeGreaterThanOrEqual(3);
    });

    it('has explanation text', () => {
      expect(config.educational?.explanation).toBeTruthy();
      expect(config.educational?.explanation?.length).toBeGreaterThan(100);
    });

    it('has how-to-use steps', () => {
      expect(config.educational?.howToUse?.length).toBeGreaterThanOrEqual(3);
    });

    it('has FAQs', () => {
      expect(config.educational?.faqs?.length).toBeGreaterThanOrEqual(5);
    });

    it('has worked examples', () => {
      expect(config.educational?.workedExamples?.length).toBeGreaterThanOrEqual(2);
    });

    it('has pro tips', () => {
      expect(config.educational?.proTips?.length).toBeGreaterThanOrEqual(3);
    });

    it('has limitations', () => {
      expect(config.educational?.limitations?.length).toBeGreaterThanOrEqual(2);
    });

    it('has citations', () => {
      expect(config.educational?.citations?.length).toBeGreaterThanOrEqual(1);
    });

    it('has extra panel', () => {
      expect(typeof config.extraPanel).toBe('function');
    });

    it('extraPanel returns component for valid results', () => {
      const results = config.calculate({ mode: 'Convert', fromBase: 'Decimal', toBase: 'Binary', value: '42' });
      const panel = config.extraPanel!({ mode: 'Convert', fromBase: 'Decimal', toBase: 'Binary', value: '42' }, results);
      expect(panel).not.toBeNull();
    });

    it('extraPanel returns null for empty results', () => {
      const panel = config.extraPanel!({ mode: 'Convert', fromBase: 'Decimal', toBase: 'Binary', value: '42' }, []);
      expect(panel).toBeNull();
    });
  });

  describe('Calculator metadata', () => {
    it('has inputs defined', () => {
      expect(config.inputs.length).toBeGreaterThanOrEqual(5);
    });

    it('input mode field has helpText', () => {
      const modeInput = config.inputs.find(i => i.id === 'mode');
      expect(modeInput?.helpText).toBeTruthy();
    });

    it('value input has inputMode set', () => {
      const valInput = config.inputs.find(i => i.id === 'value');
      expect(valInput?.inputMode).toBe('text');
    });
  });
});
