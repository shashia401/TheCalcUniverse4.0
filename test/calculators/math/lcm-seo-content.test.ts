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
