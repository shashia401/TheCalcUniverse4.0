// RFC 4648 Base64 on raw bytes, independent of btoa/atob (btoa throws on anything beyond Latin-1 and atob
// returns Latin-1 "binary strings", so neither handles UTF-8 text such as "héllo" or emoji correctly).

export type Base64Variant = 'standard' | 'url' | 'urlnopad';

const STD = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const URL_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

/** Bytes -> Base64. 'standard' = RFC 4648 §4 with padding, 'url' = §5 alphabet with padding, 'urlnopad' = §5 without padding (JWT style). */
export function bytesToBase64(bytes: Uint8Array, variant: Base64Variant = 'standard'): string {
  const table = variant === 'standard' ? STD : URL_ALPHABET;
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    const n = (b0 << 16) | (b1 << 8) | b2;
    out += table[(n >> 18) & 63] + table[(n >> 12) & 63];
    out += i + 1 < bytes.length ? table[(n >> 6) & 63] : variant === 'urlnopad' ? '' : '=';
    out += i + 2 < bytes.length ? table[n & 63] : variant === 'urlnopad' ? '' : '=';
  }
  return out;
}

export type DecodeOutcome = { ok: true; bytes: Uint8Array } | { ok: false; reason: string };

/**
 * Base64 (either alphabet, padding optional) -> bytes. Whitespace/line breaks (MIME) are ignored. Rejects characters
 * outside the alphabets, '=' anywhere but the end, a length of 1 mod 4, and inconsistent padding.
 */
export function base64ToBytes(input: string): DecodeOutcome {
  const s = input.replace(/\s+/g, '');
  if (s === '') return { ok: true, bytes: new Uint8Array(0) };
  const m = /^([A-Za-z0-9+/_-]*)(={0,2})$/.exec(s);
  if (!m) return { ok: false, reason: 'contains characters outside the Base64 alphabet, or "=" before the end' };
  const [, body, pad] = m;
  if (body.length % 4 === 1) return { ok: false, reason: 'the length is impossible (a single leftover character carries no full byte)' };
  if (pad && (body.length + pad.length) % 4 !== 0) return { ok: false, reason: 'the "=" padding does not complete a multiple of 4 characters' };
  const values = new Uint8Array(body.length);
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    const v = c === '-' ? 62 : c === '_' ? 63 : STD.indexOf(c);
    values[i] = v;
  }
  const out = new Uint8Array(Math.floor((body.length * 6) / 8));
  let o = 0;
  for (let i = 0; i < body.length; i += 4) {
    const n = (values[i] << 18) | (values[i + 1] << 12) | ((values[i + 2] ?? 0) << 6) | (values[i + 3] ?? 0);
    if (o < out.length) out[o++] = (n >> 16) & 255;
    if (o < out.length) out[o++] = (n >> 8) & 255;
    if (o < out.length) out[o++] = n & 255;
  }
  return { ok: true, bytes: out };
}

/** UTF-8 bytes of a JS string (lone surrogates become U+FFFD, as every encoder does). */
export const textToBytes = (s: string): Uint8Array => new TextEncoder().encode(s);

/** UTF-8 text from bytes, or null when the bytes are not valid UTF-8 (binary data). */
export function bytesToText(bytes: Uint8Array): string | null {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

export const hexPreview = (bytes: Uint8Array, max = 32): string =>
  Array.from(bytes.slice(0, max), (b) => b.toString(16).padStart(2, '0')).join(' ') + (bytes.length > max ? ' …' : '');
