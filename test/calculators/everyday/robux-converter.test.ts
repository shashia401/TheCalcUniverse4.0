import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/everyday/robux-converter/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Robux / V-Bucks Converter', () => {
  it('converts 800 Robux using 800 package', () => {
    const r = config.calculate({ virtualCurrency: '800', currencyType: 'Robux', packageType: '800' });
    near(parseNumber(getValue(r, 'usdValue')), 9.99);
  });

  it('converts 400 Robux using 400 package', () => {
    const r = config.calculate({ virtualCurrency: '400', currencyType: 'Robux', packageType: '400' });
    near(parseNumber(getValue(r, 'usdValue')), 4.99);
  });

  it('needs 2 packages when amount exceeds one package', () => {
    const r = config.calculate({ virtualCurrency: '1000', currencyType: 'Robux', packageType: '800' });
    // 2 * 800 packages = $19.98
    near(parseNumber(getValue(r, 'usdValue')), 19.98);
  });

  it('identifies 10000 package as best value for Robux', () => {
    const r = config.calculate({ virtualCurrency: '10000', currencyType: 'Robux', packageType: '10000' });
    expect(getValue(r, 'bestPackage')).toContain('10,000');
  });

  it('converts V-Bucks correctly', () => {
    const r = config.calculate({ virtualCurrency: '1000', currencyType: 'V-Bucks', packageType: '1000' });
    near(parseNumber(getValue(r, 'usdValue')), 8.99);
  });

  it('shows premium bonus for Roblox Premium', () => {
    const r = config.calculate({ virtualCurrency: '440', currencyType: 'Roblox Premium', packageType: '440' });
    near(parseNumber(getValue(r, 'usdValue')), 4.99);
    expect(getValue(r, 'bonusPercent')).toContain('10%');
    expect(getValue(r, 'currencyType')).toContain('Premium');
  });

  it('sets correct effective rate for V-Bucks 13500 package', () => {
    const r = config.calculate({ virtualCurrency: '13500', currencyType: 'V-Bucks', packageType: '13500' });
    near(parseNumber(getValue(r, 'usdValue')), 79.99);
    const rate = parseNumber(getValue(r, 'effectiveRate'));
    near(rate, 79.99 / 13500, 0.0001);
  });

  it('returns empty for empty or zero amount', () => {
    const r = config.calculate({ virtualCurrency: '', currencyType: 'Robux', packageType: '400' });
    expect(r).toEqual([]);
  });

  it('returns empty for negative amount', () => {
    const r = config.calculate({ virtualCurrency: '-100', currencyType: 'Robux', packageType: '400' });
    expect(r).toEqual([]);
  });

  it('returns all required result ids', () => {
    const r = config.calculate({ virtualCurrency: '5000', currencyType: 'Robux', packageType: '4500' });
    expect(getValue(r, 'usdValue')).toBeTruthy();
    expect(getValue(r, 'effectiveRate')).toBeTruthy();
    expect(getValue(r, 'bestPackage')).toBeTruthy();
    expect(getValue(r, 'packageType')).toBeTruthy();
    expect(getValue(r, 'bonusPercent')).toBeTruthy();
    expect(getValue(r, 'currencyType')).toBeTruthy();
  });
});
