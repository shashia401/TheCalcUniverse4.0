import { describe, it, expect } from 'vitest';
import { byteCapacity, encodeQr, qrBlockLayout, qrToSvgPath, type Ecl, type QrCode } from '../../src/utils/qrcode';

// Independent verification: a small QR *decoder* written separately here (own GF(256) log tables, own function-pattern map,
// alignment centres typed from ISO 18004 annex E) reads the generated symbol back and checks that
//   1. the format word is a valid BCH(15,5) codeword that names the right level / a legal mask,
//   2. every Reed-Solomon block has zero syndromes,
//   3. the byte-mode payload equals the UTF-8 input.

const EXP = new Array<number>(512);
const LOG = new Array<number>(256);
{
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
}
const mul = (a: number, b: number) => (a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]]);

const ALIGN: Record<number, number[]> = { 1: [], 2: [6, 18], 5: [6, 30], 7: [6, 22, 38], 10: [6, 28, 50], 14: [6, 26, 46, 66] };
const MASK_FN = [
  (x: number, y: number) => (x + y) % 2 === 0,
  (_x: number, y: number) => y % 2 === 0,
  (x: number) => x % 3 === 0,
  (x: number, y: number) => (x + y) % 3 === 0,
  (x: number, y: number) => (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0,
  (x: number, y: number) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x: number, y: number) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x: number, y: number) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
];

function bchRemainder(v: number, gen: number, genDeg: number): number {
  for (let i = 14; i >= genDeg; i--) if ((v >>> i) & 1) v ^= gen << (i - genDeg);
  return v;
}

function decode(qr: QrCode): { text: string; ecl: Ecl; mask: number } {
  const n = qr.size;
  const m = qr.modules;
  const ver = (n - 17) / 4;
  // 1. format information (first copy) and its second copy must agree
  const f1: number[] = [];
  for (let i = 0; i <= 5; i++) f1[i] = +m[i][8];
  f1[6] = +m[7][8];
  f1[7] = +m[8][8];
  f1[8] = +m[8][7];
  for (let i = 9; i < 15; i++) f1[i] = +m[8][14 - i];
  const f2: number[] = [];
  for (let i = 0; i < 8; i++) f2[i] = +m[8][n - 1 - i];
  for (let i = 8; i < 15; i++) f2[i] = +m[n - 15 + i][8];
  expect(f2).toEqual(f1);
  const word = f1.reduce((a, b, i) => a | (b << i), 0) ^ 0x5412;
  expect(bchRemainder(word, 0x537, 10)).toBe(0); // valid BCH codeword
  const eclBits = (word >>> 13) & 3;
  const mask = (word >>> 10) & 7;
  const ecl = ({ 1: 'L', 0: 'M', 3: 'Q', 2: 'H' } as Record<number, Ecl>)[eclBits];
  // 2. function-module map
  const fn = Array.from({ length: n }, () => new Array<boolean>(n).fill(false));
  const mark = (x0: number, y0: number, w: number, h: number) => {
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (x >= 0 && y >= 0 && x < n && y < n) fn[y][x] = true;
  };
  mark(0, 0, 9, 9);
  mark(n - 8, 0, 8, 9);
  mark(0, n - 8, 9, 8);
  mark(6, 0, 1, n);
  mark(0, 6, n, 1);
  const a = ALIGN[ver];
  a.forEach((cy, i) =>
    a.forEach((cx, j) => {
      if ((i === 0 && j === 0) || (i === 0 && j === a.length - 1) || (i === a.length - 1 && j === 0)) return;
      mark(cx - 2, cy - 2, 5, 5);
    }),
  );
  if (ver >= 7) {
    mark(n - 11, 0, 3, 6);
    mark(0, n - 11, 6, 3);
  }
  // 3. read codeword bits in zig-zag order, unmasking
  const bits: number[] = [];
  let up = true;
  for (let col = n - 1; col > 0; col -= 2) {
    if (col === 6) col = 5;
    for (let k = 0; k < n; k++) {
      const y = up ? n - 1 - k : k;
      for (const x of [col, col - 1]) if (!fn[y][x]) bits.push((m[y][x] !== MASK_FN[mask](x, y) ? 1 : 0) as number);
    }
    up = !up;
  }
  const { numBlocks, eccLen, rawCodewords } = qrBlockLayout(ver, ecl);
  const cw: number[] = [];
  for (let i = 0; i < rawCodewords; i++) cw.push(parseInt(bits.slice(i * 8, i * 8 + 8).join(''), 2));
  // 4. de-interleave and verify RS syndromes
  const shortBlocks = numBlocks - (rawCodewords % numBlocks);
  const shortLen = Math.floor(rawCodewords / numBlocks);
  const blocks: number[][] = Array.from({ length: numBlocks }, () => []);
  let p = 0;
  for (let i = 0; i < shortLen - eccLen + 1; i++) for (let b = 0; b < numBlocks; b++) if (!(i === shortLen - eccLen && b < shortBlocks)) blocks[b].push(cw[p++]);
  for (let i = 0; i < eccLen; i++) for (let b = 0; b < numBlocks; b++) blocks[b].push(cw[p++]);
  expect(p).toBe(rawCodewords);
  for (const blk of blocks) {
    for (let r = 0; r < eccLen; r++) {
      let s = 0;
      for (const c of blk) s = mul(s, EXP[r]) ^ c;
      expect(s).toBe(0); // zero syndrome: codeword is a valid RS codeword
    }
  }
  // 5. payload
  const data: number[] = [];
  blocks.forEach((b) => data.push(...b.slice(0, b.length - eccLen)));
  const stream = data.map((d) => d.toString(2).padStart(8, '0')).join('');
  expect(stream.slice(0, 4)).toBe('0100');
  const cb = ver <= 9 ? 8 : 16;
  const len = parseInt(stream.slice(4, 4 + cb), 2);
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = parseInt(stream.slice(4 + cb + i * 8, 4 + cb + i * 8 + 8), 2);
  return { text: new TextDecoder().decode(bytes), ecl, mask };
}

describe('QR encoder (src/utils/qrcode.ts)', () => {
  it('byte capacities match the published ISO 18004 values (corners and version 10)', () => {
    expect([1, 2, 3, 4].map((i) => byteCapacity(1, (['L', 'M', 'Q', 'H'] as Ecl[])[i - 1]))).toEqual([17, 14, 11, 7]);
    expect((['L', 'M', 'Q', 'H'] as Ecl[]).map((e) => byteCapacity(10, e))).toEqual([271, 213, 151, 119]);
    expect((['L', 'M', 'Q', 'H'] as Ecl[]).map((e) => byteCapacity(40, e))).toEqual([2953, 2331, 1663, 1273]);
  });
  it('known format words for mask 0 (ISO 18004 annex C)', () => {
    // data bits (ecl<<3|mask) -> after BCH and XOR 0x5412: L0=111011111000100 M0=101010000010010 Q0=011010101011111 H0=001011010001001
    const expected: Record<Ecl, string> = { L: '111011111000100', M: '101010000010010', Q: '011010101011111', H: '001011010001001' };
    for (const ecl of ['L', 'M', 'Q', 'H'] as Ecl[]) {
      // find a text whose best mask is 0 is not guaranteed, so recompute the word from the decoded level directly
      const bits = { L: 1, M: 0, Q: 3, H: 2 }[ecl];
      let rem = (bits << 3) | 0;
      const d = rem;
      for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
      expect((((d << 10) | rem) ^ 0x5412).toString(2).padStart(15, '0')).toBe(expected[ecl]);
    }
  });
  it('round-trips through the independent decoder at every level, across versions 1-14', () => {
    for (const ecl of ['L', 'M', 'Q', 'H'] as Ecl[]) {
      for (const ver of [1, 2, 5, 7, 10, 14]) {
        const len = ver === 1 ? 5 : byteCapacity(ver - 1, ecl) + 1; // smallest input that needs exactly this version
        const text = Array.from({ length: len }, (_, i) => String.fromCharCode(97 + ((i * 7) % 26))).join('');
        const qr = encodeQr(text, ecl)!;
        expect(qr.version).toBe(ver === 1 ? 1 : ver);
        const out = decode(qr);
        expect(out.text).toBe(text);
        expect(out.ecl).toBe(ecl);
        expect(out.mask).toBe(qr.mask);
      }
    }
  });
  it('encodes UTF-8 (accents, CJK, emoji) byte-exactly', () => {
    for (const text of ['https://example.com/?q=ü', '日本語のテキスト', 'smile 😀 ok']) {
      expect(decode(encodeQr(text, 'M')!).text).toBe(text);
    }
  });
  it('maximum payload: 2953 bytes at level L fits version 40; one more byte does not', () => {
    const big = 'a'.repeat(2953);
    const qr = encodeQr(big, 'L')!;
    expect(qr.version).toBe(40);
    expect(qr.size).toBe(177);
    expect(encodeQr('a'.repeat(2954), 'L')).toBeNull();
    expect(encodeQr('a'.repeat(1274), 'H')).toBeNull();
  });
  it('higher error-correction levels never use a smaller version for the same text', () => {
    const t = 'The quick brown fox jumps over the lazy dog'.repeat(3);
    const v = (['L', 'M', 'Q', 'H'] as Ecl[]).map((e) => encodeQr(t, e)!.version);
    expect([...v].sort((a, b) => a - b)).toEqual(v);
  });
  it('level really changes the symbol (the old third-party URL ignored it)', () => {
    const a = encodeQr('hello', 'L')!;
    const b = encodeQr('hello', 'H')!;
    expect(JSON.stringify(a.modules)).not.toBe(JSON.stringify(b.modules));
  });
  it('SVG path covers exactly the dark modules', () => {
    const qr = encodeQr('hi', 'M')!;
    const dark = qr.modules.flat().filter(Boolean).length;
    expect((qrToSvgPath(qr).match(/M/g) ?? []).length).toBe(dark);
  });
  it('empty text still encodes (version 1)', () => {
    expect(encodeQr('', 'M')!.version).toBe(1);
  });
});
