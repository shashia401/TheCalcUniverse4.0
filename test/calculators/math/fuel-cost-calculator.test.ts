import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/fuel-cost/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Fuel Cost calculator', () => {
  it('calculates gas cost — 300mi @ 25mpg, $3.50/gal', () => {
    const r = config.calculate({
      distance: '300',
      distanceUnit: 'mi',
      fuelEfficiency: '25',
      efficiencyUnit: 'mpg',
      fuelPrice: '3.50',
      priceUnit: 'gallon',
      vehicleType: 'gas',
      roundTrips: '1',
    });
    expect(r.length).toBeGreaterThan(0);
    near(parseNumber(getValue(r, 'totalCost')), 42.0);
    expect(getValue(r, 'fuelNeeded')).toContain('12.0');
    expect(getValue(r, 'fuelNeeded')).toContain('gallons');
  });

  it('calculates diesel cost — 500mi @ 30mpg, $4.00/gal', () => {
    const r = config.calculate({
      distance: '500',
      distanceUnit: 'mi',
      fuelEfficiency: '30',
      efficiencyUnit: 'mpg',
      fuelPrice: '4.00',
      priceUnit: 'gallon',
      vehicleType: 'diesel',
      roundTrips: '1',
    });
    expect(r.length).toBeGreaterThan(0);
    near(parseNumber(getValue(r, 'totalCost')), 66.67, 0.1);
  });

  it('calculates EV cost — 100mi @ 3.5mi/kWh, $0.13/kWh', () => {
    const r = config.calculate({
      distance: '100',
      distanceUnit: 'mi',
      vehicleType: 'ev',
      evEfficiency: '3.5',
      electricityRate: '0.13',
      roundTrips: '1',
    });
    expect(r.length).toBeGreaterThan(0);
    near(parseNumber(getValue(r, 'totalCost')), 3.71, 0.05);
    expect(getValue(r, 'fuelNeeded')).toContain('kWh');
    expect(getValue(r, 'co2Emissions')).toContain('0');
  });

  it('PHEV with EV-only range — 20mi trip, 40mi ev range', () => {
    const r = config.calculate({
      distance: '20',
      distanceUnit: 'mi',
      fuelEfficiency: '35',
      efficiencyUnit: 'mpg',
      fuelPrice: '3.50',
      priceUnit: 'gallon',
      vehicleType: 'phev',
      evEfficiency: '3.5',
      evRange: '40',
      electricityRate: '0.13',
      roundTrips: '1',
    });
    expect(r.length).toBeGreaterThan(0);
    near(parseNumber(getValue(r, 'totalCost')), 0.74, 0.05);
    expect(getValue(r, 'fuelNeeded')).toContain('kWh');
    expect(getValue(r, 'fuelNeeded')).not.toContain('gallons');
  });

  it('PHEV with gas+EV mix — 100mi, 30mi ev range', () => {
    const r = config.calculate({
      distance: '100',
      distanceUnit: 'mi',
      fuelEfficiency: '35',
      efficiencyUnit: 'mpg',
      fuelPrice: '3.50',
      priceUnit: 'gallon',
      vehicleType: 'phev',
      evEfficiency: '3.5',
      evRange: '30',
      electricityRate: '0.13',
      roundTrips: '1',
    });
    expect(r.length).toBeGreaterThan(0);
    // Gas: 70mi / 35mpg = 2.0 gal × $3.50 = $7.00
    // EV: 30mi / 3.5mi/kWh = 8.571 kWh × $0.13 = $1.114
    // Total ≈ $8.11
    near(parseNumber(getValue(r, 'totalCost')), 8.11, 0.05);
    expect(getValue(r, 'fuelNeeded')).toContain('gallons');
    expect(getValue(r, 'fuelNeeded')).toContain('kWh');
  });

  it('handles km/L input — 100km @ 15km/L', () => {
    const r = config.calculate({
      distance: '100',
      distanceUnit: 'km',
      fuelEfficiency: '15',
      efficiencyUnit: 'kml',
      fuelPrice: '3.50',
      priceUnit: 'gallon',
      vehicleType: 'gas',
      roundTrips: '1',
    });
    expect(r.length).toBeGreaterThan(0);
    // 100km = 62.14mi, 15km/L = 35.28mpg
    // Fuel = 62.14/35.28 = 1.761 gal, Cost = 1.761 × $3.50 = $6.16
    near(parseNumber(getValue(r, 'totalCost')), 6.16, 0.1);
  });

  it('handles L/100km input — 200km @ 8L/100km', () => {
    const r = config.calculate({
      distance: '200',
      distanceUnit: 'km',
      fuelEfficiency: '8',
      efficiencyUnit: 'l100',
      fuelPrice: '3.50',
      priceUnit: 'gallon',
      vehicleType: 'gas',
      roundTrips: '1',
    });
    expect(r.length).toBeGreaterThan(0);
    // 200km = 124.27mi, 8L/100km = 235.214/8 = 29.40mpg
    // Fuel = 124.27/29.40 = 4.227 gal, Cost = 4.227 × $3.50 = $14.80
    near(parseNumber(getValue(r, 'totalCost')), 14.80, 0.15);
  });

  it('returns empty for missing distance', () => {
    const r = config.calculate({
      vehicleType: 'gas',
      fuelEfficiency: '25',
      fuelPrice: '3.50',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for missing fuel efficiency on gas', () => {
    const r = config.calculate({
      distance: '100',
      vehicleType: 'gas',
      fuelPrice: '3.50',
    });
    expect(r).toEqual([]);
  });

  it('handles zero distance — cost should be 0', () => {
    const r = config.calculate({
      distance: '0',
      distanceUnit: 'mi',
      fuelEfficiency: '25',
      efficiencyUnit: 'mpg',
      fuelPrice: '3.50',
      priceUnit: 'gallon',
      vehicleType: 'gas',
      roundTrips: '1',
    });
    near(parseNumber(getValue(r, 'totalCost')), 0);
  });

  it('multiplies by round trips', () => {
    const r = config.calculate({
      distance: '100',
      distanceUnit: 'mi',
      fuelEfficiency: '25',
      efficiencyUnit: 'mpg',
      fuelPrice: '3.50',
      priceUnit: 'gallon',
      vehicleType: 'gas',
      roundTrips: '3',
    });
    // Single trip: 100/25 = 4 gal × $3.50 = $14.00
    // 3 trips: $42.00
    near(parseNumber(getValue(r, 'totalCost')), 42.0);
    expect(getValue(r, 'tripCount')).toBe('3');
  });

  it('calculates CO2 for gasoline', () => {
    const r = config.calculate({
      distance: '100',
      distanceUnit: 'mi',
      fuelEfficiency: '25',
      efficiencyUnit: 'mpg',
      fuelPrice: '3.50',
      priceUnit: 'gallon',
      vehicleType: 'gas',
      roundTrips: '1',
    });
    // 100/25 = 4 gal × 19.6 lbs/gal = 78.4 lbs
    near(parseNumber(getValue(r, 'co2Emissions')), 78.4, 0.1);
  });

  it('calculates CO2 for diesel', () => {
    const r = config.calculate({
      distance: '100',
      distanceUnit: 'mi',
      fuelEfficiency: '25',
      efficiencyUnit: 'mpg',
      fuelPrice: '4.00',
      priceUnit: 'gallon',
      vehicleType: 'diesel',
      roundTrips: '1',
    });
    // 100/25 = 4 gal × 22.5 lbs/gal = 90.0 lbs
    near(parseNumber(getValue(r, 'co2Emissions')), 90.0, 0.1);
  });

  it('handles price per liter — $0.92/L', () => {
    const r = config.calculate({
      distance: '300',
      distanceUnit: 'mi',
      fuelEfficiency: '25',
      efficiencyUnit: 'mpg',
      fuelPrice: '0.92',
      priceUnit: 'liter',
      vehicleType: 'gas',
      roundTrips: '1',
    });
    // 300/25 = 12 gal × 3.78541 = 45.42L × $0.92 = $41.79
    near(parseNumber(getValue(r, 'totalCost')), 41.79, 0.1);
    expect(getValue(r, 'fuelNeeded')).toContain('liters');
  });

  it('returns all result fields', () => {
    const r = config.calculate({
      distance: '100',
      distanceUnit: 'mi',
      fuelEfficiency: '25',
      efficiencyUnit: 'mpg',
      fuelPrice: '3.50',
      priceUnit: 'gallon',
      vehicleType: 'gas',
      roundTrips: '2',
    });
    expect(getValue(r, 'totalCost')).toBeTruthy();
    expect(getValue(r, 'costPerTrip')).toBeTruthy();
    expect(getValue(r, 'fuelNeeded')).toBeTruthy();
    expect(getValue(r, 'co2Emissions')).toBeTruthy();
    expect(getValue(r, 'costPerMile')).toBeTruthy();
    expect(getValue(r, 'tripCount')).toBeTruthy();
  });
});
