import { describe, it, expect } from 'vitest';
import fuelCost from '../../../src/calculators/math/fuel-cost';
import gasMileage from '../../../src/calculators/math/gas-mileage';
import mileage from '../../../src/calculators/math/mileage-reimbursement';

// Expected values were recomputed independently with Python's decimal module (exact US gallon 3.785411784 L,
// exact mile 1.609344 km) and from the IRS's published rates.

type R = { id: string; value: string }[];
const val = (r: R, id: string) => r.find((x) => x.id === id)?.value;

const gas = (o: Record<string, string> = {}) =>
  fuelCost.calculate({
    distance: '300',
    distanceUnit: 'mi',
    fuelEfficiency: '25',
    efficiencyUnit: 'mpg',
    fuelPrice: '3.50',
    priceUnit: 'gallon',
    vehicleType: 'gas',
    roundTrips: '1',
    ...o,
  }) as R;

describe('fuel-cost audit', () => {
  it('300 mi at 25 mpg and $3.50 = 12 gal, $42.00, 235.1 lb CO2 (EPA 19.59 lb/gal)', () => {
    const r = gas();
    expect(val(r, 'totalCost')).toBe('$42.00');
    expect(val(r, 'fuelNeeded')).toBe('12.0 gallons');
    expect(val(r, 'co2Emissions')).toBe('235.1 lbs');
    expect(val(r, 'costPerMile')).toBe('$0.140');
  });

  it('fuel needed and CO2 cover ALL trips, like the cost does (it used to show one trip)', () => {
    const r = gas({ distance: '100', roundTrips: '3' });
    expect(val(r, 'totalCost')).toBe('$42.00');
    expect(val(r, 'costPerTrip')).toBe('$14.00');
    expect(val(r, 'fuelNeeded')).toBe('12.0 gallons');
    expect(r.find((x) => x.id === 'fuelNeeded')).toMatchObject({ label: 'Fuel Needed (all trips)' });
    expect(val(r, 'co2Emissions')).toBe('235.1 lbs');
  });

  it('metric: 100 km at 8 L/100 km is exactly 8 L; at 12.5 km/L also 8 L', () => {
    const base = { distance: '100', distanceUnit: 'km', fuelPrice: '1.50', priceUnit: 'liter' };
    const a = gas({ ...base, fuelEfficiency: '8', efficiencyUnit: 'l100' });
    expect(val(a, 'fuelNeeded')).toBe('8.0 liters');
    expect(val(a, 'totalCost')).toBe('$12.00');
    const b = gas({ ...base, fuelEfficiency: '12.5', efficiencyUnit: 'kml' });
    expect(val(b, 'fuelNeeded')).toBe('8.0 liters');
    expect(val(b, 'totalCost')).toBe('$12.00');
  });

  it('diesel uses 22.44 lb/gal', () => {
    expect(val(gas({ distance: '100', vehicleType: 'diesel' }), 'co2Emissions')).toBe('89.8 lbs');
  });

  it('PHEV: battery covers the first 30 mi of each trip, engine the other 70', () => {
    const phev = {
      distance: '100',
      fuelEfficiency: '35',
      vehicleType: 'phev',
      evEfficiency: '3.5',
      evRange: '30',
      electricityRate: '0.13',
    };
    const one = gas(phev);
    expect(val(one, 'totalCost')).toBe('$8.11');
    expect(val(one, 'fuelNeeded')).toBe('2.0 gallons + 8.6 kWh');
    const two = gas({ ...phev, roundTrips: '2' });
    expect(val(two, 'totalCost')).toBe('$16.23');
    expect(val(two, 'fuelNeeded')).toBe('4.0 gallons + 17.1 kWh');
  });

  it('EV has no tailpipe CO2', () => {
    const r = gas({ vehicleType: 'ev', evEfficiency: '3.5', electricityRate: '0.13', distance: '100' });
    expect(val(r, 'co2Emissions')).toBe('0 lbs (no tailpipe emissions)');
    expect(val(r, 'fuelNeeded')).toBe('28.6 kWh');
  });

  it('money is rounded half-up on exact decimals ($1.005 -> $1.01, floats gave $1.00)', () => {
    const r = gas({ vehicleType: 'ev', distance: '1', evEfficiency: '1', electricityRate: '1.005' });
    expect(val(r, 'totalCost')).toBe('$1.01');
  });

  it('rejects junk instead of guessing', () => {
    for (const bad of [
      { distance: '12abc' },
      { distance: 'Infinity' },
      { distance: '-5' },
      { fuelEfficiency: '0' },
      { fuelEfficiency: '1e999' },
      { fuelPrice: '-1' },
      { roundTrips: '1.5' },
      { roundTrips: '0' },
      { roundTrips: 'two' },
    ]) {
      expect(gas(bad)).toEqual([]);
    }
  });
});

describe('gas-mileage audit', () => {
  const mpgCalc = (o: Record<string, string>) =>
    gasMileage.calculate({ mode: 'distance', distanceUnit: 'mi', fuelUnit: 'gal', ...o }) as R;

  it('500 mi / 12.5 gal = 40 MPG = 5.9 L/100 km = 48.0 imperial MPG', () => {
    const r = mpgCalc({ tripDistance: '500', fuelAdded: '12.5' });
    expect(val(r, 'mpg')).toBe('40.0 MPG');
    expect(val(r, 'l100km')).toBe('5.9 L/100km'); // 235.2146 / 40 = 5.880
    expect(val(r, 'mpgImperial')).toBe('48.0 MPG (Imp)');
  });

  it('500 km on 40 L is exactly 8.0 L/100 km and 29.4 MPG', () => {
    const r = mpgCalc({ tripDistance: '500', distanceUnit: 'km', fuelAdded: '40', fuelUnit: 'L' });
    expect(val(r, 'l100km')).toBe('8.0 L/100km');
    expect(val(r, 'mpg')).toBe('29.4 MPG');
  });

  it('cost: 320 mi on 12.5 gal at $3.50 = $0.137/mile, $13.67 per 100 mi, $1,640.63 a year', () => {
    const r = mpgCalc({ tripDistance: '320', fuelAdded: '12.5', pricePerUnit: '3.50', priceCurrency: 'USD' });
    expect(val(r, 'mpg')).toBe('25.6 MPG');
    expect(val(r, 'costPerMile')).toBe('$0.137/mile');
    expect(val(r, 'costPer100')).toBe('$13.67');
    expect(val(r, 'annualCost')).toBe('At 12,000 mi/year: $1,640.63');
    expect(val(r, '_annualCostNumeric')).toBe('1640.63');
  });

  it('cost per mile with km and liters is converted the same way', () => {
    // 100 km on 8 L at 1.50 per liter = 12.00 for 62.137 miles
    const r = mpgCalc({ tripDistance: '100', distanceUnit: 'km', fuelAdded: '8', fuelUnit: 'L', pricePerUnit: '1.50', priceCurrency: 'EUR' });
    expect(val(r, 'costPerMile')).toBe('€0.193/mile'); // 12 / 62.1371 = 0.19312
  });

  it('odometer mode and junk rejection', () => {
    expect(val(mpgCalc({ mode: 'odometer', odometerStart: '1000', odometerEnd: '1300', fuelAdded: '10' }), 'mpg')).toBe('30.0 MPG');
    expect(mpgCalc({ mode: 'odometer', odometerStart: '1000', odometerEnd: '1000', fuelAdded: '10' })).toEqual([]);
    expect(mpgCalc({ tripDistance: '300abc', fuelAdded: '10' })).toEqual([]);
    expect(mpgCalc({ tripDistance: '300', fuelAdded: '1e999' })).toEqual([]);
    expect(mpgCalc({ tripDistance: '300', fuelAdded: '10', pricePerUnit: 'free' }).some((x) => x.id === 'costPerMile')).toBe(false);
  });
});

describe('mileage-reimbursement audit', () => {
  const m = (o: Record<string, string>) =>
    mileage.calculate({ miles: '1000', mileageType: 'business', year: '2026', additionalExpenses: '', ...o }) as R;

  it('IRS 2026 rates: Jan-Jun 72.5c / 20.5c, from Jul 1 76c / 23.5c, charity 14c; 2025 70c / 21c', () => {
    expect(val(m({}), 'reimbursement')).toBe('$760');
    expect(val(m({ year: '2026h1' }), 'reimbursement')).toBe('$725');
    expect(val(m({ year: '2026h1' }), 'rateUsed')).toBe('$0.725/mi');
    expect(val(m({ mileageType: 'medical' }), 'reimbursement')).toBe('$235');
    expect(val(m({ mileageType: 'medical', year: '2026h1' }), 'reimbursement')).toBe('$205');
    expect(val(m({ mileageType: 'charitable' }), 'reimbursement')).toBe('$140');
    expect(val(m({ year: '2025' }), 'reimbursement')).toBe('$700');
    expect(val(m({ year: '2025', mileageType: 'medical' }), 'rateUsed')).toBe('$0.21/mi');
  });

  it('cites the real IRS releases, not placeholders', () => {
    expect(val(m({}), 'irsNote')).toContain('IR-2026-29');
    expect(val(m({ year: '2026h1' }), 'irsNote')).toContain('IR-2025-128');
    expect(val(m({ year: '2025' }), 'irsNote')).toContain('IR-2024-312');
    for (const y of ['2026', '2026h1', '2025']) expect(val(m({ year: y }), 'irsNote')).not.toContain('XX');
  });

  it('exact cents: 3 mi x $0.235 = $0.705 -> $0.71 (floats gave $0.70)', () => {
    expect(val(m({ miles: '3', mileageType: 'medical' }), 'mileageAmount')).toBe('$0.71');
  });

  it('adds tolls and parking; 30% estimate is on the total', () => {
    const r = m({ additionalExpenses: '50.25' });
    expect(val(r, 'reimbursement')).toBe('$810.25');
    expect(val(r, 'additionalAmount')).toBe('$50.25');
    expect(val(r, 'taxSavings')).toContain('$243.08'); // 810.25 x 0.30 = 243.075
  });

  it('shows which period was used', () => {
    expect(val(m({ year: '2026h1' }), 'year')).toBe('2026 (Jan 1 - Jun 30)');
  });

  it('rejects junk', () => {
    expect(m({ miles: '12abc' })).toEqual([]);
    expect(m({ miles: '-1' })).toEqual([]);
    expect(m({ miles: 'Infinity' })).toEqual([]);
    expect(m({ additionalExpenses: 'lots' })).toEqual([]);
    expect(m({ additionalExpenses: '-5' })).toEqual([]);
    expect(m({ year: '1999' })).toEqual([]);
  });
});
