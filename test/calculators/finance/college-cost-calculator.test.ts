import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/college-cost/index';
import { getValue, parseMoney, parseNumber } from '../../helpers';

describe('college cost calculator', () => {
  it('projects total cost for in-state public', () => {
    const r = config.calculate({
      childAge: '8',
      currentSavings: '10000',
      monthlyContribution: '200',
      institutionType: 'in-state',
      includeRoomBoard: 'yes',
      tuitionInflation: '5',
      growthRate: '6',
      collegeYears: '4',
    });
    const totalCost = parseMoney(getValue(r, 'projectedCost'));
    // 10 years until college, $11,260 + $12,770 = $24,030/yr now
    // with 5% inflation for 10-13 years → $39K-$45K/yr → ~$160K-$180K total
    expect(totalCost).toBeGreaterThan(100000);
    expect(totalCost).toBeLessThan(300000);
    expect(parseNumber(getValue(r, 'yearsUntilCollege'))).toBe(10);
  });

  it('shows funding gap when savings are insufficient', () => {
    const r = config.calculate({
      childAge: '10',
      currentSavings: '5000',
      monthlyContribution: '50',
      institutionType: 'private',
      includeRoomBoard: 'yes',
      tuitionInflation: '5',
      growthRate: '6',
      collegeYears: '4',
    });
    const gap = getValue(r, 'fundingGap');
    expect(gap).not.toBe('None! Fully funded');
    expect(gap).toContain('$');
  });

  it('shows fully funded when savings are sufficient', () => {
    const r = config.calculate({
      childAge: '0',
      currentSavings: '50000',
      monthlyContribution: '1000',
      institutionType: 'in-state',
      includeRoomBoard: 'yes',
      tuitionInflation: '3',
      growthRate: '7',
      collegeYears: '4',
    });
    expect(getValue(r, 'fundingGap')).toBe('None — fully funded!');
  });

  it('returns empty for invalid child age (NaN)', () => {
    const r = config.calculate({
      childAge: '',
      currentSavings: '10000',
      monthlyContribution: '200',
      institutionType: 'in-state',
      includeRoomBoard: 'yes',
      tuitionInflation: '5',
      growthRate: '6',
      collegeYears: '4',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for negative current savings', () => {
    const r = config.calculate({
      childAge: '8',
      currentSavings: '-100',
      monthlyContribution: '200',
      institutionType: 'in-state',
      includeRoomBoard: 'yes',
      tuitionInflation: '5',
      growthRate: '6',
      collegeYears: '4',
    });
    expect(r).toEqual([]);
  });

  it('defaults college years to 4 when empty string provided', () => {
    const r = config.calculate({
      childAge: '10',
      currentSavings: '5000',
      monthlyContribution: '100',
      institutionType: 'in-state',
      includeRoomBoard: 'yes',
      tuitionInflation: '5',
      growthRate: '6',
      collegeYears: '',
    });
    // parseFloat('') || 4 = 4, so calculation proceeds with 4 years
    expect(r.length).toBeGreaterThan(0);
    expect(parseNumber(getValue(r, 'yearsUntilCollege'))).toBe(8);
  });

  it('returns empty for child age above 22', () => {
    const r = config.calculate({
      childAge: '25',
      currentSavings: '5000',
      monthlyContribution: '100',
      institutionType: 'in-state',
      includeRoomBoard: 'yes',
      tuitionInflation: '5',
      growthRate: '6',
      collegeYears: '4',
    });
    expect(r).toEqual([]);
  });

  it('shows additional monthly savings needed when gap exists', () => {
    const r = config.calculate({
      childAge: '12',
      currentSavings: '2000',
      monthlyContribution: '100',
      institutionType: 'private',
      includeRoomBoard: 'yes',
      tuitionInflation: '5',
      growthRate: '6',
      collegeYears: '4',
    });
    expect(getValue(r, 'monthlyNeeded')).toBeDefined();
    expect(parseMoney(getValue(r, 'monthlyNeeded'))).toBeGreaterThan(0);
  });

  it('shows current annual cost for the selected institution type', () => {
    const r = config.calculate({
      childAge: '6',
      currentSavings: '15000',
      monthlyContribution: '300',
      institutionType: 'in-state',
      includeRoomBoard: 'no',
      tuitionInflation: '5',
      growthRate: '6',
      collegeYears: '4',
    });
    expect(parseMoney(getValue(r, 'currentAnnualCost'))).toBe(11260);
  });

  it('shows percent funded', () => {
    const r = config.calculate({
      childAge: '5',
      currentSavings: '20000',
      monthlyContribution: '300',
      institutionType: 'in-state',
      includeRoomBoard: 'yes',
      tuitionInflation: '5',
      growthRate: '6',
      collegeYears: '4',
    });
    const pct = parseNumber(getValue(r, 'pctFunded'));
    expect(pct).toBeGreaterThan(0);
    expect(pct).toBeLessThanOrEqual(100);
  });

  it('shows tuition-only mode (no room & board)', () => {
    const r = config.calculate({
      childAge: '8',
      currentSavings: '10000',
      monthlyContribution: '200',
      institutionType: 'private',
      includeRoomBoard: 'no',
      tuitionInflation: '5',
      growthRate: '6',
      collegeYears: '4',
    });
    expect(parseMoney(getValue(r, 'currentAnnualCost'))).toBe(41540);
  });

  it('accounts for additional costs in current annual cost', () => {
    const r = config.calculate({
      childAge: '8',
      currentSavings: '10000',
      monthlyContribution: '200',
      institutionType: 'in-state',
      includeRoomBoard: 'no',
      additionalCosts: '4000',
      financialAid: '0',
      tuitionInflation: '5',
      growthRate: '6',
      collegeYears: '4',
    });
    // base tuition: 11260 + additional: 4000 = 15260
    expect(parseMoney(getValue(r, 'currentAnnualCost'))).toBe(15260);
  });

  it('reduces annual cost with financial aid', () => {
    const r = config.calculate({
      childAge: '6',
      currentSavings: '15000',
      monthlyContribution: '300',
      institutionType: 'private',
      includeRoomBoard: 'no',
      additionalCosts: '0',
      financialAid: '20000',
      tuitionInflation: '5',
      growthRate: '6',
      collegeYears: '4',
    });
    // base tuition: 41540 - aid: 20000 = 21540
    expect(parseMoney(getValue(r, 'currentAnnualCost'))).toBe(21540);
  });

  it('shows base cost breakdown when additional costs or aid are provided', () => {
    const r = config.calculate({
      childAge: '8',
      currentSavings: '10000',
      monthlyContribution: '200',
      institutionType: 'in-state',
      includeRoomBoard: 'yes',
      additionalCosts: '2000',
      financialAid: '1000',
      tuitionInflation: '5',
      growthRate: '6',
      collegeYears: '4',
    });
    expect(getValue(r, 'currentBaseCost')).toBeDefined();
    // base: 11260 + 12770 = 24030
    expect(parseMoney(getValue(r, 'currentBaseCost'))).toBe(24030);
  });

  it('projects total cost for out-of-state public', () => {
    const r = config.calculate({
      childAge: '5',
      currentSavings: '20000',
      monthlyContribution: '400',
      institutionType: 'out-state',
      includeRoomBoard: 'yes',
      tuitionInflation: '5',
      growthRate: '6',
      collegeYears: '4',
    });
    const totalCost = parseMoney(getValue(r, 'projectedCost'));
    // 13 years until college, out-state: 22980 + 12770 = 35750/yr
    // with 5% inflation for 13-16 years → much higher
    expect(totalCost).toBeGreaterThan(120000);
  });

  it('handles zero growth rate without crashing', () => {
    const r = config.calculate({
      childAge: '10',
      currentSavings: '5000',
      monthlyContribution: '200',
      institutionType: 'in-state',
      includeRoomBoard: 'yes',
      tuitionInflation: '5',
      growthRate: '0',
      collegeYears: '4',
    });
    expect(r.length).toBeGreaterThan(0);
    expect(parseNumber(getValue(r, 'yearsUntilCollege'))).toBe(8);
  });

  it('returns empty for negative monthly contribution', () => {
    const r = config.calculate({
      childAge: '8',
      currentSavings: '10000',
      monthlyContribution: '-50',
      institutionType: 'in-state',
      includeRoomBoard: 'yes',
      tuitionInflation: '5',
      growthRate: '6',
      collegeYears: '4',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for negative additional costs', () => {
    const r = config.calculate({
      childAge: '8',
      currentSavings: '10000',
      monthlyContribution: '200',
      institutionType: 'in-state',
      includeRoomBoard: 'yes',
      additionalCosts: '-100',
      tuitionInflation: '5',
      growthRate: '6',
      collegeYears: '4',
    });
    expect(r).toEqual([]);
  });

  it('defaults additionalCosts and financialAid to zero when omitted', () => {
    const r = config.calculate({
      childAge: '8',
      currentSavings: '10000',
      monthlyContribution: '200',
      institutionType: 'in-state',
      includeRoomBoard: 'yes',
      tuitionInflation: '5',
      growthRate: '6',
      collegeYears: '4',
    });
    // Without additional costs or aid, base cost = net cost, so currentBaseCost row won't appear
    const baseCostRow = r.find((row) => row.id === 'currentBaseCost');
    expect(baseCostRow).toBeUndefined();
    expect(parseMoney(getValue(r, 'currentAnnualCost'))).toBe(24030);
  });
});
