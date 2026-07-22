import { describe, it, expect } from 'vitest';
import { calculate } from '../../../src/calculators/math/base64/index';
import { getValue } from '../../helpers';

describe('Base64 Calculator', () => {
  describe('encode mode', () => {
    it('encodes simple text to base64', () => {
      const results = calculate({ inputText: 'Hello', mode: 'Encode' });
      expect(getValue(results, 'Output')).toBe('SGVsbG8=');
    });

    it('encodes text with spaces and special characters', () => {
      const results = calculate({ inputText: 'Hello World!', mode: 'Encode' });
      expect(getValue(results, 'Output')).toBe('SGVsbG8gV29ybGQh');
    });

    it('encodes empty input returns []', () => {
      const results = calculate({ inputText: '', mode: 'Encode' });
      expect(results).toEqual([]);
    });

    it('encodes numbers correctly', () => {
      const results = calculate({ inputText: '12345', mode: 'Encode' });
      expect(getValue(results, 'Output')).toBe('MTIzNDU=');
    });

    it('encodes unicode text to base64', () => {
      const results = calculate({ inputText: 'héllo wörld', mode: 'Encode' });
      const expected = btoa('héllo wörld');
      expect(getValue(results, 'Output')).toBe(expected);
    });

    it('shows character counts for encode', () => {
      const results = calculate({ inputText: 'Hello', mode: 'Encode' });
      expect(getValue(results, 'Original Character Count')).toBe('5');
      expect(getValue(results, 'Encoded Character Count')).toBe('8');
    });

    it('shows mode as Encode in results', () => {
      const results = calculate({ inputText: 'test', mode: 'Encode' });
      expect(getValue(results, 'Mode')).toBe('Encode');
    });
  });

  describe('decode mode', () => {
    it('decodes valid base64 to original text', () => {
      const results = calculate({ inputText: 'SGVsbG8=', mode: 'Decode' });
      expect(getValue(results, 'Output')).toBe('Hello');
    });

    it('decodes base64 with special characters', () => {
      const results = calculate({ inputText: 'SGVsbG8gV29ybGQh', mode: 'Decode' });
      expect(getValue(results, 'Output')).toBe('Hello World!');
    });

    it('round-trips encode then decode returns original', () => {
      const original = 'The quick brown fox jumps over the lazy dog.';
      const encoded = calculate({ inputText: original, mode: 'Encode' });
      const encodedText = getValue(encoded, 'Output');
      const decoded = calculate({ inputText: encodedText, mode: 'Decode' });
      expect(getValue(decoded, 'Output')).toBe(original);
    });

    it('shows character counts for decode', () => {
      const results = calculate({ inputText: 'SGVsbG8=', mode: 'Decode' });
      expect(getValue(results, 'Original Character Count')).toBe('8');
      expect(getValue(results, 'Decoded Character Count')).toBe('5');
    });

    it('shows mode as Decode in results', () => {
      const results = calculate({ inputText: 'dGVzdA==', mode: 'Decode' });
      expect(getValue(results, 'Mode')).toBe('Decode');
    });
  });

  describe('invalid input handling', () => {
    it('returns error for invalid base64 during decode', () => {
      const results = calculate({ inputText: 'Not valid base64!!!', mode: 'Decode' });
      expect(getValue(results, 'Output')).toBe('[Invalid Base64]');
    });

    it('returns error for gibberish base64', () => {
      const results = calculate({ inputText: '$$$not-base64$$$', mode: 'Decode' });
      expect(getValue(results, 'Output')).toBe('[Invalid Base64]');
    });

    it('returns error for truncated base64', () => {
      const results = calculate({ inputText: 'SGVsb', mode: 'Decode' });
      expect(getValue(results, 'Output')).toBe('[Invalid Base64]');
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

    it('handles whitespace-only input', () => {
      const results = calculate({ inputText: '   ', mode: 'Encode' });
      expect(results).toEqual([]);
    });

    it('handles single character input', () => {
      const results = calculate({ inputText: 'A', mode: 'Encode' });
      expect(getValue(results, 'Output')).toBe('QQ==');
    });

    it('decodes single character base64', () => {
      const results = calculate({ inputText: 'QQ==', mode: 'Decode' });
      expect(getValue(results, 'Output')).toBe('A');
    });
  });
});
