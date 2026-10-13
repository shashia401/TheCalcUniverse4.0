// Pure JavaScript hash implementations — all synchronous, no Web Crypto dependency.
// Based on widely-verified public domain implementations.
// Uses BigInt for all internal operations to avoid JavaScript 32-bit signed integer pitfalls.

/* ====== BYTE / HEX HELPERS ====== */

function strToBytes(s: string): number[] {
  return Array.from(new TextEncoder().encode(s));
}

function bytesToHex(bytes: number[]): string {
  return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
}

/* ========== MD5 (RFC 1321) ========== */

function md5(s: string): string {
  const x = strToBytes(s);
  const bitLen = BigInt(x.length * 8);

  // Pad message
  const msg = [...x];
  msg.push(0x80);
  while ((msg.length * 8) % 512 !== 448) msg.push(0);
  // 64-bit length in little-endian (low bytes first)
  for (let i = 0; i < 8; i++) msg.push(Number((bitLen >> BigInt(i * 8)) & 0xFFn));

  // Words (little-endian)
  const w: number[] = [];
  for (let i = 0; i < msg.length; i += 4) {
    w.push(msg[i] | (msg[i + 1] << 8) | (msg[i + 2] << 16) | (msg[i + 3] << 24));
  }

  function F(b: number, c: number, d: number) { return (b & c) | (~b & d); }
  function G(b: number, c: number, d: number) { return (d & b) | (~d & c); }
  function H(b: number, c: number, d: number) { return b ^ c ^ d; }
  function I(b: number, c: number, d: number) { return c ^ (b | ~d); }

  // Generate T table (constants)
  const S: number[] = [];
  for (let i = 0; i < 64; i++) S.push(Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000));

  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;

  // Correct shifts per RFC 1321
  const shifts = [[7, 12, 17, 22], [5, 9, 14, 20], [4, 11, 16, 23], [6, 10, 15, 21]];

  for (let i = 0; i < w.length; i += 16) {
    let a = a0, b = b0, c = c0, d = d0;
    const chunk = w.slice(i, i + 16);

    for (let j = 0; j < 64; j++) {
      let f: number, k: number, g: number;
      if (j < 16) { f = F(b, c, d); k = j; g = 0; }
      else if (j < 32) { f = G(b, c, d); k = (5 * j + 1) % 16; g = 1; }
      else if (j < 48) { f = H(b, c, d); k = (3 * j + 5) % 16; g = 2; }
      else { f = I(b, c, d); k = (7 * j) % 16; g = 3; }

      const shift = shifts[g][j % 4];
      // Use BigInt for intermediate computation to avoid 32-bit overflow/sign issues
      const tempVal = (BigInt(a) + BigInt(f) + BigInt(chunk[k]) + BigInt(S[j])) & 0xFFFFFFFFn;
      const temp = Number(tempVal);
      a = d;
      d = c;
      c = b;
      b = (b + ((temp << shift) | (temp >>> (32 - shift)))) >>> 0;
    }

    a0 = (a0 + a) >>> 0;
    b0 = (b0 + b) >>> 0;
    c0 = (c0 + c) >>> 0;
    d0 = (d0 + d) >>> 0;
  }

  function toBytesLE(n: number) { return [n & 0xFF, (n >>> 8) & 0xFF, (n >>> 16) & 0xFF, (n >>> 24) & 0xFF]; }
  return bytesToHex([...toBytesLE(a0), ...toBytesLE(b0), ...toBytesLE(c0), ...toBytesLE(d0)]);
}

/* ========== SHA-1 (FIPS 180-4) ========== */

const rotl32 = (x: number, n: number) => ((x << n) | (x >>> (32 - n))) >>> 0;
const rotr32 = (x: number, n: number) => ((x >>> n) | (x << (32 - n))) >>> 0;

/** Pad per FIPS 180-4 (big-endian 64-bit bit length) for 64-byte blocks. */
function padBlocks64(bytes: number[]): number[] {
  const msg = [...bytes, 0x80];
  while (msg.length % 64 !== 56) msg.push(0);
  const bitLen = BigInt(bytes.length) * 8n;
  for (let i = 7; i >= 0; i--) msg.push(Number((bitLen >> BigInt(i * 8)) & 0xffn));
  return msg;
}

const hex32 = (words: number[]) => words.map((w) => (w >>> 0).toString(16).padStart(8, '0')).join('');

function sha1(s: string): string {
  const msg = padBlocks64(strToBytes(s));
  let h0 = 0x67452301, h1 = 0xefcdab89, h2 = 0x98badcfe, h3 = 0x10325476, h4 = 0xc3d2e1f0;
  const w = new Array<number>(80);
  for (let i = 0; i < msg.length; i += 64) {
    for (let t = 0; t < 16; t++) {
      w[t] = ((msg[i + 4 * t] << 24) | (msg[i + 4 * t + 1] << 16) | (msg[i + 4 * t + 2] << 8) | msg[i + 4 * t + 3]) >>> 0;
    }
    for (let t = 16; t < 80; t++) w[t] = rotl32(w[t - 3] ^ w[t - 8] ^ w[t - 14] ^ w[t - 16], 1);
    let a = h0, b = h1, c = h2, d = h3, e = h4;
    for (let t = 0; t < 80; t++) {
      let f: number, k: number;
      if (t < 20) { f = (b & c) | (~b & d); k = 0x5a827999; }
      else if (t < 40) { f = b ^ c ^ d; k = 0x6ed9eba1; }
      else if (t < 60) { f = (b & c) | (b & d) | (c & d); k = 0x8f1bbcdc; }
      else { f = b ^ c ^ d; k = 0xca62c1d6; }
      const temp = (rotl32(a, 5) + (f >>> 0) + e + k + w[t]) >>> 0;
      e = d; d = c; c = rotl32(b, 30); b = a; a = temp;
    }
    h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0; h4 = (h4 + e) >>> 0;
  }
  return hex32([h0, h1, h2, h3, h4]);
}

/* ========== SHA-256 (FIPS 180-4) ========== */

const K256 = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

function sha256(s: string): string {
  const msg = padBlocks64(strToBytes(s));
  const h = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  const w = new Array<number>(64);
  for (let i = 0; i < msg.length; i += 64) {
    for (let t = 0; t < 16; t++) {
      w[t] = ((msg[i + 4 * t] << 24) | (msg[i + 4 * t + 1] << 16) | (msg[i + 4 * t + 2] << 8) | msg[i + 4 * t + 3]) >>> 0;
    }
    for (let t = 16; t < 64; t++) {
      const s0 = rotr32(w[t - 15], 7) ^ rotr32(w[t - 15], 18) ^ (w[t - 15] >>> 3);
      const s1 = rotr32(w[t - 2], 17) ^ rotr32(w[t - 2], 19) ^ (w[t - 2] >>> 10);
      w[t] = (w[t - 16] + (s0 >>> 0) + w[t - 7] + (s1 >>> 0)) >>> 0;
    }
    let [a, b, c, d, e, f, g, hh] = h;
    for (let t = 0; t < 64; t++) {
      const S1 = (rotr32(e, 6) ^ rotr32(e, 11) ^ rotr32(e, 25)) >>> 0;
      const ch = ((e & f) ^ (~e & g)) >>> 0;
      const t1 = (hh + S1 + ch + K256[t] + w[t]) >>> 0;
      const S0 = (rotr32(a, 2) ^ rotr32(a, 13) ^ rotr32(a, 22)) >>> 0;
      const maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
      const t2 = (S0 + maj) >>> 0;
      hh = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    h[0] = (h[0] + a) >>> 0; h[1] = (h[1] + b) >>> 0; h[2] = (h[2] + c) >>> 0; h[3] = (h[3] + d) >>> 0;
    h[4] = (h[4] + e) >>> 0; h[5] = (h[5] + f) >>> 0; h[6] = (h[6] + g) >>> 0; h[7] = (h[7] + hh) >>> 0;
  }
  return hex32(h);
}

/* ====== SHA-384 / SHA-512 ====== */

function sha512Core(s: string, is384: boolean): string {
  const x = strToBytes(s);
  const ml = BigInt(x.length * 8);

  x.push(0x80);
  while ((x.length * 8) % 1024 !== 896) x.push(0);
  // Append 128-bit length (big-endian)
  for (let i = 7; i >= 0; i--) x.push(Number((ml >> BigInt(56 + i * 8)) & 0xFFn));
  for (let i = 7; i >= 0; i--) x.push(Number((ml >> BigInt(i * 8)) & 0xFFn));

  const K = [
    0x428a2f98d728ae22n, 0x7137449123ef65cdn, 0xb5c0fbcfec4d3b2fn, 0xe9b5dba58189dbbcn,
    0x3956c25bf348b538n, 0x59f111f1b605d019n, 0x923f82a4af194f9bn, 0xab1c5ed5da6d8118n,
    0xd807aa98a3030242n, 0x12835b0145706fben, 0x243185be4ee4b28cn, 0x550c7dc3d5ffb4e2n,
    0x72be5d74f27b896fn, 0x80deb1fe3b1696b1n, 0x9bdc06a725c71235n, 0xc19bf174cf692694n,
    0xe49b69c19ef14ad2n, 0xefbe4786384f25e3n, 0x0fc19dc68b8cd5b5n, 0x240ca1cc77ac9c65n,
    0x2de92c6f592b0275n, 0x4a7484aa6ea6e483n, 0x5cb0a9dcbd41fbd4n, 0x76f988da831153b5n,
    0x983e5152ee66dfabn, 0xa831c66d2db43210n, 0xb00327c898fb213fn, 0xbf597fc7beef0ee4n,
    0xc6e00bf33da88fc2n, 0xd5a79147930aa725n, 0x06ca6351e003826fn, 0x142929670a0e6e70n,
    0x27b70a8546d22ffcn, 0x2e1b21385c26c926n, 0x4d2c6dfc5ac42aedn, 0x53380d139d95b3dfn,
    0x650a73548baf63den, 0x766a0abb3c77b2a8n, 0x81c2c92e47edaee6n, 0x92722c851482353bn,
    0xa2bfe8a14cf10364n, 0xa81a664bbc423001n, 0xc24b8b70d0f89791n, 0xc76c51a30654be30n,
    0xd192e819d6ef5218n, 0xd69906245565a910n, 0xf40e35855771202an, 0x106aa07032bbd1b8n,
    0x19a4c116b8d2d0c8n, 0x1e376c085141ab53n, 0x2748774cdf8eeb99n, 0x34b0bcb5e19b48a8n,
    0x391c0cb3c5c95a63n, 0x4ed8aa4ae3418acbn, 0x5b9cca4f7763e373n, 0x682e6ff3d6b2b8a3n,
    0x748f82ee5defb2fcn, 0x78a5636f43172f60n, 0x84c87814a1f0ab72n, 0x8cc702081a6439ecn,
    0x90befffa23631e28n, 0xa4506cebde82bde9n, 0xbef9a3f7b2c67915n, 0xc67178f2e372532bn,
    0xca273eceea26619cn, 0xd186b8c721c0c207n, 0xeada7dd6cde0eb1en, 0xf57d4f7fee6ed178n,
    0x06f067aa72176fban, 0x0a637dc5a2c898a6n, 0x113f9804bef90daen, 0x1b710b35131c471bn,
    0x28db77f523047d84n, 0x32caab7b40c72493n, 0x3c9ebe0a15c9bebcn, 0x431d67c49c100d4cn,
    0x4cc5d4becb3e42b6n, 0x597f299cfc657e2an, 0x5fcb6fab3ad6faecn, 0x6c44198c4a475817n,
  ];

  const w: bigint[] = [];
  for (let i = 0; i < x.length; i += 8) {
    w.push(
      (BigInt(x[i]) << 56n) | (BigInt(x[i + 1]) << 48n) | (BigInt(x[i + 2]) << 40n) | (BigInt(x[i + 3]) << 32n) |
      (BigInt(x[i + 4]) << 24n) | (BigInt(x[i + 5]) << 16n) | (BigInt(x[i + 6]) << 8n) | BigInt(x[i + 7])
    );
  }

  let h: bigint[];
  if (is384) {
    h = [0xcbbb9d5dc1059ed8n, 0x629a292a367cd507n, 0x9159015a3070dd17n, 0x152fecd8f70e5939n, 0x67332667ffc00b31n, 0x8eb44a8768581511n, 0xdb0c2e0d64f98fa7n, 0x47b5481dbefa4fa4n];
  } else {
    h = [0x6a09e667f3bcc908n, 0xbb67ae8584caa73bn, 0x3c6ef372fe94f82bn, 0xa54ff53a5f1d36f1n, 0x510e527fade682d1n, 0x9b05688c2b3e6c1fn, 0x1f83d9abfb41bd6bn, 0x5be0cd19137e2179n];
  }

  function rotr64(x: bigint, n: bigint): bigint { return (x >> n) | (x << (64n - n)); }

  for (let i = 0; i < w.length; i += 16) {
    const W = w.slice(i, i + 16);
    for (let t = 16; t < 80; t++) {
      const s0 = rotr64(W[t - 15], 1n) ^ rotr64(W[t - 15], 8n) ^ (W[t - 15] >> 7n);
      const s1 = rotr64(W[t - 2], 19n) ^ rotr64(W[t - 2], 61n) ^ (W[t - 2] >> 6n);
      W[t] = (W[t - 16] + s0 + W[t - 7] + s1) & 0xFFFFFFFFFFFFFFFFn;
    }
    let a = h[0], b = h[1], c = h[2], d = h[3], e = h[4], f = h[5], g = h[6], hh = h[7];
    for (let t = 0; t < 80; t++) {
      const S1 = rotr64(e, 14n) ^ rotr64(e, 18n) ^ rotr64(e, 41n);
      const ch = (e & f) ^ ((~e) & g);
      const temp1 = (hh + S1 + ch + K[t] + W[t]) & 0xFFFFFFFFFFFFFFFFn;
      const S0 = rotr64(a, 28n) ^ rotr64(a, 34n) ^ rotr64(a, 39n);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) & 0xFFFFFFFFFFFFFFFFn;
      hh = g; g = f; f = e; e = (d + temp1) & 0xFFFFFFFFFFFFFFFFn;
      d = c; c = b; b = a; a = (temp1 + temp2) & 0xFFFFFFFFFFFFFFFFn;
    }
    h[0] = (h[0] + a) & 0xFFFFFFFFFFFFFFFFn;
    h[1] = (h[1] + b) & 0xFFFFFFFFFFFFFFFFn;
    h[2] = (h[2] + c) & 0xFFFFFFFFFFFFFFFFn;
    h[3] = (h[3] + d) & 0xFFFFFFFFFFFFFFFFn;
    h[4] = (h[4] + e) & 0xFFFFFFFFFFFFFFFFn;
    h[5] = (h[5] + f) & 0xFFFFFFFFFFFFFFFFn;
    h[6] = (h[6] + g) & 0xFFFFFFFFFFFFFFFFn;
    h[7] = (h[7] + hh) & 0xFFFFFFFFFFFFFFFFn;
  }

  const numToHex = (n: bigint, pad: number) => n.toString(16).padStart(pad, '0');
  const count = is384 ? 6 : 8;
  return h.slice(0, count).map(n => numToHex(n, 16)).join('');
}

function sha384(s: string): string { return sha512Core(s, true); }
function sha512(s: string): string { return sha512Core(s, false); }

/* ====== Keccak-256 (original Keccak, as used by Ethereum; NOT NIST SHA3-256) ====== */

const M64 = (1n << 64n) - 1n;
const rotl64 = (x: bigint, n: number) => (n === 0 ? x : ((x << BigInt(n)) | (x >> BigInt(64 - n))) & M64);

const KECCAK_RC = [
  0x0000000000000001n, 0x0000000000008082n, 0x800000000000808an, 0x8000000080008000n, 0x000000000000808bn,
  0x0000000080000001n, 0x8000000080008081n, 0x8000000000008009n, 0x000000000000008an, 0x0000000000000088n,
  0x0000000080008009n, 0x000000008000000an, 0x000000008000808bn, 0x800000000000008bn, 0x8000000000008089n,
  0x8000000000008003n, 0x8000000000008002n, 0x8000000000000080n, 0x000000000000800an, 0x800000008000000an,
  0x8000000080008081n, 0x8000000000008080n, 0x0000000080000001n, 0x8000000080008008n,
];
// rotation offsets r[x][y] indexed as lane x + 5y
const KECCAK_ROT = [0, 1, 62, 28, 27, 36, 44, 6, 55, 20, 3, 10, 43, 25, 39, 41, 45, 15, 21, 8, 18, 2, 61, 56, 14];

function keccakF1600(a: bigint[]): void {
  for (let round = 0; round < 24; round++) {
    // theta
    const c = [0, 1, 2, 3, 4].map((x) => a[x] ^ a[x + 5] ^ a[x + 10] ^ a[x + 15] ^ a[x + 20]);
    for (let x = 0; x < 5; x++) {
      const d = c[(x + 4) % 5] ^ rotl64(c[(x + 1) % 5], 1);
      for (let y = 0; y < 25; y += 5) a[x + y] ^= d;
    }
    // rho + pi
    const b = new Array<bigint>(25).fill(0n);
    for (let x = 0; x < 5; x++) {
      for (let y = 0; y < 5; y++) {
        b[y + 5 * ((2 * x + 3 * y) % 5)] = rotl64(a[x + 5 * y], KECCAK_ROT[x + 5 * y]);
      }
    }
    // chi
    for (let y = 0; y < 25; y += 5) {
      for (let x = 0; x < 5; x++) a[x + y] = b[x + y] ^ (~b[((x + 1) % 5) + y] & M64 & b[((x + 2) % 5) + y]);
    }
    // iota
    a[0] ^= KECCAK_RC[round];
  }
}

/** Keccak sponge with a 256-bit output. `domain` is the padding byte: 0x01 = original Keccak, 0x06 = NIST SHA3-256 (FIPS 202). */
export function keccak256(s: string, domain = 0x01): string {
  const rate = 136; // bytes (1088 bits) for a 256-bit output
  const bytes = strToBytes(s);
  const msg = [...bytes];
  msg.push(domain);
  while (msg.length % rate !== 0) msg.push(0);
  msg[msg.length - 1] |= 0x80;
  const state = new Array<bigint>(25).fill(0n);
  for (let off = 0; off < msg.length; off += rate) {
    for (let i = 0; i < rate / 8; i++) {
      let lane = 0n;
      for (let j = 7; j >= 0; j--) lane = (lane << 8n) | BigInt(msg[off + 8 * i + j]);
      state[i] ^= lane;
    }
    keccakF1600(state);
  }
  const out: number[] = [];
  for (let i = 0; i < 4; i++) for (let j = 0; j < 8; j++) out.push(Number((state[i] >> BigInt(8 * j)) & 0xffn));
  return bytesToHex(out);
}

/* ====== PUBLIC API ====== */

export function computeHash(algorithm: string, input: string): { hash: string; algorithm: string; warning?: string } {
  switch (algorithm) {
    case 'md5':
      return { hash: md5(input), algorithm: 'MD5' };
    case 'sha-1':
      return { hash: sha1(input), algorithm: 'SHA-1' };
    case 'sha-256':
      return { hash: sha256(input), algorithm: 'SHA-256' };
    case 'sha-384':
      return { hash: sha384(input), algorithm: 'SHA-384' };
    case 'sha-512':
      return { hash: sha512(input), algorithm: 'SHA-512' };
    case 'keccak-256':
      return { hash: keccak256(input), algorithm: 'Keccak-256' };
    default:
      return { hash: sha256(input), algorithm: 'SHA-256', warning: 'Unknown algorithm, using SHA-256' };
  }
}
