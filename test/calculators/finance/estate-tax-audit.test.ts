import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/estate-tax/index';
import { scheduleTax, federalEstateTax, computeEstate } from '../../../src/calculators/finance/estate-tax/estateMath';
import { getValue, parseMoney } from '../../helpers';

// IRC §2001(c): tax on $1,000,000 = $345,800 (18% ... 39% brackets), 40% above that.
describe('estate-tax audit', () => {
  it('unified schedule: $1,000,000 -> $345,800; $15,000,000 -> $5,945,800', () => {
    expect(scheduleTax(1_000_000)).toBe(345_800);
    expect(scheduleTax(15_000_000)).toBe(345_800 + 0.4 * 14_000_000);
  });

  it('every dollar over a $15M exemption is taxed at 40% (regression: old code ran the 18-39% brackets on the excess, so $1M over paid $345,800 instead of $400,000)', () => {
    expect(federalEstateTax(16_000_000, 15_000_000)).toBeCloseTo(400_000, 6);
    expect(federalEstateTax(19_800_000, 15_000_000)).toBeCloseTo(1_920_000, 6);
    expect(federalEstateTax(15_000_000, 15_000_000)).toBe(0);
    const r = config.calculate({ totalAssets: '16000000', debtsDeductions: '0', filingStatus: 'single', stateResidence: 'none' });
    expect(parseMoney(getValue(r, 'federalTax'))).toBeCloseTo(400_000, 0);
  });

  it('SVG example: $20M estate, $0.2M debts -> taxable $4.8M, tax $1.92M, net $17.88M', () => {
    const r = config.calculate({ totalAssets: '20000000', debtsDeductions: '200000', filingStatus: 'single', stateResidence: 'none' });
    expect(getValue(r, 'federalTaxableEstate')).toBe('$4.80M');
    expect(getValue(r, 'federalTax')).toBe('$1.92M');
    expect(getValue(r, 'netToHeirs')).toBe('$17.88M');
    expect(getValue(r, 'effectiveRate')).toBe('9.70%'); // 1.92 / 19.8
  });

  it('Robert (Oregon): $5.45M adjusted, $1M exemption, 16% x 0.5 convention = $356,000; net $5.09M; no federal tax', () => {
    const r = config.calculate({ totalAssets: '5800000', debtsDeductions: '350000', filingStatus: 'single', stateResidence: 'OR' });
    expect(parseMoney(getValue(r, 'stateTax'))).toBe(356_000);
    expect(parseMoney(getValue(r, 'federalTax'))).toBe(0);
    expect(getValue(r, 'netToHeirs')).toBe('$5.09M');
  });

  it('Sullivans (Connecticut, married): $17.9M, CT exemption $15M, state tax $174,000, net $17.73M', () => {
    const r = config.calculate({ totalAssets: '18500000', debtsDeductions: '600000', filingStatus: 'married', stateResidence: 'CT' });
    expect(getValue(r, 'notice')).toBe('$30.00M');
    expect(parseMoney(getValue(r, 'stateTax'))).toBe(174_000);
    expect(getValue(r, 'netToHeirs')).toBe('$17.73M');
  });

  it('state death tax is deductible from the federal taxable estate (IRC §2058)', () => {
    // Single, Oregon, $20M: state tax = (20M - 1M) x 16% x 0.5 = 1,520,000; federal base = 18.48M; fed tax = 40% x 3.48M
    const e = computeEstate({ totalAssets: 20_000_000, debts: 0, married: false, spouseEstate: 0, stateKey: 'OR' });
    expect(e.stateTax).toBeCloseTo(1_520_000, 6);
    expect(e.federalTax).toBeCloseTo(0.4 * 3_480_000, 6);
    expect(e.totalTax).toBeCloseTo(1_520_000 + 1_392_000, 6);
  });

  it('married: the spouse estate is added (second death) and the exemption doubles', () => {
    const solo = computeEstate({ totalAssets: 20_000_000, debts: 0, married: true, spouseEstate: 0, stateKey: 'none' });
    expect(solo.federalTax).toBe(0); // 20M < 30M
    const combined = computeEstate({ totalAssets: 20_000_000, debts: 0, married: true, spouseEstate: 15_000_000, stateKey: 'none' });
    expect(combined.gross).toBe(35_000_000);
    expect(combined.federalTax).toBeCloseTo(0.4 * 5_000_000, 6);
    // single filers ignore the spouse field
    const single = computeEstate({ totalAssets: 20_000_000, debts: 0, married: false, spouseEstate: 15_000_000, stateKey: 'none' });
    expect(single.gross).toBe(20_000_000);
  });

  it('Washington uses the 2026 DOR exclusion ($3M) and the restored 20% top rate', () => {
    const e = computeEstate({ totalAssets: 5_000_000, debts: 0, married: false, spouseEstate: 0, stateKey: 'WA' });
    expect(e.stateTax).toBeCloseTo(2_000_000 * 0.2 * 0.5, 6);
  });
});
