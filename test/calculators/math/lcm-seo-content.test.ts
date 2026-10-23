import { describe, it, expect } from 'vitest';
import lcmConfig from '../../../src/calculators/math/lcm';

// Oracle values from Python: a * b // math.gcd(a, b)
const PAIRS: Array<[number, number, string]> = [
  [4, 6, '12'], [6, 8, '24'], [8, 12, '24'], [9, 12, '36'], [12, 18, '36'],
  [15, 20, '60'], [14, 21, '42'], [18, 24, '72'], [20, 30, '60'], [24, 36, '72'],
];

describe('lcm reference table and search-intent FAQs', () => {
  it('lists the common pairs with the independently computed LCMs', () => {
    const ref = lcmConfig.educational!.quickReference!;
    for (const [a, b, lcm] of PAIRS) {
      expect(ref.find((r) => r.label === `LCM(${a}, ${b})`)?.value).toBe(lcm);
    }
  });

  it('answers the lowest-common-multiple, how-on-a-calculator, ladder and 12-and-18 questions', () => {
    const q = lcmConfig.educational!.faqs!.map((f) => f.question);
    expect(q).toEqual(expect.arrayContaining([
      'Is the lowest common multiple the same as the least common multiple?',
      'How do I find the LCM on a calculator?',
      'What is the division (ladder) method for LCM?',
      'What is the LCM of 12 and 18?',
    ]));
  });

  it('the ladder example in the FAQ multiplies to the real LCM of 12 and 18', () => {
    expect(2 * 2 * 3 * 3).toBe(36);
    expect(lcmConfig.calculate({ numbers: '12, 18' })[0].value).toBe('36');
  });
});

import { analyzeLcm, ladderMethod } from '../../../src/calculators/math/lcm/lcmMath';

describe('ladder (division) method', () => {
  // Expected rows worked by hand and checked with Python: divide by a prime that divides at least one entry until all are 1.
  it('12 and 18', () => {
    expect(ladderMethod([12n, 18n])).toEqual({
      start: [12, 18],
      rows: [
        { divisor: 2, values: [6, 9] },
        { divisor: 2, values: [3, 9] },
        { divisor: 3, values: [1, 3] },
        { divisor: 3, values: [1, 1] },
      ],
    });
  });

  it('8, 12 and 20', () => {
    const r = ladderMethod([8n, 12n, 20n])!;
    expect(r.rows.map((x) => x.divisor)).toEqual([2, 2, 2, 3, 5]);
    expect(r.rows.map((x) => x.values)).toEqual([[4, 6, 10], [2, 3, 5], [1, 3, 5], [1, 1, 5], [1, 1, 1]]);
  });

  it('24 and 300 (the worked example on the page)', () => {
    const r = ladderMethod([24n, 300n])!;
    expect(r.rows.map((x) => x.divisor)).toEqual([2, 2, 2, 3, 5, 5]);
    expect(r.rows.map((x) => x.values)).toEqual([[12, 150], [6, 75], [3, 75], [1, 25], [1, 5], [1, 1]]);
  });

  it('the product of the divisors is the LCM for every pair from 1 to 60', () => {
    for (let a = 1n; a <= 60n; a++) {
      for (let b = a; b <= 60n; b++) {
        const r = ladderMethod([a, b])!;
        const product = r.rows.reduce((p, row) => p * BigInt(row.divisor), 1n);
        expect(product).toBe(analyzeLcm([a, b]).lcm);
      }
    }
  });

  it('returns null for numbers too large to factor exactly, and for ladders too long to read', () => {
    expect(ladderMethod([2n ** 60n, 3n])).toBeNull();
    expect(ladderMethod([2n ** 40n, 3n ** 20n], 10)).toBeNull();
  });
});

describe('content added after comparing with the page-1 competitors', () => {
  const edu = lcmConfig.educational!;

  it('lists the LCM properties', () => {
    const labels = edu.quickReference!.map((r) => r.label);
    expect(labels).toEqual(expect.arrayContaining(['Commutative', 'Associative', 'With 1 or itself', 'Scaling', 'Common multiples']));
  });

  it('every worked example result matches the calculator', () => {
    for (const ex of edu.workedExamples!) {
      const lcm = lcmConfig.calculate(ex.inputs as Record<string, string>)[0].value;
      expect(ex.result.replace(/,/g, '')).toContain(`= ${lcm}`.replace(/,/g, ''));
    }
  });

  it('answers the GCF/GCD, only-two-numbers, decimals and Venn questions', () => {
    const q = edu.faqs!.map((f) => f.question);
    expect(q).toEqual(expect.arrayContaining([
      'Is GCF the same as GCD?',
      'Why does GCF × LCM = a × b only work for two numbers?',
      'What is the LCM of a number and 1, or of a number and itself?',
      'How do I find the LCM of decimals?',
      'How does the Venn diagram method find the LCM?',
    ]));
  });

  it('the numbers quoted in the new FAQs are right', () => {
    const { lcm, gcd } = analyzeLcm([12n, 18n, 30n]);
    expect(lcm * gcd).toBe(1080n);
    expect(12 * 18 * 30).toBe(6480);
    expect(analyzeLcm([12n, 8n]).lcm).toBe(24n); // 1.2 and 0.8 scaled by 10, then 24 / 10 = 2.4
    expect(analyzeLcm([6n, 18n]).lcm).toBe(18n);
  });
});
