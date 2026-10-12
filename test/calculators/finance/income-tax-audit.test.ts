import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/income-tax/index';
import { calcFederalTax, computeIncomeTax, STATE_RATES_2025, RETIREMENT_LIMITS_2025 } from '../../../src/calculators/finance/income-tax/taxData';
import { getValue, parseMoney } from '../../helpers';

// "The Tax Is" figures are copied from IRS Rev. Proc. 2025-32 section 3.01, Tables 1-4 (tax year 2026).
describe('income-tax audit: Rev. Proc. 2025-32 tables', () => {
  const cases: Array<[string, 'single' | 'mfj' | 'hoh' | 'mfs', number, number]> = [
    ['single', 'single', 12_400, 1_240],
    ['single', 'single', 50_400, 5_800],
    ['single', 'single', 105_700, 17_966],
    ['single', 'single', 201_775, 41_024],
    ['single', 'single', 256_225, 58_448],
    ['single', 'single', 640_600, 192_979.25],
    ['mfj', 'mfj', 24_800, 2_480],
    ['mfj', 'mfj', 100_800, 11_600],
    ['mfj', 'mfj', 211_400, 35_932],
    ['mfj', 'mfj', 403_550, 82_048],
    ['mfj', 'mfj', 512_450, 116_896],
    ['mfj', 'mfj', 768_700, 206_583.5],
    ['hoh', 'hoh', 17_700, 1_770],
    ['hoh', 'hoh', 67_450, 7_740],
    ['hoh', 'hoh', 105_700, 16_155],
    ['hoh', 'hoh', 201_750, 39_207],
    ['hoh', 'hoh', 256_200, 56_631],
    ['hoh', 'hoh', 640_600, 191_171],
    ['mfs', 'mfs', 384_350, 103_291.75],
  ];
  for (const [label, status, income, tax] of cases) {
    it(`${label}: tax on $${income.toLocaleString()} = $${tax.toLocaleString()}`, () => {
      expect(calcFederalTax(income, status).tax).toBeCloseTo(tax, 2);
    });
  }

  it('standard deductions: single 16,100; MFJ 32,200; HOH 24,150; MFS 16,100', () => {
    const base = { gross: 100000, stateCode: 'TX', retirement401k: 0, health: 0, otherPreTax: 0 };
    expect(computeIncomeTax({ ...base, status: 'single' }).standardDeduction).toBe(16100);
    expect(computeIncomeTax({ ...base, status: 'mfj' }).standardDeduction).toBe(32200);
    expect(computeIncomeTax({ ...base, status: 'hoh' }).standardDeduction).toBe(24150);
    expect(computeIncomeTax({ ...base, status: 'mfs' }).standardDeduction).toBe(16100);
  });

  it('2026 retirement limits (IRS Notice 2025-67)', () => {
    expect(RETIREMENT_LIMITS_2025.traditional401k).toBe(24500);
    expect(RETIREMENT_LIMITS_2025.catchUp401k).toBe(8000);
    expect(RETIREMENT_LIMITS_2025.superCatchUp401k).toBe(11250);
    expect(RETIREMENT_LIMITS_2025.traditionalIRA).toBe(7500);
  });
});

describe('income-tax audit: worked examples', () => {
  it('Jake: $75k, 401k $6k, health $3k, Texas -> fed $5,740, FICA $5,508, take-home $54,752', () => {
    const r = config.calculate({ grossIncome: '75000', filingStatus: 'single', state: 'TX', retirement401k: '6000', healthInsurance: '3000', otherPreTax: '0' });
    expect(getValue(r, 'federalTax')).toContain('$5,740.00');
    expect(getValue(r, 'ficaTotal')).toBe('$5,508.00'); // 72,000 x 7.65%: 401(k) stays in FICA wages
    expect(getValue(r, 'netPay')).toBe('$54,752.00');
    expect(getValue(r, 'effectiveRate')).toBe('7.65%');
    expect(getValue(r, 'totalEffectiveRate')).toBe('15.00%');
    expect(getValue(r, 'marginalRate')).toBe('12%');
  });

  it('Emily & Ryan: MFJ $185k, 401k $20k, health $6k, HSA $4k, Oregon -> fed $16,440, FICA $13,387.50, take-home $113,237.50', () => {
    const r = config.calculate({ grossIncome: '185000', filingStatus: 'mfj', state: 'OR', retirement401k: '20000', healthInsurance: '6000', otherPreTax: '4000' });
    expect(getValue(r, 'federalTax')).toContain('$16,440.00');
    expect(getValue(r, 'ficaTotal')).toBe('$13,387.50');
    expect(getValue(r, 'netPay')).toBe('$113,237.50');
    expect(parseMoney(getValue(r, 'stateTax').split(' ')[0])).toBeCloseTo(11935, 2); // 7.7% x 155,000
  });

  it('a 401(k) deferral cuts federal tax but not FICA (regression: pro-tip claimed it also lowered FICA)', () => {
    const base = { gross: 100000, status: 'single' as const, stateCode: 'TX', health: 0, otherPreTax: 0 };
    const a = computeIncomeTax({ ...base, retirement401k: 0 });
    const b = computeIncomeTax({ ...base, retirement401k: 10000 });
    expect(b.ficaTotal).toBe(a.ficaTotal);
    expect(a.federalTax - b.federalTax).toBeCloseTo(2200, 6); // 22% bracket
    // health premiums DO cut FICA
    const c = computeIncomeTax({ ...base, retirement401k: 0, health: 1000 });
    expect(a.ficaTotal - c.ficaTotal).toBeCloseTo(76.5, 6);
  });

  it('$100k single is in the 22% bracket; federal + FICA is about 21% of gross (pro-tip)', () => {
    const t = computeIncomeTax({ gross: 100000, status: 'single', stateCode: 'TX', retirement401k: 0, health: 0, otherPreTax: 0 });
    expect(t.marginalRate).toBe(0.22);
    expect(t.federalTax).toBeCloseTo(13170, 6); // 1,240 + 12% x 38,000 + 22% x 33,500
    expect((t.federalTax + t.ficaTotal) / 100000).toBeCloseTo(0.2082, 4);
  });

  it('$75k single, standard deduction only: 22% bracket, effective federal rate about 10% (FAQ)', () => {
    const t = computeIncomeTax({ gross: 75000, status: 'single', stateCode: 'TX', retirement401k: 0, health: 0, otherPreTax: 0 });
    expect(t.marginalRate).toBe(0.22);
    expect(t.federalTax).toBeCloseTo(7670, 6);
    expect(t.effectiveRate).toBeCloseTo(10.23, 2);
  });

  it('Social Security stops at the $184,500 wage base; Additional Medicare 0.9% above $200k (single)', () => {
    const t = computeIncomeTax({ gross: 300000, status: 'single', stateCode: 'TX', retirement401k: 0, health: 0, otherPreTax: 0 });
    expect(t.ss).toBeCloseTo(184500 * 0.062, 6);
    expect(t.medicare).toBeCloseTo(300000 * 0.0145, 6);
    expect(t.additionalMedicare).toBeCloseTo(100000 * 0.009, 6);
  });

  it('2026 flat state rates (Tax Foundation, Jan 1 2026)', () => {
    expect(STATE_RATES_2025.GA.rate).toBe(0.0519);
    expect(STATE_RATES_2025.ID.rate).toBe(0.053);
    expect(STATE_RATES_2025.IN.rate).toBe(0.0295);
    expect(STATE_RATES_2025.KY.rate).toBe(0.035);
    expect(STATE_RATES_2025.NC.rate).toBe(0.0399);
    expect(STATE_RATES_2025.OH.rate).toBe(0.0275);
    expect(STATE_RATES_2025.PA.rate).toBe(0.0307);
    const r = config.calculate({ grossIncome: '100000', filingStatus: 'single', state: 'NC', retirement401k: '0' });
    expect(getValue(r, 'stateTax')).toBe('$3,990.00 (3.99% effective rate)');
  });

  it('invalid or blank gross returns []', () => {
    expect(config.calculate({ grossIncome: '0', filingStatus: 'single', state: 'TX' })).toEqual([]);
    expect(config.calculate({ filingStatus: 'single', state: 'TX' })).toEqual([]);
  });
});
