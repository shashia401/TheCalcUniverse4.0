import { describe, it, expect } from 'vitest';
import urlEncode from '../../../src/calculators/math/url-encode';
import characterToken from '../../../src/calculators/math/character-token';
import passwordGenerator from '../../../src/calculators/math/password-generator';

// Expected values recomputed independently (Python: urllib, inclusion-exclusion counts) or worked out by hand.
type R = { id: string; value: string }[];
const val = (r: R, id: string) => r.find((x) => x.id === id)?.value;

describe('url-encode audit', () => {
  const enc = (inputText: string) => urlEncode.calculate({ inputText, mode: 'Encode' }) as R;
  const dec = (inputText: string) => urlEncode.calculate({ inputText, mode: 'Decode' }) as R;

  it('encodes reserved characters', () => {
    expect(val(enc('hello world & more/path?x=1#h'), 'Output')).toBe('hello%20world%20%26%20more%2Fpath%3Fx%3D1%23h');
  });

  it('encodes the text exactly as typed: no silent Unicode normalisation', () => {
    expect(val(enc('café'), 'Output')).toBe('caf%C3%A9');
    expect(val(enc('café'), 'Output')).toBe('cafe%CC%81'); // decomposed e + combining accent was rewritten to %C3%A9
  });

  it('counts characters, not UTF-16 units: an emoji is 1', () => {
    const r = enc('\u{1F600}');
    expect(val(r, 'Output')).toBe('%F0%9F%98%80');
    expect(val(r, 'Original Character Count')).toBe('1');
    expect(val(dec('%F0%9F%98%80'), 'Decoded Character Count')).toBe('1');
  });

  it('an unpaired surrogate gives a message instead of throwing', () => {
    expect(() => enc('\uD800')).not.toThrow();
    expect(val(enc('ab\uD800'), 'Output')).toContain('Cannot encode');
  });

  it('decodes, and flags bad input', () => {
    expect(val(dec('caf%C3%A9'), 'Output')).toBe('café');
    expect(val(dec('a+b'), 'Output')).toBe('a+b'); // only %20 means a space here
    expect(val(dec('%E0%A4%A'), 'Output')).toBe('[Invalid URL Encoding]');
    expect(dec('')).toEqual([]);
  });
});

describe('character-token audit', () => {
  const tok = (n: number, tokenizerType = 'general') => characterToken.calculate({ inputText: 'a'.repeat(n), tokenizerType }) as R;

  it('read and generation times no longer double-count minutes or print 60 seconds', () => {
    // 1,920 chars = 480 tokens = 96 s of reading (was "2 min 36 sec") and 9.6 s of generation
    const a = tok(1920);
    expect(val(a, 'estimatedTokens')).toBe('480');
    expect(val(a, 'estimatedReadTime')).toBe('1 min 36 sec');
    expect(val(a, 'estimatedGenTime')).toBe('9.6 seconds');
    // 23,920 chars = 5,980 tokens = 119.6 s of generation (was "1m 60s")
    expect(val(tok(23920), 'estimatedGenTime')).toBe('2m 0s');
    // 120,000 chars = 30,000 tokens = 100 min of reading
    expect(val(tok(120000), 'estimatedReadTime')).toBe('1h 40m');
    expect(val(tok(480), 'estimatedReadTime')).toBe('24 seconds');
  });

  it('per-tokenizer estimates and the cost line', () => {
    expect(val(tok(350, 'claude'), 'estimatedTokens')).toBe('100');
    expect(val(tok(380, 'llama3'), 'estimatedTokens')).toBe('100');
    expect(val(tok(16000), 'estimatedCost')).toBe('$0.0100'); // 4,000 tokens x $2.50 per million
    expect(val(characterToken.calculate({ inputText: 'Hello, world!', tokenizerType: 'openai' }) as R, 'estimatedTokens')).toBe('7');
  });

  it('empty text gives nothing', () => {
    expect(characterToken.calculate({ inputText: '', tokenizerType: 'general' })).toEqual([]);
  });
});

describe('password-generator audit', () => {
  const gen = (o: Record<string, string> = {}) =>
    passwordGenerator.calculate({
      length: '16',
      includeUppercase: 'yes',
      includeLowercase: 'yes',
      includeNumbers: 'yes',
      includeSymbols: 'yes',
      avoidAmbiguous: 'no',
      mode: 'random',
      ...o,
    }) as R;

  it('entropy is the exact log2 of the number of valid passwords, not L x log2(S)', () => {
    expect(val(gen({ length: '4' }), 'entropy')).toBe('22.1 bits'); // was 25.9
    expect(val(gen({ length: '16' }), 'entropy')).toBe('103.4 bits');
    expect(val(gen({ includeUppercase: 'no', includeNumbers: 'no', includeSymbols: 'no' }), 'entropy')).toBe('75.2 bits');
    expect(val(gen({ includeSymbols: 'no', length: '12' }), 'entropy')).toBe('71.3 bits');
    expect(val(gen({ includeUppercase: 'no', includeLowercase: 'no', includeSymbols: 'no', length: '8' }), 'entropy')).toBe('26.6 bits');
  });

  it('every selected type is present, and the length is right', () => {
    for (let i = 0; i < 50; i++) {
      const p = val(gen({ length: '8' }), 'password')!;
      expect(p).toHaveLength(8);
      expect(p).toMatch(/[A-Z]/);
      expect(p).toMatch(/[a-z]/);
      expect(p).toMatch(/[0-9]/);
      expect(p).toMatch(/[^A-Za-z0-9]/);
    }
  });

  it('"avoid ambiguous" really removes O 0 I l 1 and |, including the pipe symbol', () => {
    for (let i = 0; i < 100; i++) {
      expect(val(gen({ avoidAmbiguous: 'yes', length: '64' }), 'password')).not.toMatch(/[O0Il1o|]/);
    }
  });

  it('digits come out evenly (no modulo bias)', () => {
    const counts = new Array(10).fill(0);
    for (let i = 0; i < 200; i++) {
      for (const ch of val(gen({ length: '100', includeUppercase: 'no', includeLowercase: 'no', includeSymbols: 'no' }), 'password')!) counts[Number(ch)]++;
    }
    // 20,000 digits: expect 2,000 each, standard deviation about 42 - allow 5 sigma
    for (const c of counts) expect(Math.abs(c - 2000)).toBeLessThan(215);
  });

  it('length is clamped to 4-128 and must be a whole number', () => {
    expect(val(gen({ length: '2' }), 'length')).toBe('4');
    expect(val(gen({ length: '500' }), 'length')).toBe('128');
    expect(gen({ length: '12abc' })).toEqual([]);
    expect(gen({ length: '12.5' })).toEqual([]);
    expect(gen({ includeUppercase: 'no', includeLowercase: 'no', includeNumbers: 'no', includeSymbols: 'no' })).toEqual([]);
  });

  it('passphrase entropy counts distinct words only: words x log2(list) + log2(1000)', () => {
    const r = gen({ mode: 'passphrase', length: '16' }); // 4 words
    const listSize = Number(val(r, 'charset'));
    expect(listSize).toBeGreaterThan(300);
    const expected = 4 * Math.log2(listSize) + Math.log2(1000);
    expect(Number(val(r, 'entropy')!.replace(' bits', ''))).toBeCloseTo(expected, 1);
    expect(val(r, 'password')).toMatch(/^([A-Z][a-z]+-){3}[A-Z][a-z]+\d{1,3}$/);
    expect(val(gen({ mode: 'passphrase', length: '12' }), 'password')!.split('-')).toHaveLength(3);
    expect(val(gen({ mode: 'passphrase', length: '24' }), 'password')!.split('-')).toHaveLength(6);
  });
});
