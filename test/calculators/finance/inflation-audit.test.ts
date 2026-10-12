import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/inflation/index';
import { CPI_DATA, PARTIAL_YEARS, MAX_YEAR } from '../../../src/calculators/finance/inflation/cpiData';
import { getValue, parseMoney } from '../../helpers';

describe('inflation audit: data', () => {
  it('BLS CPI-U annual averages (1982-84=100) for spot years', () => {
    // BLS annual averages: 1913 9.9, 1980 82.4, 1990 130.7, 2000 172.2, 2010 218.056, 2020 258.811,
    // 2021 270.970, 2022 292.655, 2023 304.702, 2024 313.689
    expect(CPI_DATA[1913]).toBe(9.9);
    expect(CPI_DATA[1980]).toBe(82.4);
    expect(CPI_DATA[1990]).toBe(130.7);
    expect(CPI_DATA[2000]).toBe(172.2);
    expect(CPI_DATA[2010]).toBeCloseTo(218.056, 0);
    expect(CPI_DATA[2021]).toBeCloseTo(270.97, 1); // was 270.9
    expect(CPI_DATA[2022]).toBeCloseTo(292.655, 1);
    expect(CPI_DATA[2023]).toBeCloseTo(304.702, 1);
    expect(CPI_DATA[2024]).toBeCloseTo(313.689, 1); // was 313.5
  });

  it('2025 is the mean of the 11 published months (321.943) and 2026 the Jan-Aug mean (331.655), flagged as partial', () => {
    const m25 = [317.671, 319.082, 319.799, 320.795, 321.465, 322.561, 323.048, 323.976, 324.8, 324.122, 324.054];
    const m26 = [325.252, 326.785, 330.213, 333.02, 335.123, 333.952, 333.918, 334.98];
    const mean = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length;
    expect(CPI_DATA[2025]).toBeCloseTo(mean(m25), 0);
    expect(CPI_DATA[2026]).toBeCloseTo(mean(m26), 0);
    expect(MAX_YEAR).toBe(2026);
    expect(PARTIAL_YEARS[2026]).toBeTruthy();
    // the 2026 option is labelled as a partial year
    const endOpts = config.inputs.find((i) => i.id === 'endYear')!.options!;
    expect(endOpts.find((o) => o.value === '2026')!.label).toContain('Jan–Aug');
  });
});

describe('inflation audit: results', () => {
  it('Maria: $10,000 in 1990 -> 2024 = $24,002 (130.7 -> 313.7); $50,000 salary -> about $120,008', () => {
    const r = config.calculate({ amount: '10000', startYear: '1990', endYear: '2024' });
    expect(getValue(r, 'adjustedAmount')).toBe('$24,001.53');
    expect(parseMoney(getValue(config.calculate({ amount: '50000', startYear: '1990', endYear: '2024' }), 'adjustedAmount'))).toBeCloseTo(120007.65, 2);
  });

  it('James: $500,000 in 2000 -> 2026 = $963,124; cumulative +92.62%; 2.553%/yr', () => {
    const r = config.calculate({ amount: '500000', startYear: '2000', endYear: '2026' });
    expect(getValue(r, 'adjustedAmount')).toBe('$963,124.27');
    expect(getValue(r, 'cumulativeRate')).toBe('+92.62%');
    expect(getValue(r, 'avgAnnualRate')).toBe('2.553% per year');
    expect(r.find((x) => x.id === 'adjustedAmount')!.interpretation).toContain('Jan–Aug');
  });

  it('purchasing power loss going forward is positive: 1990 -> 2024 means 58.3% less buying power (regression: showed "-58.3% less today")', () => {
    const r = config.calculate({ amount: '100', startYear: '1990', endYear: '2024' });
    expect(getValue(r, 'purchasingPower')).toBe('58.3% less buying power'); // 1 - 130.7/313.7
  });

  it('going backwards, average inflation is the positive rate and the text says prices were lower (regression: "deflationary period")', () => {
    const r = config.calculate({ amount: '100', startYear: '2020', endYear: '1990' });
    // (258.8 / 130.7)^(1/30) - 1 = 2.303%/yr
    expect(getValue(r, 'avgAnnualRate')).toBe('2.303% per year');
    expect(getValue(r, 'purchasingPower')).toBe('98.0% more buying power'); // 258.8/130.7 - 1
    const text = r.find((x) => x.id === 'adjustedAmount')!.interpretation!;
    expect(text).toContain('Prices in 1990 were 49% lower than in 2020');
    expect(text).not.toContain('deflationary');
  });

  it('same year: no change, no interpretation', () => {
    const r = config.calculate({ amount: '100', startYear: '2000', endYear: '2000' });
    expect(getValue(r, 'adjustedAmount')).toBe('$100.00');
    expect(r.find((x) => x.id === 'adjustedAmount')!.interpretation).toBeUndefined();
  });

  it('diagram/FAQ constants: 3% inflation leaves $100 at $74, $55, $41 after 10/20/30 years and halves in 23.4 years', () => {
    expect(100 / 1.03 ** 10).toBeCloseTo(74.4, 1);
    expect(100 / 1.03 ** 20).toBeCloseTo(55.4, 1);
    expect(100 / 1.03 ** 30).toBeCloseTo(41.2, 1);
    expect(Math.log(2) / Math.log(1.03)).toBeCloseTo(23.4, 1);
  });
});
