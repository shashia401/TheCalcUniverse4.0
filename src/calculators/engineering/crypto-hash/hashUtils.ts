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

function sha1(s: string): string {
  const x = strToBytes(s);
  const ml = BigInt(x.length * 8);

  x.push(0x80);
  while ((x.length * 8) % 512 !== 448) x.push(0);
  // 64-bit length in big-endian
  for (let i = 7; i >= 0; i--) x.push(Number((ml >> BigInt(i * 8)) & 0xFFn));

  const w: bigint[] = [];
  for (let i = 0; i < x.length; i += 4) {
    w.push(BigInt((x[i] << 24) | (x[i + 1] << 16) | (x[i + 2] << 8) | x[i + 3]));
  }

  const MASK32 = 0xFFFFFFFFn;

  let h0 = 0x67452301n, h1 = 0xEFCDAB89n, h2 = 0x98BADCFEn, h3 = 0x10325476n, h4 = 0xC3D2E1F0n;

  for (let i = 0n; i < w.length; i += 16n) {
    const W: bigint[] = [];
    for (let t = 0; t < 16; t++) W.push(w[Number(i) + t]);

    // Extend to 80 words (all BigInt)
    for (let t = 16; t < 80; t++) {
      const n = W[t - 3] ^ W[t - 8] ^ W[t - 14] ^ W[t - 16];
      W[t] = ((n << 1n) | (n >> 31n)) & MASK32;
    }

    let a = h0, b = h1, c = h2, d = h3, e = h4;

    for (let t = 0; t < 80; t++) {
      let f: bigint, k: bigint;
      if (t < 20) { f = (b & c) ^ ((~b) & d); k = 0x5A827999n; }
      else if (t < 40) { f = b ^ c ^ d; k = 0x6ED9EBA1n; }
      else if (t < 60) { f = (b & c) ^ (b & d) ^ (c & d); k = 0x8F1BBCDCn; }
      else { f = b ^ c ^ d; k = 0xCA62C1D6n; }

      // rotl(a, 5) for 32-bit BigInt: shift left 5, bring top 5 bits down by right-shifting 27
      const rotl_a5 = ((a << 5n) | (a >> 27n)) & MASK32;
      const temp = (rotl_a5 + f + e + k + W[t]) & MASK32;

      e = d;
      d = c;
      c = ((b << 30n) | (b >> 2n)) & MASK32;
      b = a;
      a = temp;
    }

    h0 = (h0 + a) & MASK32;
    h1 = (h1 + b) & MASK32;
    h2 = (h2 + c) & MASK32;
    h3 = (h3 + d) & MASK32;
    h4 = (h4 + e) & MASK32;
  }

  const toHex = (n: bigint) => n.toString(16).padStart(8, '0');
  return toHex(h0) + toHex(h1) + toHex(h2) + toHex(h3) + toHex(h4);
}

/* ========== SHA-256 (FIPS 180-4) ========== */

function sha256(s: string): string {
  const x = strToBytes(s);
  const ml = BigInt(x.length * 8);

  // Pad
  x.push(0x80);
  while ((x.length * 8) % 512 !== 448) x.push(0);
  // Append 64-bit length (big-endian)
  for (let i = 7; i >= 0; i--) x.push(Number((ml >> BigInt(i * 8)) & 0xFFn));

  // Convert to 32-bit big-endian words (as BigInt)
  const w: bigint[] = [];
  for (let i = 0; i < x.length; i += 4) {
    w.push(BigInt((x[i] << 24) | (x[i + 1] << 16) | (x[i + 2] << 8) | x[i + 3]));
  }

  const K: bigint[] = [
    0x428a2f98n, 0x71374491n, 0xb5c0fbcfn, 0xe9b5dba5n,
    0x3956c25bn, 0x59f111f1n, 0x923f82a4n, 0xab1c5ed5n,
    0xd807aa98n, 0x12835b01n, 0x243185ben, 0x550c7dc3n,
    0x72be5d74n, 0x80deb1fen, 0x9bdc06a7n, 0xc19bf174n,
    0xe49b69c1n, 0xefbe4786n, 0x0fc19dc6n, 0x240ca1ccn,
    0x2de92c6fn, 0x4a7484aan, 0x5cb0a9dcn, 0x76f988dan,
    0x983e5152n, 0xa831c66dn, 0xb00327c8n, 0xbf597fc7n,
    0xc6e00bf3n, 0xd5a79147n, 0x06ca6351n, 0x14292967n,
    0x27b70a85n, 0x2e1b2138n, 0x4d2c6dfcn, 0x53380d13n,
    0x650a7354n, 0x766a0abbn, 0x81c2c92en, 0x92722c85n,
    0xa2bfe8a1n, 0xa81a664bn, 0xc24b8b70n, 0xc76c51a3n,
    0xd192e819n, 0xd6990624n, 0xf40e3585n, 0x106aa070n,
    0x19a4c116n, 0x1e376c08n, 0x2748774cn, 0x34b0bcb5n,
    0x391c0cb3n, 0x4ed8aa4an, 0x5b9cca4fn, 0x682e6ff3n,
    0x748f82een, 0x78a5636fn, 0x84c87814n, 0x8cc70208n,
    0x90befffan, 0xa4506cebn, 0xbef9a3f7n, 0xc67178f2n,
  ];

  const M32 = 0xFFFFFFFFn;

  let h0 = 0x6a09e667n, h1 = 0xbb67ae85n, h2 = 0x3c6ef372n, h3 = 0xa54ff53an;
  let h4 = 0x510e527fn, h5 = 0x9b05688cn, h6 = 0x1f83d9abn, h7 = 0x5be0cd19n;

  const rotr = (x: bigint, n: bigint) => ((x >> n) | (x << (32n - n))) & M32;

  for (let i = 0n; i < w.length; i += 16n) {
    const W: bigint[] = [];
    for (let t = 0; t < 16; t++) W.push(w[Number(i) + t]);

    for (let t = 16; t < 64; t++) {
      const s0 = rotr(W[t - 15], 7n) ^ rotr(W[t - 15], 18n) ^ (W[t - 15] >> 3n);
      const s1 = rotr(W[t - 2], 17n) ^ rotr(W[t - 2], 19n) ^ (W[t - 2] >> 10n);
      W[t] = (W[t - 16] + s0 + W[t - 7] + s1) & M32;
    }

    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;

    for (let t = 0; t < 64; t++) {
      const S1 = rotr(e, 6n) ^ rotr(e, 11n) ^ rotr(e, 25n);
      const ch = ((e & f) ^ ((~e) & g)) & M32;
      const temp1 = (h + S1 + ch + K[t] + W[t]) & M32;
      const S0 = rotr(a, 2n) ^ rotr(a, 13n) ^ rotr(a, 22n);
      const maj = ((a & b) ^ (a & c) ^ (b & c)) & M32;
      const temp2 = (S0 + maj) & M32;

      h = g; g = f; f = e; e = (d + temp1) & M32; d = c; c = b; b = a; a = (temp1 + temp2) & M32;
    }

    h0 = (h0 + a) & M32; h1 = (h1 + b) & M32; h2 = (h2 + c) & M32; h3 = (h3 + d) & M32;
    h4 = (h4 + e) & M32; h5 = (h5 + f) & M32; h6 = (h6 + g) & M32; h7 = (h7 + h) & M32;
  }

  const toHex = (n: bigint) => n.toString(16).padStart(8, '0');
  return toHex(h0) + toHex(h1) + toHex(h2) + toHex(h3) + toHex(h4) + toHex(h5) + toHex(h6) + toHex(h7);
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

/* ====== Keccak-256 (SHA3-256) ====== */

function keccak256(s: string): string {
  const msg = strToBytes(s);
  const state: bigint[] = new Array(25).fill(0n);
  const rate = 136;

  const padded = [...msg, 0x01];
  while ((padded.length * 8) % (rate * 8) !== (rate * 8 - 8)) padded.push(0x00);
  padded.push(0x80);

  for (let i = 0; i < padded.length; i += rate) {
    for (let j = 0; j < rate; j++) {
      const lane = j % 8;
      const plane = Math.floor(j / 8);
      if (plane < 25 && lane < 8 && (i + j) < padded.length) {
        state[plane] ^= BigInt(padded[i + j]) << BigInt(8 * lane);
      }
    }
    keccakF1600(state);
  }

  const out: bigint[] = [];
  let squeezed = 0;
  while (squeezed < 32) {
    const block = state.slice(0, rate / 8);
    for (const w of block) {
      for (let b = 0; b < 8; b++) {
        out.push((w >> BigInt(8 * b)) & 0xFFn);
        squeezed++;
        if (squeezed >= 32) break;
      }
      if (squeezed >= 32) break;
    }
    if (squeezed < 32) keccakF1600(state);
  }

  return out.map(n => Number(n).toString(16).padStart(2, '0')).join('');
}

function keccakF1600(state: bigint[]): void {
  const ROL64 = (x: bigint, y: bigint) => ((x << y) | (x >> (64n - y))) & 0xFFFFFFFFFFFFFFFFn;

  for (let round = 0; round < 24; round++) {
    const C = new Array(5).fill(0n);
    for (let x = 0; x < 5; x++) {
      C[x] = state[x] ^ state[x + 5] ^ state[x + 10] ^ state[x + 15] ^ state[x + 20];
    }
    const D = new Array(5).fill(0n);
    for (let x = 0; x < 5; x++) {
      D[x] = C[(x + 4) % 5] ^ ROL64(C[(x + 1) % 5], 1n);
    }
    for (let x = 0; x < 25; x++) {
      state[x] ^= D[x % 5];
    }

    let x = 1, y = 0;
    let current = state[1];
    const shifts = [1n, 3n, 6n, 10n, 15n, 21n, 28n, 36n, 45n, 55n, 2n, 14n, 27n, 41n, 56n, 8n, 25n, 43n, 62n, 18n, 39n, 61n, 20n, 44n];
    for (let t = 0; t < 24; t++) {
      const temp = state[5 * y + x];
      state[5 * y + x] = ROL64(current, shifts[t]);
      current = temp;
      const oldX = x;
      x = y;
      y = (2 * oldX + 3 * y) % 5;
    }

    for (let y = 0; y < 25; y += 5) {
      const t = state.slice(y, y + 5);
      for (let x = 0; x < 5; x++) {
        state[y + x] = t[x] ^ ((~t[(x + 1) % 5]) & t[(x + 2) % 5]);
      }
    }

    const RC = [
      0x0000000000000001n, 0x0000000000008082n, 0x800000000000808an, 0x8000000080008000n,
      0x000000000000808bn, 0x0000000080000001n, 0x8000000080008081n, 0x8000000000008009n,
      0x000000000000008an, 0x0000000000000088n, 0x0000000080008009n, 0x000000008000000an,
      0x000000008000808bn, 0x800000000000008bn, 0x8000000000008089n, 0x8000000000008003n,
      0x8000000000008002n, 0x8000000000000080n, 0x000000000000800an, 0x800000008000000an,
      0x8000000080008081n, 0x8000000000008080n, 0x0000000080000001n, 0x8000000080008008n,
    ];
    state[0] ^= RC[round];
  }
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
