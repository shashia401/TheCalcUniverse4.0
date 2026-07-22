import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/everyday/betting-odds';
import { getValue, parseNumber, near } from '../../helpers';

describe('betting-odds', () => {
  it('converts American +200 to Decimal 3.00 with correct implied probability', () => {
    const r = config.calculate({
      oddsFormat: 'American',
      americanOdds: '200',
      stake: '100',
    });
    near(parseNumber(getValue(r, 'decimalOddsOut')), 3.0);
    near(parseNumber(getValue(r, 'impliedProbability')), 33.33);
    expect(getValue(r, 'americanOddsOut')).toBe('+200');
  });

  it('converts American -150 to Decimal 1.667 with correct implied probability', () => {
    const r = config.calculate({
      oddsFormat: 'American',
      americanOdds: '-150',
      stake: '100',
    });
    near(parseNumber(getValue(r, 'decimalOddsOut')), 1.667);
    near(parseNumber(getValue(r, 'impliedProbability')), 60);
    expect(getValue(r, 'americanOddsOut')).toBe('-150');
  });

  it('returns empty for empty odds input', () => {
    const r = config.calculate({
      oddsFormat: 'American',
      americanOdds: '',
      stake: '100',
    });
    expect(r).toEqual([]);
  });

  it('calculates payout and profit correctly', () => {
    const r = config.calculate({
      oddsFormat: 'Decimal',
      decimalOdds: '2.50',
      stake: '200',
    });
    near(parseNumber(getValue(r, 'payout')), 500);
    near(parseNumber(getValue(r, 'profit')), 300);
  });

  it('converts Decimal odds to American format', () => {
    const r = config.calculate({
      oddsFormat: 'Decimal',
      decimalOdds: '3.00',
      stake: '100',
    });
    expect(getValue(r, 'americanOddsOut')).toBe('+200');
  });

  it('converts Decimal odds under 2.0 to negative American odds', () => {
    const r = config.calculate({
      oddsFormat: 'Decimal',
      decimalOdds: '1.50',
      stake: '100',
    });
    expect(getValue(r, 'americanOddsOut')).toBe('-200');
  });

  it('converts Fractional odds correctly', () => {
    const r = config.calculate({
      oddsFormat: 'Fractional',
      fractionalOdds: '5/1',
      stake: '50',
    });
    near(parseNumber(getValue(r, 'decimalOddsOut')), 6.0);
    near(parseNumber(getValue(r, 'payout')), 300);
    near(parseNumber(getValue(r, 'profit')), 250);
  });

  it('returns empty for invalid fractional odds', () => {
    const r = config.calculate({
      oddsFormat: 'Fractional',
      fractionalOdds: 'invalid',
      stake: '100',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for zero stake', () => {
    const r = config.calculate({
      oddsFormat: 'Decimal',
      decimalOdds: '2.00',
      stake: '0',
    });
    expect(r).toEqual([]);
  });
});
