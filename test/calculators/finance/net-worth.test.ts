import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/net-worth/index';
import { getValue, parseNumber, parseMoney, near } from '../../helpers';

describe('net-worth', () => {
  it('calculates net worth from assets and liabilities', () => {
    const r = config.calculate({
      cash: '15000',
      investments: '50000',
      retirement: '80000',
      realEstate: '300000',
      otherAssets: '10000',
      mortgage: '220000',
      carLoans: '12000',
      studentLoans: '25000',
      creditCardDebt: '3000',
      otherDebts: '5000',
    });
    const totalAssets = 15000 + 50000 + 80000 + 300000 + 10000;
    const totalLiabilities = 220000 + 12000 + 25000 + 3000 + 5000;
    const expectedNet = totalAssets - totalLiabilities;

    expect(r).toHaveLength(4);
    near(parseMoney(getValue(r, 'netWorth')), expectedNet);
    near(parseMoney(getValue(r, 'totalAssets')), totalAssets);
    near(parseMoney(getValue(r, 'totalLiabilities')), totalLiabilities);
    // Debt-to-asset ratio: (265000 / 455000) * 100 ≈ 58.2%
    near(parseNumber(getValue(r, 'debtToAsset')), 58.2, 0.1);
  });

  it('handles negative net worth', () => {
    const r = config.calculate({
      cash: '10000',
      mortgage: '300000',
      carLoans: '50000',
    });
    near(parseMoney(getValue(r, 'netWorth')), -340000);
    expect(getValue(r, 'netWorth')).toContain('-');
  });

  it('handles zero assets and zero liabilities', () => {
    const r = config.calculate({
      cash: '0',
      investments: '0',
      retirement: '0',
      realEstate: '0',
      otherAssets: '0',
      mortgage: '0',
      carLoans: '0',
      studentLoans: '0',
      creditCardDebt: '0',
      otherDebts: '0',
    });
    expect(r).toHaveLength(0);
  });

  it('handles empty input object', () => {
    const r = config.calculate({});
    expect(r).toHaveLength(0);
  });

  it('handles partial inputs (only assets)', () => {
    const r = config.calculate({
      cash: '50000',
      investments: '100000',
    });
    near(parseMoney(getValue(r, 'netWorth')), 150000);
    near(parseMoney(getValue(r, 'totalLiabilities')), 0);
    near(parseNumber(getValue(r, 'debtToAsset')), 0);
  });

  it('handles partial inputs (only liabilities)', () => {
    const r = config.calculate({
      mortgage: '100000',
      creditCardDebt: '5000',
    });
    near(parseMoney(getValue(r, 'netWorth')), -105000);
    near(parseNumber(getValue(r, 'debtToAsset')), 100);
  });

  it('computes debt-to-asset ratio correctly at boundary', () => {
    // 50% exactly
    const r = config.calculate({
      cash: '100000',
      mortgage: '50000',
    });
    near(parseNumber(getValue(r, 'debtToAsset')), 50);
  });
});

import { getValue as gvNw } from '../../helpers';
import { parseAmount } from '../../../src/utils/calcResults';

describe('net worth audit', () => {
  // Michael: assets 15+50+80+300+10 = 455,000; liabilities 220+12+3 = 235,000; NW 220,000; 235/455 = 51.648% -> 51.6%
  const michael = { cash: '15000', investments: '50000', retirement: '80000', realEstate: '300000', otherAssets: '10000', mortgage: '220000', carLoans: '12000', creditCardDebt: '3000' };
  it('worked example 1 (Michael)', () => {
    const r = config.calculate(michael);
    expect(gvNw(r, 'totalAssets')).toBe('$455,000.00');
    expect(gvNw(r, 'totalLiabilities')).toBe('$235,000.00');
    expect(gvNw(r, 'netWorth')).toBe('$220,000.00');
    expect(gvNw(r, 'debtToAsset')).toBe('51.6%');
  });
  // Aisha: assets 8+15+18 = 41,000; liabilities 8+22+2 = 32,000; NW 9,000; 32/41 = 78.05% -> 78.0%
  it('worked example 2 (Aisha)', () => {
    const r = config.calculate({ cash: '8000', retirement: '15000', otherAssets: '18000', carLoans: '8000', studentLoans: '22000', creditCardDebt: '2000' });
    expect(gvNw(r, 'netWorth')).toBe('$9,000.00');
    expect(gvNw(r, 'debtToAsset')).toBe('78.0%');
  });
  it('negative net worth keeps its sign when re-parsed (panel used to strip the minus and show it as positive)', () => {
    const r = config.calculate({ cash: '1000', studentLoans: '6000' });
    expect(gvNw(r, 'netWorth')).toBe('-$5,000.00');
    expect(parseAmount(gvNw(r, 'netWorth'))).toBe(-5000);
  });
});
