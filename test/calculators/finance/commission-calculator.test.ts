import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/commission';
import { getValue, near, parseMoney } from '../../helpers';

describe('commission', () => {
  it('flat rate: $250,000 sale at 10% = $25,000 commission', () => {
    const r = config.calculate({
      structure: 'flat',
      saleAmount: '250000',
      flatRate: '10',
    });
    near(parseMoney(getValue(r, 'net')), 25000);
    near(parseMoney(getValue(r, 'sale')), 250000);
    expect(getValue(r, 'rate')).toBe('10.00%');
  });

  it('flat rate with base salary: shows total compensation (OTE)', () => {
    const r = config.calculate({
      structure: 'flat',
      saleAmount: '200000',
      flatRate: '8',
      baseSalary: '40000',
    });
    near(parseMoney(getValue(r, 'net')), 16000);
    near(parseMoney(getValue(r, 'baseSalary')), 40000);
    near(parseMoney(getValue(r, 'totalComp')), 56000);
  });

  it('tiered: 2 tiers with sale exceeding all limits', () => {
    const r = config.calculate({
      structure: 'tiered',
      saleAmount: '300000',
      tier1Limit: '50000',
      tier1Rate: '5',
      tier2Limit: '150000',
      tier2Rate: '8',
      tier3Rate: '12',
    });
    // Tier 1: 50000 * 5% = 2500
    // Tier 2: 100000 * 8% = 8000
    // Tier 3: 150000 * 12% = 18000
    // Total: 28500
    near(parseMoney(getValue(r, 'net')), 28500);
  });

  it('tiered: sale below tier 1 limit', () => {
    const r = config.calculate({
      structure: 'tiered',
      saleAmount: '30000',
      tier1Limit: '50000',
      tier1Rate: '5',
    });
    // 30000 * 5% = 1500
    near(parseMoney(getValue(r, 'net')), 1500);
  });

  it('real estate split: sale $400,000, 6% gross, 60% agent split', () => {
    const r = config.calculate({
      structure: 'realestate',
      saleAmount: '400000',
      reGrossPct: '6',
      reAgentSplitPct: '60',
    });
    // Total comm: 400000 * 6% = 24000
    // Side comm: 12000
    // Agent take-home: 12000 * 60% = 7200
    near(parseMoney(getValue(r, 'net')), 7200);
    near(parseMoney(getValue(r, 'totalComm')), 24000);
    near(parseMoney(getValue(r, 'sideComm')), 12000);
  });

  it('real estate split with franchise fee', () => {
    const r = config.calculate({
      structure: 'realestate',
      saleAmount: '500000',
      reGrossPct: '5',
      reAgentSplitPct: '70',
      reFranchisePct: '6',
    });
    // Total comm: 500000 * 5% = 25000
    // Side comm: 12500
    // Franchise: 12500 * 6% = 750
    // After franchise: 11750
    // Agent: 11750 * 70% = 8225
    near(parseMoney(getValue(r, 'net')), 8225);
    // franchise value contains Unicode minus sign — verify the number directly
    const franchiseNum = parseMoney(getValue(r, 'franchise').replace(/−/g, '-'));
    near(franchiseNum, -750, 0.5);
  });

  it('returns empty when sale amount is empty', () => {
    const r = config.calculate({
      structure: 'flat',
      saleAmount: '',
      flatRate: '10',
    });
    expect(r).toEqual([]);
  });

  it('returns empty when flat rate is missing', () => {
    const r = config.calculate({
      structure: 'flat',
      saleAmount: '100000',
      flatRate: '',
    });
    expect(r).toEqual([]);
  });

  it('returns error when flat rate is out of range', () => {
    const r = config.calculate({
      structure: 'flat',
      saleAmount: '100000',
      flatRate: '150',
    });
    expect(getValue(r, 'err')).toContain('Commission Rate must be between');
  });

  it('returns empty when tiered inputs are invalid', () => {
    const r = config.calculate({
      structure: 'tiered',
      saleAmount: '50000',
      tier1Limit: '',
      tier1Rate: '',
    });
    expect(r).toEqual([]);
  });
});
