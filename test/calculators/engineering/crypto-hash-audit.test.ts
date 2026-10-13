import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { computeHash, keccak256 } from '../../../src/calculators/engineering/crypto-hash/hashUtils';
import config from '../../../src/calculators/engineering/crypto-hash';
import { getValue } from '../../helpers';

// Reference digests come from Node's OpenSSL-backed crypto (independent of the in-page implementation) and from
// published test vectors (FIPS 180-4 / RFC 1321 / Keccak team).
const inputs = [
  '', 'a', 'abc', 'message digest', 'The quick brown fox jumps over the lazy dog',
  'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq', // FIPS 180-4 two-block vector
  'a'.repeat(55), 'a'.repeat(56), 'a'.repeat(63), 'a'.repeat(64), 'a'.repeat(111), 'a'.repeat(112), 'a'.repeat(127), 'a'.repeat(128), 'a'.repeat(1000),
  'héllo wörld ✓ 你好 😀', 'password123',
];

describe('crypto-hash audit: every algorithm vs independent references', () => {
  for (const [alg, node] of [['md5', 'md5'], ['sha-1', 'sha1'], ['sha-256', 'sha256'], ['sha-384', 'sha384'], ['sha-512', 'sha512']] as const) {
    it(`${alg} matches OpenSSL on boundary-length, multi-block and Unicode inputs`, () => {
      for (const s of inputs) {
        expect(computeHash(alg, s).hash, `${alg}(${JSON.stringify(s.slice(0, 20))}..${s.length})`).toBe(createHash(node).update(s, 'utf8').digest('hex'));
      }
    });
  }
  it('SHA-256 FIPS vectors: "abc" and the empty string', () => {
    expect(computeHash('sha-256', 'abc').hash).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    expect(computeHash('sha-256', '').hash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });
  it('MD5 / SHA-1 RFC vectors', () => {
    expect(computeHash('md5', 'abc').hash).toBe('900150983cd24fb0d6963f7d28e17f72');
    expect(computeHash('sha-1', 'abc').hash).toBe('a9993e364706816aba3e25717850c26c9cd0d89d');
  });
  it('educational worked-example hashes are correct', () => {
    expect(computeHash('sha-256', 'The quick brown fox jumps over the lazy dog').hash).toBe('d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592');
    expect(computeHash('sha-256', 'password123').hash).toBe('ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f');
    expect(computeHash('md5', '{"name":"Alice","age":30,"city":"New York"}').hash).toBe(createHash('md5').update('{"name":"Alice","age":30,"city":"New York"}').digest('hex'));
  });
  it('Keccak-256 is the ORIGINAL Keccak (Ethereum), NOT NIST SHA3-256: published vectors', () => {
    // Keccak-256 (pad 0x01): empty -> c5d246..., "abc" -> 4e0365...; NIST SHA3-256 (pad 0x06) differs.
    expect(computeHash('keccak-256', '').hash).toBe('c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470');
    expect(computeHash('keccak-256', 'abc').hash).toBe('4e03657aea45a94fc7d47ba826c8d667c0d1e6e33a64a036ec44f58fa12d6c45');
    for (const s of inputs) expect(computeHash('keccak-256', s).hash).not.toBe(createHash('sha3-256').update(s, 'utf8').digest('hex'));
    expect(createHash('sha3-256').update('abc').digest('hex')).toBe('3a985da74fe225b2045c172d6bd390bd855f086e3e9d525b46bfe24511431532');
  });
  it('the Keccak permutation/absorb is validated at and across the 136-byte rate boundary via NIST SHA3-256 (pad 0x06)', () => {
    for (const n of [0, 1, 135, 136, 137, 271, 272, 273, 1000]) {
      const m = 'a'.repeat(n);
      expect(keccak256(m, 0x06), `n=${n}`).toBe(createHash('sha3-256').update(m).digest('hex'));
    }
  });
  it('the dropdown no longer calls Keccak-256 "SHA3-256"', () => {
    const opt = config.inputs[1].options!.find((o) => o.value === 'keccak-256')!;
    expect(opt.label).not.toMatch(/\(SHA3-256\)/);
    expect(getValue(config.calculate({ inputText: 'abc', algorithm: 'keccak-256' }), 'algorithm')).toBe('Keccak-256');
  });
  it('hash sizes reported correctly', () => {
    expect(getValue(config.calculate({ inputText: 'x', algorithm: 'sha-512' }), 'hashBytes')).toBe('512 bits');
    expect(getValue(config.calculate({ inputText: 'x', algorithm: 'md5' }), 'hashLength')).toBe('16 bytes');
  });
});
