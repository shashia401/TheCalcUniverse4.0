import { describe, it, expect } from 'vitest';
import lcmConfig from '../../../src/calculators/math/lcm';
import { analyzeLcm, analyzeLcmFractions, fractionText, parseLcmFractionInput } from '../../../src/calculators/math/lcm/lcmMath';
import { getCalculatorById } from '../../../src/calculators/registry';

// Expected values come from an independent Python run with fractions.Fraction:
// LCM = lcm(numerators) / gcd(denominators) for fractions in lowest terms, LCD = lcm(denominators).
const CASES: Array<{ input: string; lcm: string; lcd: string; times: string[] }> = [
  { input: '1/2, 3/4', lcm: '3/2', lcd: '4', times: ['3', '2'] },
  { input: '1/6, 1/8', lcm: '1/2', lcd: '24', times: ['3', '4'] },
  { input: '2/3, 4/9', lcm: '4/3', lcd: '9', times: ['2', '3'] },
  { input: '5/6, 7/15, 3/10', lcm: '105', lcd: '30', times: ['126', '225', '350'] },
  { input: '3/4, 5', lcm: '15', lcd: '4', times: ['20', '3'] },
  { input: '2/4, 3/6', lcm: '1/2', lcd: '2', times: ['1', '1'] },
];

const value = (rows: ReturnType<typeof lcmConfig.calculate>, id: string) => rows.find((r) => r.id === id)?.value;

describe('LCM of fractions', () => {
  for (const c of CASES) {
    it(`${c.input}: LCM ${c.lcm}, LCD ${c.lcd}`, () => {
      const rows = lcmConfig.calculate({ numbers: c.input });
      expect(value(rows, 'result')).toBe(c.lcm);
      expect(value(rows, 'lcd')).toBe(c.lcd);
      const parsed = parseLcmFractionInput(c.input);
      if (parsed.kind !== 'ok') throw new Error('expected ok');
      expect(analyzeLcmFractions(parsed.fractions).times.map(String)).toEqual(c.times);
    });
  }

  it('shows the fractions over the LCD and a decimal', () => {
    const rows = lcmConfig.calculate({ numbers: '1/2, 3/4' });
    expect(value(rows, 'overLcd')).toBe('2/4, 3/4');
    expect(value(rows, 'lcmDecimal')).toBe('1.5');
    expect(value(lcmConfig.calculate({ numbers: '5/6, 7/15, 3/10' }), 'lcmDecimal')).toBeUndefined();
  });

  it('the LCM is a whole number of each fraction and is in lowest terms (numerators and denominators 1 to 8)', () => {
    for (let a = 1n; a <= 8n; a++) for (let b = 1n; b <= 8n; b++) for (let c = 1n; c <= 8n; c++) for (let d = 1n; d <= 8n; d++) {
      const parsed = parseLcmFractionInput(`${a}/${b}, ${c}/${d}`);
      if (parsed.kind !== 'ok') throw new Error('expected ok');
      const { lcm, times } = analyzeLcmFractions(parsed.fractions);
      expect(times.every((t) => t >= 1n)).toBe(true);
      expect(analyzeLcm([lcm.n, lcm.d]).gcd).toBe(1n);
    }
  });

  it('plain whole numbers still take the integer path', () => {
    expect(parseLcmFractionInput('12, 18, 24').kind).toBe('none');
    expect(value(lcmConfig.calculate({ numbers: '12, 18, 24' }), 'result')).toBe('72');
  });

  it('rejects bad fraction input with a message and no steps', () => {
    for (const bad of ['1/0, 1/2', '0/3, 1/2', '1/2, abc', '1/2/3, 1/4', '-1/2, 1/3']) {
      const rows = lcmConfig.calculate({ numbers: bad });
      expect(rows[0]?.id).toBe('error');
      expect(lcmConfig.explainSteps!({ numbers: bad })).toEqual([]);
    }
    expect(lcmConfig.calculate({ numbers: '1/2' })).toEqual([]);
  });

  it('explainSteps walks through the numerators, the denominators and the check', () => {
    const steps = lcmConfig.explainSteps!({ numbers: '1/2, 3/4' });
    expect(steps.map((s) => s.expr)).toEqual([
      '1/2, 3/4',
      'LCM(1/2, 3/4)',
      'LCM(1, 3) = 3',
      'GCD(2, 4) = 2',
      '3 ÷ 2 = 3/2',
      '3/2 = 3 × 1/2, 3/2 = 2 × 3/4',
    ]);
    expect(lcmConfig.explainSteps!({ numbers: '2/4, 3/6' })[0].label).toBe('Write every fraction in lowest terms');
  });

  it('fractionText prints whole numbers without a denominator', () => {
    expect(fractionText({ n: 15n, d: 1n })).toBe('15');
    expect(fractionText({ n: 3n, d: 2n })).toBe('3/2');
  });
});

describe('answers to the questions people search for (Python oracle)', () => {
  const ref = lcmConfig.educational!.quickReference!;
  const row = (label: string) => ref.find((r) => r.label === label)?.value;

  it('the quick-reference table has the searched LCMs', () => {
    expect(row('LCM(5, 8)')).toBe('40');
    expect(row('LCM(7, 4)')).toBe('28');
    expect(row('LCM(7, 12)')).toBe('84');
    expect(row('LCM(24, 35)')).toBe('840');
    expect(row('LCM(24, 42)')).toBe('168');
    expect(row('LCM(3, 8, 12)')).toBe('24');
    expect(row('LCM(24, 36, 48)')).toBe('144');
    expect(row('LCM(60, 72, 80)')).toBe('720');
    expect(row('LCM of 1 to 10')).toBe('2520');
    expect(row('LCM of 2 to 7')).toBe('420');
    expect(row('LCM(24, 36)')).toBe('72');
  });

  it('the FAQ covers fractions, step by step, fastest, 1 to 10, 7 x 11 x 13, HCF + LCM and common multiples', () => {
    const q = lcmConfig.educational!.faqs!.map((f) => f.question);
    expect(q).toEqual(expect.arrayContaining([
      'How do I find the LCM of fractions?',
      'Is the LCM of fractions the same as the least common denominator (LCD)?',
      'How do I find the LCM step by step?',
      'What is the fastest way to find the LCM?',
      'What is the LCM of the numbers 1 to 10?',
      'What is the 7 × 11 × 13 trick?',
      'What is the sum of the HCF and LCM of 8 and 12?',
      'What are the common multiples of 6 and 9?',
    ]));
  });

  it('numbers quoted in those answers are right', () => {
    expect(7 * 11 * 13).toBe(1001);
    expect(123 * 1001).toBe(123123);
    const { gcd, lcm } = analyzeLcm([8n, 12n]);
    expect(gcd + lcm).toBe(28n);
    expect(gcd * lcm).toBe(96n);
    expect(analyzeLcm([6n, 9n]).lcm).toBe(18n);
    expect(analyzeLcm([24n, 36n]).gcd).toBe(12n);
  });

  it('registry: the title leads with the keyword, fits in 60 characters and the keywords are listed', () => {
    const entry = getCalculatorById('lcm-calculator')!;
    expect(entry.title.startsWith('LCM Calculator')).toBe(true);
    expect(entry.title.length).toBeLessThanOrEqual(60);
    for (const k of ['lcm of fractions calculator', 'lcm calculator with fractions', 'lcm calculator cake method', 'lcm gcf calculator']) {
      expect(entry.seoKeywords).toContain(k);
    }
  });
});
