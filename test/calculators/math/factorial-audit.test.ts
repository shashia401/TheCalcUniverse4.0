import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/factorial-calculator/index';
import { factorialBig, factorialTrailingZeros, groupDigits, bigToScientific, fibonacciSequenceBig } from '../../../src/utils/bigMath';
import { getValue } from '../../helpers';

// Reference values: Python math.factorial / str().
const F170 =
  '7,257,415,615,307,998,967,396,728,211,129,263,114,716,991,681,296,451,376,543,577,798,900,561,843,401,706,157,852,350,749,242,617,459,511,490,991,237,838,520,776,666,022,565,442,753,025,328,900,773,207,510,902,400,430,280,058,295,603,966,612,599,658,257,104,398,558,294,257,568,966,313,439,612,262,571,094,946,806,711,205,568,880,457,193,340,212,661,452,800,000,000,000,000,000,000,000,000,000,000,000,000,000';

describe('factorial is exact (audit)', () => {
  it('25! is exact (a double rounds it to 15,511,210,043,330,986,000,000,000)', () => {
    const r = config.calculate({ n: '25' });
    expect(getValue(r, 'factorial')).toBe('15,511,210,043,330,985,984,000,000');
    expect(getValue(r, 'digitCount')).toBe('26');
    expect(getValue(r, 'trailingZeros')).toBe('6');
  });
  it('170! prints all 307 digits exactly (the double gives 7.257415615307994e306, wrong from the 15th digit)', () => {
    const r = config.calculate({ n: '170' });
    expect(getValue(r, 'factorial')).toBe(F170);
    expect(getValue(r, 'digitCount')).toBe('307');
    expect(getValue(r, 'trailingZeros')).toBe('41');
    expect(getValue(r, 'scientific')).toBe('7.257416e+306');
  });
  it('accepts up to 1000: 1000! has 2568 digits and 249 trailing zeros', () => {
    const r = config.calculate({ n: '1000' });
    expect(getValue(r, 'digitCount')).toBe('2568');
    expect(getValue(r, 'trailingZeros')).toBe('249');
    expect(getValue(r, 'scientific')).toBe('4.023873e+2567');
    expect(getValue(r, 'factorial').replace(/,/g, '').startsWith('402387260077093773543702433923')).toBe(true);
    expect(config.calculate({ n: '1001' })).toEqual([]);
    expect(config.inputs[0].max).toBe(1000);
  });
  it('digit count is exact (no log10 rounding): 10^k boundaries', () => {
    // 22! = 1124000727777607680000 (22 digits); digit counts from Python len(str(n!))
    const want: Record<string, string> = { '22': '22', '24': '24', '50': '65', '100': '158' };
    for (const [n, d] of Object.entries(want)) expect(getValue(config.calculate({ n }), 'digitCount')).toBe(d);
  });
  it('rejects decimals instead of truncating (5.9 used to compute 5!)', () => {
    expect(config.calculate({ n: '5.9' })).toEqual([]);
    expect(config.calculate({ n: '1e2' })).toEqual([]);
  });
  it('long products are abbreviated in the steps row', () => {
    expect(getValue(config.calculate({ n: '20' }), 'steps')).toBe(
      '20 × 19 × 18 × 17 × 16 × 15 × 14 × 13 × 12 × 11 × 10 × 9 × 8 × 7 × 6 × 5 × 4 × 3 × 2 × 1 = 2,432,902,008,176,640,000',
    );
    expect(getValue(config.calculate({ n: '21' }), 'steps')).toBe('21 × 20 × 19 × … × 3 × 2 × 1 = 5.109094e+19 (exact value above)');
  });
});

describe('bigMath helpers', () => {
  it('factorial / zeros / grouping / scientific', () => {
    expect(factorialBig(24)).toBe(620448401733239439360000n);
    expect(factorialTrailingZeros(100)).toBe(24);
    expect(factorialTrailingZeros(4)).toBe(0);
    expect(groupDigits(1234567n)).toBe('1,234,567');
    expect(groupDigits(-1000n)).toBe('-1,000');
    expect(groupDigits(999n)).toBe('999');
    expect(bigToScientific(99999995n, 7)).toBe('1e+8'); // carry: 9.9999995e7 rounds to 1.000000e8
    expect(bigToScientific(123n)).toBe('123');
  });
  it('fibonacciSequenceBig: F(100) = 354224848179261915075 (OEIS A000045)', () => {
    const seq = fibonacciSequenceBig(100);
    expect(seq[0]).toBe(1n);
    expect(seq[1]).toBe(1n);
    expect(seq[99]).toBe(354224848179261915075n);
    expect(seq[77]).toBe(8944394323791464n); // F(78): last Fibonacci number below 2^53
    expect(seq[78]).toBe(14472334024676221n); // F(79) > 2^53
  });
});
