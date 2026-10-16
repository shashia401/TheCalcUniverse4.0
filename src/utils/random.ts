/**
 * Unbiased random integers from crypto.getRandomValues() by rejection sampling (no `% n` modulo bias,
 * never Math.random). The entropy source is injectable so tests can supply a deterministic stream.
 */

/** Returns one uniformly distributed unsigned 32-bit integer. */
export type RandomU32 = () => number;

export const cryptoU32: RandomU32 = () => {
  const a = new Uint32Array(1);
  globalThis.crypto.getRandomValues(a);
  return a[0];
};

const TWO32 = 4294967296;

/** Uniform integer in [0, n) for 1 <= n <= 2^53, exactly unbiased. */
export function randomBelow(n: number, u32: RandomU32 = cryptoU32): number {
  if (!Number.isInteger(n) || n < 1 || n > 2 ** 53) throw new RangeError('randomBelow: n must be an integer in [1, 2^53]');
  if (n === 1) return 0;
  if (n <= TWO32) {
    // Accept only draws below the largest multiple of n that fits in 2^32; the rest would favour small residues.
    const limit = TWO32 - (TWO32 % n);
    for (;;) {
      const x = u32();
      if (x < limit) return x % n;
    }
  }
  // 2^32 < n <= 2^53: build a 53-bit value (21 high bits + 32 low bits) and reject above the multiple of n.
  const SPAN = 2 ** 53;
  const limit = SPAN - (SPAN % n);
  for (;;) {
    const x = (u32() & 0x1fffff) * TWO32 + u32();
    if (x < limit) return x % n;
  }
}

/** Uniform integer in [min, max] (both inclusive, safe integers, max - min < 2^53). */
export function randomInt(min: number, max: number, u32: RandomU32 = cryptoU32): number {
  return min + randomBelow(max - min + 1, u32);
}

/** `count` distinct integers from [min, max] via a partial Fisher-Yates shuffle (needs count <= max-min+1). */
export function randomDistinctInts(min: number, max: number, count: number, u32: RandomU32 = cryptoU32): number[] {
  const size = max - min + 1;
  if (count > size) throw new RangeError('randomDistinctInts: count exceeds range size');
  // Sparse Fisher-Yates: only touched slots are stored, so a range of 10^12 costs O(count) memory.
  const swapped = new Map<number, number>();
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    const j = i + randomBelow(size - i, u32);
    const vj = swapped.get(j) ?? j;
    const vi = swapped.get(i) ?? i;
    swapped.set(j, vi);
    out.push(min + vj);
  }
  return out;
}
