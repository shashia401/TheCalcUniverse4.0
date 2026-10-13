import { describe, it, expect } from 'vitest';
import { calculate } from '../../../src/calculators/math/base64/index';
import { base64ToBytes, bytesToBase64, bytesToText } from '../../../src/calculators/math/base64/base64Codec';
import { getValue } from '../../helpers';

// Reference values: Python base64.b64encode / urlsafe_b64encode on the UTF-8 bytes.
const enc = (inputText: string, variant = 'standard') => getValue(calculate({ inputText, mode: 'Encode', variant }), 'Output');
const dec = (inputText: string) => calculate({ inputText, mode: 'Decode' });

describe('base64: UTF-8 and RFC 4648 (audit)', () => {
  it('encodes non-Latin-1 text (btoa throws InvalidCharacterError on these)', () => {
    expect(enc('😀 hi')).toBe('8J+YgCBoaQ==');
    expect(enc('日本語')).toBe('5pel5pys6Kqe');
    expect(enc('héllo wörld')).toBe('aMOpbGxvIHfDtnJsZA==');
  });
  it('decodes UTF-8 bytes back to text (atob returned the mojibake "Ã©")', () => {
    expect(getValue(dec('aMOpbGxvIHfDtnJsZA=='), 'Output')).toBe('héllo wörld');
    expect(getValue(dec('8J+YgCBoaQ=='), 'Output')).toBe('😀 hi');
    expect(getValue(dec('8J+YgCBoaQ=='), 'Decoded Character Count')).toBe('4'); // code points, not UTF-16 units
    expect(getValue(dec('8J+YgCBoaQ=='), 'Decoded Byte Count')).toBe('7');
  });
  it('padding for 1, 2, 3 byte tails (RFC 4648 §10: f -> Zg==, fo -> Zm8=, foo -> Zm9v)', () => {
    expect(enc('f')).toBe('Zg==');
    expect(enc('fo')).toBe('Zm8=');
    expect(enc('foo')).toBe('Zm9v');
    expect(enc('foobar')).toBe('Zm9vYmFy');
    expect(enc('A')).toBe('QQ==');
    expect(enc('AB')).toBe('QUI=');
  });
  it('URL-safe variants use - and _ and may drop the padding', () => {
    expect(enc('😀 hi', 'url')).toBe('8J-YgCBoaQ==');
    expect(enc('😀 hi', 'urlnopad')).toBe('8J-YgCBoaQ');
    expect(bytesToBase64(Uint8Array.from([0xfb, 0xff, 0xfe]), 'standard')).toBe('+//+');
    expect(bytesToBase64(Uint8Array.from([0xfb, 0xff, 0xfe]), 'url')).toBe('-__-');
  });
  it('decoding accepts both alphabets, missing padding and MIME line breaks', () => {
    expect(getValue(dec('8J-YgCBoaQ'), 'Output')).toBe('😀 hi');
    expect(getValue(dec('8J+Y\ngCBo\r\naQ=='), 'Output')).toBe('😀 hi');
    expect(getValue(dec('Zm9v YmFy'), 'Output')).toBe('foobar');
  });
  it('rejects malformed input with a reason', () => {
    for (const bad of ['SGVsb', 'Zg=a', '=Zg=', 'Zg===', 'Z', 'Zm9v!', 'Zg=']) {
      const r = dec(bad);
      expect(getValue(r, 'Output')).toBe('[Invalid Base64]');
      expect(getValue(r, 'Error')).toBeTruthy();
    }
  });
  it('binary payloads that are not UTF-8 are shown as hex instead of garbage', () => {
    const r = dec('//4A'); // bytes ff fe 00
    expect(getValue(r, 'Output')).toBe('[Binary data, 3 bytes, not UTF-8 text] hex: ff fe 00');
    expect(getValue(r, 'Decoded Character Count')).toBe('3');
  });
  it('round-trips every byte value and every length 0..5', () => {
    const all = Uint8Array.from({ length: 256 }, (_, i) => i);
    for (const v of ['standard', 'url', 'urlnopad'] as const) {
      const back = base64ToBytes(bytesToBase64(all, v));
      expect(back.ok && Array.from(back.bytes)).toEqual(Array.from(all));
    }
    for (let n = 0; n <= 5; n++) {
      const b = Uint8Array.from({ length: n }, (_, i) => i + 1);
      const r = base64ToBytes(bytesToBase64(b));
      expect(r.ok && Array.from(r.bytes)).toEqual(Array.from(b));
    }
    expect(bytesToBase64(Uint8Array.from([1, 2, 3, 4, 5]))).toBe('AQIDBAU='); // Python
    expect(bytesToText(Uint8Array.from([0xff]))).toBeNull();
  });
  it('character counts use code points and report byte size', () => {
    const r = calculate({ inputText: '😀', mode: 'Encode' });
    expect(getValue(r, 'Original Character Count')).toBe('1');
    expect(getValue(r, 'Original Byte Count')).toBe('4');
  });
});
