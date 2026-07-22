import { describe, it, expect } from 'vitest';
import { calculate } from '../../../src/calculators/math/url-encode/index';
import { getValue } from '../../helpers';

describe('URL Encoder / Decoder', () => {
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

    it('does not encode alphanumeric characters', () => {
      const results = calculate({ inputText: 'Hello123', mode: 'Encode' });
      expect(getValue(results, 'Output')).toBe('Hello123');
    });

    it('returns [] for empty input in encode mode', () => {
      const results = calculate({ inputText: '', mode: 'Encode' });
      expect(results).toEqual([]);
    });

    it('returns [] for null inputText', () => {
      const results = calculate({ inputText: null, mode: 'Encode' });
      expect(results).toEqual([]);
    });

    it('handles unicode characters', () => {
      const results = calculate({ inputText: 'café', mode: 'Encode' });
      expect(getValue(results, 'Output')).toBe('caf%C3%A9');
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

    it('returns [] for empty input in decode mode', () => {
      const results = calculate({ inputText: '', mode: 'Decode' });
      expect(results).toEqual([]);
    });
  });
});
