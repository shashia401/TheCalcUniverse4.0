import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/automotive/gas-mileage/index';
import { getValue, parseNumber } from '../../helpers';

describe('Gas Mileage Calculator', () => {
  it('calculates MPG from trip distance and fuel used', () => {
    const r = config.calculate({
      mode: 'distance',
      tripDistance: '320',
      distanceUnit: 'mi',
      fuelAdded: '12.5',
      fuelUnit: 'gal',
      pricePerUnit: '3.50',
      priceCurrency: 'USD',
    });
    expect(getValue(r, 'mpg')).toContain('MPG');
    expect(getValue(r, 'l100km')).toContain('L/100km');
    const mpgVal = parseNumber(getValue(r, 'mpg'));
    expect(mpgVal).toBeGreaterThan(20);
    expect(mpgVal).toBeLessThan(30);
  });

  it('calculates fuel economy from odometer readings', () => {
    const r = config.calculate({
      mode: 'odometer',
      odometerStart: '50000',
      odometerEnd: '50350',
      distanceUnit: 'mi',
      fuelAdded: '14',
      fuelUnit: 'gal',
      pricePerUnit: '',
      priceCurrency: 'USD',
    });
    expect(getValue(r, 'distance')).toContain('350');
    expect(getValue(r, 'fuelEconomy')).toContain('MPG');
  });

  it('shows cost analysis when price is provided', () => {
    const r = config.calculate({
      mode: 'distance',
      tripDistance: '300',
      distanceUnit: 'mi',
      fuelAdded: '10',
      fuelUnit: 'gal',
      pricePerUnit: '4.00',
      priceCurrency: 'USD',
    });
    expect(getValue(r, 'costPerMile')).toContain('/mile');
    expect(getValue(r, 'annualCost')).toContain('12,000');
  });

  it('converts correctly with metric units', () => {
    const r = config.calculate({
      mode: 'distance',
      tripDistance: '500',
      distanceUnit: 'km',
      fuelAdded: '45',
      fuelUnit: 'L',
      pricePerUnit: '1.80',
      priceCurrency: 'EUR',
    });
    expect(getValue(r, 'l100km')).toContain('L/100km');
    expect(getValue(r, 'fuelEconomy')).toContain('L/100km');
  });

  it('returns empty for invalid fuel amount', () => {
    const r = config.calculate({
      mode: 'distance',
      tripDistance: '100',
      distanceUnit: 'mi',
      fuelAdded: '0',
      fuelUnit: 'gal',
      pricePerUnit: '',
      priceCurrency: 'USD',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for invalid odometer readings', () => {
    const r = config.calculate({
      mode: 'odometer',
      odometerStart: '',
      odometerEnd: '',
      distanceUnit: 'mi',
      fuelAdded: '10',
      fuelUnit: 'gal',
      pricePerUnit: '',
      priceCurrency: 'USD',
    });
    expect(r).toEqual([]);
  });
});
