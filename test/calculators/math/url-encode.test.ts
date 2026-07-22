import { describe, it, expect } from 'vitest';
import { calculate } from '../../../src/calculators/math/url-encode/index';
import { getValue } from '../../helpers';

describe('URL Encode Calculator', () => {
  describe('encode mode', () => {
    it('encodes space to %20', () => {
      const results = calculate({ inputText: ' ', mode: 'Encode' });
      expect(getValue(results, 'Output')).toBe('%20');
    });

    it('encodes ampersand to %26', () => {
      const results = calculate({ inputText: '&', mode: 'Encode' });
      expect(getValue(results, 'Output')).toBe('%26');
    });

    it('encodes multiple special characters', () => {
      const results = calculate({ inputText: 'hello world & more', mode: 'Encode' });
      expect(getValue(results, 'Output')).toBe('hello%20world%20%26%20more');
    });

    it('encodes hash symbol to %23', () => {
      const results = calculate({ inputText: '#', mode: 'Encode' });
      expect(getValue(results, 'Output')).toBe('%23');
    });

    it('encodes equals sign to %3D', () => {
      const results = calculate({ inputText: '=', mode: 'Encode' });
      expect(getValue(results, 'Output')).toBe('%3D');
    });

    it('does not encode alphanumeric characters', () => {
      const results = calculate({ inputText: 'Hello123', mode: 'Encode' });
      expect(getValue(results, 'Output')).toBe('Hello123');
    });

    it('encodes empty input returns []', () => {
      const results = calculate({ inputText: '', mode: 'Encode' });
      expect(results).toEqual([]);
    });

    it('shows character counts for encode', () => {
      const results = calculate({ inputText: 'a b', mode: 'Encode' });
      expect(getValue(results, 'Original Character Count')).toBe('3');
      expect(getValue(results, 'Encoded Character Count')).toBe('5');
    });

    it('shows mode as Encode in results', () => {
      const results = calculate({ inputText: 'test', mode: 'Encode' });
      expect(getValue(results, 'Mode')).toBe('Encode');
    });
  });

  describe('decode mode', () => {
    it('decodes %20 to space', () => {
      const results = calculate({ inputText: '%20', mode: 'Decode' });
      expect(getValue(results, 'Output')).toBe(' ');
    });

    it('decodes %26 to ampersand', () => {
      const results = calculate({ inputText: '%26', mode: 'Decode' });
      expect(getValue(results, 'Output')).toBe('&');
    });

    it('decodes complex URL-encoded string', () => {
      const results = calculate({ inputText: 'hello%20world%21', mode: 'Decode' });
      expect(getValue(results, 'Output')).toBe('hello world!');
    });

    it('round-trips encode then decode returns original', () => {
      const original = 'a&b=c d#e';
      const encoded = calculate({ inputText: original, mode: 'Encode' });
      const encodedText = getValue(encoded, 'Output');
      const decoded = calculate({ inputText: encodedText, mode: 'Decode' });
      expect(getValue(decoded, 'Output')).toBe(original);
    });

    it('shows mode as Decode in results', () => {
      const results = calculate({ inputText: '%20', mode: 'Decode' });
      expect(getValue(results, 'Mode')).toBe('Decode');
    });
  });

  describe('invalid input handling', () => {
    it('returns error for invalid percent-encoding', () => {
      const results = calculate({ inputText: '%GG', mode: 'Decode' });
      expect(getValue(results, 'Output')).toBe('[Invalid URL Encoding]');
    });

    it('returns error for truncated percent sequence', () => {
      const results = calculate({ inputText: 'test%2', mode: 'Decode' });
      expect(getValue(results, 'Output')).toBe('[Invalid URL Encoding]');
    });

    it('returns error for stray percent sign', () => {
      const results = calculate({ inputText: '%%%', mode: 'Decode' });
      expect(getValue(results, 'Output')).toBe('[Invalid URL Encoding]');
    });

    it('returns [] for empty input in decode mode', () => {
      const results = calculate({ inputText: '', mode: 'Decode' });
      expect(results).toEqual([]);
    });
  });

  describe('edge cases', () => {
    it('returns [] for null inputText', () => {
      const results = calculate({ inputText: null, mode: 'Encode' });
      expect(results).toEqual([]);
    });

    it('returns [] for undefined inputText', () => {
      const results = calculate({ mode: 'Encode' });
      expect(results).toEqual([]);
    });

    it('handles newline characters', () => {
      const results = calculate({ inputText: 'line1\nline2', mode: 'Encode' });
      expect(getValue(results, 'Output')).toBe('line1%0Aline2');
    });

    it('handles very long strings without error', () => {
      const longString = 'a'.repeat(10000);
      const results = calculate({ inputText: longString, mode: 'Encode' });
      // alphanumeric characters are not encoded, so output length == input length
      expect(getValue(results, 'Encoded Character Count')).toBe('10000');
    });

    it('handles unicode characters', () => {
      const results = calculate({ inputText: 'café', mode: 'Encode' });
      expect(getValue(results, 'Output')).toBe('caf%C3%A9');
    });
  });
});
