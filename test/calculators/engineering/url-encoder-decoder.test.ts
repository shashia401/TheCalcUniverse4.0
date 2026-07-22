import { describe, it, expect } from 'vitest';
import { calculate } from '../../../src/calculators/math/url-encode/index';
import { getValue } from '../../helpers';

describe('URL Encoder / Decoder', () => {
  // ── Encode mode ──────────────────────────────────────────────
  describe('encode mode', () => {
    it('encodes space to %20', () => {
      const results = calculate({ inputText: ' ', mode: 'Encode' });
      expect(getValue(results, 'Output')).toBe('%20');
    });

    it('encodes ampersand to %26', () => {
      const results = calculate({ inputText: '&', mode: 'Encode' });
      expect(getValue(results, 'Output')).toBe('%26');
    });

    it('encodes hash to %23', () => {
      const results = calculate({ inputText: '#', mode: 'Encode' });
      expect(getValue(results, 'Output')).toBe('%23');
    });

    it('encodes question mark to %3F', () => {
      const results = calculate({ inputText: '?', mode: 'Encode' });
      expect(getValue(results, 'Output')).toBe('%3F');
    });

    it('encodes equals sign to %3D', () => {
      const results = calculate({ inputText: '=', mode: 'Encode' });
      expect(getValue(results, 'Output')).toBe('%3D');
    });

    it('encodes percent sign to %25', () => {
      const results = calculate({ inputText: '%', mode: 'Encode' });
      expect(getValue(results, 'Output')).toBe('%25');
    });

    it('encodes at sign to %40', () => {
      const results = calculate({ inputText: '@', mode: 'Encode' });
      expect(getValue(results, 'Output')).toBe('%40');
    });

    it('encodes multiple special characters', () => {
      const results = calculate({ inputText: 'hello world & more', mode: 'Encode' });
      expect(getValue(results, 'Output')).toBe('hello%20world%20%26%20more');
    });

    it('does not encode alphanumeric characters', () => {
      const results = calculate({ inputText: 'Hello123', mode: 'Encode' });
      expect(getValue(results, 'Output')).toBe('Hello123');
    });

    it('encodes non-ASCII character (é) to UTF-8 percent encoding', () => {
      const results = calculate({ inputText: 'café', mode: 'Encode' });
      expect(getValue(results, 'Output')).toBe('caf%C3%A9');
    });

    it('encodes emoji to UTF-8 percent encoding', () => {
      const results = calculate({ inputText: 'hello 😀', mode: 'Encode' });
      expect(getValue(results, 'Output')).toBe('hello%20%F0%9F%98%80');
    });

    it('reports correct character counts', () => {
      const results = calculate({ inputText: 'a b', mode: 'Encode' });
      expect(getValue(results, 'Original Character Count')).toBe('3');
      expect(getValue(results, 'Encoded Character Count')).toBe('5');
    });

    it('reports Encode mode in results', () => {
      const results = calculate({ inputText: 'test', mode: 'Encode' });
      expect(getValue(results, 'Mode')).toBe('Encode');
    });

    it('returns [] for empty input in encode mode', () => {
      const results = calculate({ inputText: '', mode: 'Encode' });
      expect(results).toEqual([]);
    });

    it('returns [] for null inputText', () => {
      const results = calculate({ inputText: null, mode: 'Encode' });
      expect(results).toEqual([]);
    });

    it('returns [] for undefined inputText', () => {
      const results = calculate({ mode: 'Encode' });
      expect(results).toEqual([]);
    });
  });

  // ── Decode mode ──────────────────────────────────────────────
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

    it('decodes a full query string', () => {
      const results = calculate({ inputText: 'q%3Dhello%26page%3D1', mode: 'Decode' });
      expect(getValue(results, 'Output')).toBe('q=hello&page=1');
    });

    it('decodes non-ASCII UTF-8 percent encoding', () => {
      const results = calculate({ inputText: 'caf%C3%A9', mode: 'Decode' });
      expect(getValue(results, 'Output')).toBe('café');
    });

    it('reports correct character counts after decoding', () => {
      const results = calculate({ inputText: 'a%20b', mode: 'Decode' });
      expect(getValue(results, 'Original Character Count')).toBe('5');
      expect(getValue(results, 'Decoded Character Count')).toBe('3');
    });

    it('reports Decode mode in results', () => {
      const results = calculate({ inputText: 'test', mode: 'Decode' });
      expect(getValue(results, 'Mode')).toBe('Decode');
    });

    it('returns [] for empty input in decode mode', () => {
      const results = calculate({ inputText: '', mode: 'Decode' });
      expect(results).toEqual([]);
    });
  });

  // ── Invalid input handling ───────────────────────────────────
  describe('invalid input handling', () => {
    it('returns error for invalid percent-encoding (%GG)', () => {
      const results = calculate({ inputText: '%GG', mode: 'Decode' });
      expect(getValue(results, 'Output')).toBe('[Invalid URL Encoding]');
    });

    it('returns error for truncated percent sequence', () => {
      const results = calculate({ inputText: 'test%2', mode: 'Decode' });
      expect(getValue(results, 'Output')).toBe('[Invalid URL Encoding]');
    });

    it('returns error for truncated percent at end of string', () => {
      const results = calculate({ inputText: 'truncated%', mode: 'Decode' });
      expect(getValue(results, 'Output')).toBe('[Invalid URL Encoding]');
    });

    it('returns error for single hex digit', () => {
      const results = calculate({ inputText: 'bad%a', mode: 'Decode' });
      expect(getValue(results, 'Output')).toBe('[Invalid URL Encoding]');
    });
  });

  // ── Round-trip ──────────────────────────────────────────────
  describe('round-trip', () => {
    it('encode then decode recovers original text with ASCII', () => {
      const original = 'a&b=c d#e';
      const encoded = calculate({ inputText: original, mode: 'Encode' });
      const encodedText = getValue(encoded, 'Output');
      const decoded = calculate({ inputText: encodedText, mode: 'Decode' });
      expect(getValue(decoded, 'Output')).toBe(original);
    });

    it('encode then decode recovers original text with special characters', () => {
      const original = 'hello world! @name #tag?key=val';
      const encoded = calculate({ inputText: original, mode: 'Encode' });
      const encodedText = getValue(encoded, 'Output');
      const decoded = calculate({ inputText: encodedText, mode: 'Decode' });
      expect(getValue(decoded, 'Output')).toBe(original);
    });
  });

  // ── Default mode ─────────────────────────────────────────────
  describe('default mode', () => {
    it('defaults to Encode when mode is not specified', () => {
      const results = calculate({ inputText: 'hello world' });
      expect(getValue(results, 'Output')).toBe('hello%20world');
      expect(getValue(results, 'Mode')).toBe('Encode');
    });
  });
});
