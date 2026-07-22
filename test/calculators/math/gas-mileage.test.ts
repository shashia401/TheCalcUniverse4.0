import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/gas-mileage/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Gas Mileage calculator', () => {
  it('calculates MPG from odometer readings', () => {
    const r = config.calculate({
      mode: 'odometer',
      odometerStart: '50000',
      odometerEnd: '50500',
      distanceUnit: 'mi',
      fuelAdded: '12.5',
      fuelUnit: 'gal',
    });
    expect(r.length).toBeGreaterThan(0);
    // 500 miles / 12.5 gal = 40 MPG
    near(parseNumber(getValue(r, 'mpg')), 40, 0.1);
    expect(getValue(r, 'distance')).toContain('500.0');
    expect(getValue(r, 'distance')).toContain('miles');
  });

  it('calculates MPG from trip distance', () => {
    const r = config.calculate({
      mode: 'distance',
      tripDistance: '300',
      distanceUnit: 'mi',
      fuelAdded: '10',
      fuelUnit: 'gal',
    });
    // 300 miles / 10 gal = 30 MPG
    near(parseNumber(getValue(r, 'mpg')), 30, 0.1);
    expect(getValue(r, 'distance')).toContain('300.0');
  });

  it('calculates L/100km from metric units (km, L)', () => {
    const r = config.calculate({
      mode: 'distance',
      tripDistance: '500',
      distanceUnit: 'km',
      fuelAdded: '40',
      fuelUnit: 'L',
    });
    // 500 km, 40 L
    // L/100km = (40/500)*100 = 8.0
    near(parseNumber(getValue(r, 'l100km')), 8.0, 0.1);
    expect(getValue(r, 'l100km')).toContain('L/100km');
    // MPG = 235.215 / 8.0 = 29.40
    near(parseNumber(getValue(r, 'mpg')), 29.4, 0.1);
    expect(getValue(r, 'mpg')).toContain('MPG');
  });

  it('MPG <-> L/100km conversion is consistent', () => {
    const r = config.calculate({
      mode: 'distance',
      tripDistance: '300',
      distanceUnit: 'mi',
      fuelAdded: '10',
      fuelUnit: 'gal',
    });
    const mpg = parseNumber(getValue(r, 'mpg')); // 30
    const l100kmVal = parseNumber(getValue(r, 'l100km')); // 235.215/30 = 7.84
    // Verify: 235.215 / MPG ≈ L/100km
    near(235.215 / mpg, l100kmVal, 0.5);
  });

  it('calculates cost per mile when price is provided', () => {
    const r = config.calculate({
      mode: 'distance',
      tripDistance: '300',
      distanceUnit: 'mi',
      fuelAdded: '10',
      fuelUnit: 'gal',
      pricePerUnit: '3.50',
      priceCurrency: 'USD',
    });
    // 300mi / 10gal = 30 MPG
    // Cost = 10gal * $3.50 = $35.00
    // Cost/mile = $35.00 / 300 = $0.1167
    near(parseNumber(getValue(r, 'costPerMile')), 0.1167, 0.01);
    expect(getValue(r, 'costPerMile')).toContain('/mile');
  });

  it('calculates annual cost at 12,000 mi/year', () => {
    const r = config.calculate({
      mode: 'distance',
      tripDistance: '300',
      distanceUnit: 'mi',
      fuelAdded: '10',
      fuelUnit: 'gal',
      pricePerUnit: '3.50',
      priceCurrency: 'USD',
    });
    // 30 MPG, $3.50/gal
    // Cost/mile = $3.50/30 = $0.1167
    // Annual = $0.1167 * 12000 = $1400
    const annualVal = getValue(r, 'annualCost');
    expect(annualVal).toContain('12,000');
    near(parseNumber(getValue(r, 'annualCostNumeric')), 1400, 15);
  });

  it('calculates cost per 100 miles', () => {
    const r = config.calculate({
      mode: 'distance',
      tripDistance: '300',
      distanceUnit: 'mi',
      fuelAdded: '10',
      fuelUnit: 'gal',
      pricePerUnit: '3.50',
      priceCurrency: 'USD',
    });
    // Cost/100mi = cost/mile * 100 = $0.1167 * 100 = $11.67
    near(parseNumber(getValue(r, 'costPer100')), 11.67, 0.5);
  });

  it('returns empty for missing fields', () => {
    const r = config.calculate({
      mode: 'distance',
      // missing tripDistance
      distanceUnit: 'mi',
      fuelAdded: '10',
      fuelUnit: 'gal',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for zero distance', () => {
    const r = config.calculate({
      mode: 'distance',
      tripDistance: '0',
      distanceUnit: 'mi',
      fuelAdded: '10',
      fuelUnit: 'gal',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for missing fuelAdded', () => {
    const r = config.calculate({
      mode: 'distance',
      tripDistance: '300',
      distanceUnit: 'mi',
      fuelUnit: 'gal',
    });
    expect(r).toEqual([]);
  });

  it('calculates MPG Imperial when using US gallons', () => {
    const r = config.calculate({
      mode: 'distance',
      tripDistance: '300',
      distanceUnit: 'mi',
      fuelAdded: '10',
      fuelUnit: 'gal',
    });
    // MPG = 30, MPG(Imp) = 30 * 1.20095 = 36.03
    near(parseNumber(getValue(r, 'mpgImperial')), 36.0, 0.5);
    expect(getValue(r, 'mpgImperial')).toContain('MPG (Imp)');
  });

  it('handles mixed units: miles with liters', () => {
    const r = config.calculate({
      mode: 'distance',
      tripDistance: '300',
      distanceUnit: 'mi',
      fuelAdded: '37.85',
      fuelUnit: 'L',
    });
    // 37.85 L = 10 gal
    // MPG = 300 / 10 = 30
    near(parseNumber(getValue(r, 'mpg')), 30, 0.5);
    expect(getValue(r, 'mpg')).toContain('MPG');
  });

  it('handles odometer readings returning negative distance (end < start)', () => {
    const r = config.calculate({
      mode: 'odometer',
      odometerStart: '50500',
      odometerEnd: '50000',
      distanceUnit: 'mi',
      fuelAdded: '10',
      fuelUnit: 'gal',
    });
    // Negative distance should return empty
    expect(r).toEqual([]);
  });

  it('returns all results with expected ids for full calculation', () => {
    const r = config.calculate({
      mode: 'distance',
      tripDistance: '300',
      distanceUnit: 'mi',
      fuelAdded: '10',
      fuelUnit: 'gal',
      pricePerUnit: '3.50',
      priceCurrency: 'USD',
    });
    expect(getValue(r, 'mpg')).toBeTruthy();
    expect(getValue(r, 'l100km')).toBeTruthy();
    expect(getValue(r, 'mpgImperial')).toBeTruthy();
    expect(getValue(r, 'distance')).toBeTruthy();
    expect(getValue(r, 'fuelUsed')).toBeTruthy();
    expect(getValue(r, 'costPerMile')).toBeTruthy();
    expect(getValue(r, 'costPer100')).toBeTruthy();
    expect(getValue(r, 'annualCost')).toBeTruthy();
  });

  it('returns EUR currency when selected', () => {
    const r = config.calculate({
      mode: 'distance',
      tripDistance: '300',
      distanceUnit: 'mi',
      fuelAdded: '10',
      fuelUnit: 'gal',
      pricePerUnit: '1.20',
      priceCurrency: 'EUR',
    });
    expect(getValue(r, 'costPerMile')).toContain('€');
  });
});
