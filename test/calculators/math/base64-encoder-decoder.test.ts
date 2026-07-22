import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/base64/index';

describe('Base64 Encoder Decoder', () => {
  it('encodes plain text to Base64', () => {
    const results = config.calculate({
      mode: 'Encode',
      inputText: 'Hello World',
    });
    expect(results[0].value).toBe('SGVsbG8gV29ybGQ=');
    expect(results[1].value).toBe('11');
    expect(results[2].value).toBe('16');
    expect(results[3].value).toBe('Encode');
  });

  it('decodes Base64 back to plain text', () => {
    const results = config.calculate({
      mode: 'Decode',
      inputText: 'SGVsbG8gV29ybGQ=',
    });
    expect(results[0].value).toBe('Hello World');
    expect(results[1].value).toBe('16');
    expect(results[2].value).toBe('11');
    expect(results[3].value).toBe('Decode');
  });

  it('returns empty array for empty input', () => {
    const results = config.calculate({
      mode: 'Encode',
      inputText: '',
    });
    expect(results).toEqual([]);
  });

  it('returns empty array for whitespace-only input', () => {
    const results = config.calculate({
      mode: 'Encode',
      inputText: '   ',
    });
    expect(results).toEqual([]);
  });

  it('shows error output for invalid Base64 in decode mode', () => {
    const results = config.calculate({
      mode: 'Decode',
      inputText: '!!!invalid!!!',
    });
    expect(results[0].value).toBe('[Invalid Base64]');
  });

  it('encodes single character', () => {
    const results = config.calculate({
      mode: 'Encode',
      inputText: 'a',
    });
    expect(results[0].value).toBe('YQ==');
    expect(results[2].value).toBe('4'); // 1 char + padding = 4 output
  });

  it('encodes empty string returns empty', () => {
    const results = config.calculate({
      mode: 'Encode',
      inputText: '',
    });
    expect(results).toEqual([]);
  });
});
