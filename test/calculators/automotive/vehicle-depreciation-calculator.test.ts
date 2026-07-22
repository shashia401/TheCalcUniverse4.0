import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/automotive/depreciation/index';

import { getValue, parseNumber, near } from '../../helpers';

describe('vehicle depreciation calculator', () => {
  // ─── Core calculations ───────────────────────────────────────────────────

  it('average sedan: $45,000 new, 5 years ownership', () => {
    const r = config.calculate({
      purchasePrice: '45000',
      vehicleAge: '0',
      yearsOwned: '5',
      vehicleType: 'average',
    });
    expect(r).toHaveLength(4);
    // average rates: [0.20, 0.15, 0.12, 0.10, 0.09]
    // Year 1: 45000 * 0.80 = 36000
    // Year 2: 36000 * 0.85 = 30600
    // Year 3: 30600 * 0.88 = 26928
    // Year 4: 26928 * 0.90 = 24235.20
    // Year 5: 24235.20 * 0.91 = 22054.03
    // totalDepreciation = 45000 - 22054 = 22946
    near(parseNumber(getValue(r, 'totalDepreciation')), 22946, 50);
    near(parseNumber(getValue(r, 'futureValue')), 22054, 50);
    near(parseNumber(getValue(r, 'annualDepreciation')), 4589, 50);
    near(parseNumber(getValue(r, 'monthlyDepreciation')), 382, 10);
  });

  it('luxury vehicle depreciates more aggressively', () => {
    const r = config.calculate({
      purchasePrice: '60000',
      vehicleAge: '0',
      yearsOwned: '3',
      vehicleType: 'luxury',
    });
    expect(r).toHaveLength(4);
    // luxury rates: [0.25, 0.20, 0.15]
    // 60000 * 0.75 * 0.80 * 0.85 = 30600
    // totalDepreciation = 60000 - 30600 = 29400
    near(parseNumber(getValue(r, 'futureValue')), 30600, 100);
    near(parseNumber(getValue(r, 'totalDepreciation')), 29400, 100);
  });

  it('truck retains the most value', () => {
    const r = config.calculate({
      purchasePrice: '45000',
      vehicleAge: '0',
      yearsOwned: '5',
      vehicleType: 'truck',
    });
    expect(r).toHaveLength(4);
    // truck rates: [0.15, 0.12, 0.10, 0.08, 0.07]
    // 45000 * 0.85 * 0.88 * 0.90 * 0.92 * 0.93 = 25917
    const futureValue = parseNumber(getValue(r, 'futureValue'));
    near(futureValue, 25920, 100);
    // truck should retain more than average (22054 vs ~25920)
  });

  it('electric vehicle depreciation is faster than average', () => {
    const r = config.calculate({
      purchasePrice: '50000',
      vehicleAge: '0',
      yearsOwned: '3',
      vehicleType: 'ev',
    });
    expect(r).toHaveLength(4);
    // ev rates: [0.22, 0.18, 0.14]
    // 50000 * 0.78 * 0.82 * 0.86 = 27502.80
    near(parseNumber(getValue(r, 'futureValue')), 27500, 100);
  });

  // ─── Already-aged vehicle ─────────────────────────────────────────────────

  it('applies prior depreciation for a 3-year-old used car', () => {
    const r = config.calculate({
      purchasePrice: '30000',
      vehicleAge: '3',
      yearsOwned: '5',
      vehicleType: 'average',
    });
    expect(r).toHaveLength(4);
    // Starting value after 3 years at average rates:
    // 30000 * 0.80 * 0.85 * 0.88 = 17952
    // Then 5 more years: rates [0.10, 0.09, 0.08, 0.07, 0.06]
    // 17952 * 0.90 * 0.91 * 0.92 * 0.93 * 0.94 = 11821
    const futureValue = parseNumber(getValue(r, 'futureValue'));
    near(futureValue, 11821, 100);
  });

  it('used car already 5 years old, buying and holding 3 more years', () => {
    const r = config.calculate({
      purchasePrice: '25000',
      vehicleAge: '5',
      yearsOwned: '3',
      vehicleType: 'average',
    });
    expect(r).toHaveLength(4);
    // After 5 years at average rates [0.20, 0.15, 0.12, 0.10, 0.09]:
    // 25000 * 0.80 * 0.85 * 0.88 * 0.90 * 0.91 = 12257
    // Then 3 more years at rates [0.08, 0.07, 0.06]:
    // 12257 * 0.92 * 0.93 * 0.94 = 9856
    const futureValue = parseNumber(getValue(r, 'futureValue'));
    near(futureValue, 9856, 100);
  });

  // ─── Long ownership (beyond 10-year rate table) ───────────────────────────

  it('handles ownership beyond 10 years with 5% tail rate', () => {
    const r = config.calculate({
      purchasePrice: '10000',
      vehicleAge: '0',
      yearsOwned: '30',
      vehicleType: 'average',
    });
    expect(r).toHaveLength(4);
    const futureValue = parseNumber(getValue(r, 'futureValue'));
    // After 10 years of rates + 20 years at 5% tail, car is ~$1275
    expect(futureValue).toBeLessThan(2000);
    expect(futureValue).toBeGreaterThan(800);
  });

  it('already aged beyond rate table uses 5% tail for prior years', () => {
    const r = config.calculate({
      purchasePrice: '20000',
      vehicleAge: '15',
      yearsOwned: '3',
      vehicleType: 'truck',
    });
    expect(r).toHaveLength(4);
    const futureValue = parseNumber(getValue(r, 'futureValue'));
    // 10 years of rates + 5 years at 5% tail = 10 rate years + 5 tail years
    // Then 3 more years from 15 to 18 = 3 tail years at 5%
    // Total tail years = 8
    // After 10 truck rates and 8 tail years, value should be low
    expect(futureValue).toBeLessThan(7000);
  });

  // ─── Cross-vehicle-type comparison ────────────────────────────────────────

  it('truck retains significantly more value than luxury after 5 years', () => {
    const truck = config.calculate({
      purchasePrice: '50000',
      vehicleAge: '0',
      yearsOwned: '5',
      vehicleType: 'truck',
    });
    const luxury = config.calculate({
      purchasePrice: '50000',
      vehicleAge: '0',
      yearsOwned: '5',
      vehicleType: 'luxury',
    });
    const truckFV = parseNumber(getValue(truck, 'futureValue'));
    const luxuryFV = parseNumber(getValue(luxury, 'futureValue'));
    // Truck should retain substantially more value
    expect(truckFV).toBeGreaterThan(luxuryFV + 5000);
  });

  // ─── Edge case: missing / invalid inputs ──────────────────────────────────

  it('returns empty array when purchasePrice is missing', () => {
    const r = config.calculate({
      vehicleAge: '0',
      yearsOwned: '5',
      vehicleType: 'average',
    });
    expect(r).toHaveLength(0);
  });

  it('returns empty array for empty object', () => {
    expect(config.calculate({})).toHaveLength(0);
  });

  it('returns empty array for zero purchase price', () => {
    const r = config.calculate({
      purchasePrice: '0',
      yearsOwned: '5',
    });
    expect(r).toHaveLength(0);
  });

  it('returns empty array for zero years owned', () => {
    const r = config.calculate({
      purchasePrice: '30000',
      vehicleAge: '0',
      yearsOwned: '0',
    });
    expect(r).toHaveLength(0);
  });

  it('returns empty array for negative purchase price', () => {
    const r = config.calculate({
      purchasePrice: '-10000',
      vehicleAge: '0',
      yearsOwned: '5',
      vehicleType: 'average',
    });
    expect(r).toHaveLength(0);
  });

  it('returns empty array for non-numeric purchase price string', () => {
    const r = config.calculate({
      purchasePrice: 'abc',
      vehicleAge: '0',
      yearsOwned: '5',
      vehicleType: 'average',
    });
    expect(r).toHaveLength(0);
  });

  it('returns empty array for empty string purchase price', () => {
    const r = config.calculate({
      purchasePrice: '',
      yearsOwned: '5',
    });
    expect(r).toHaveLength(0);
  });

  // ─── Edge case: missing optional vehicleType defaults to average ──────────

  it('defaults to average rates when vehicleType is missing', () => {
    const r = config.calculate({
      purchasePrice: '45000',
      vehicleAge: '0',
      yearsOwned: '5',
    });
    expect(r).toHaveLength(4);
    // Should match average type calculation
    near(parseNumber(getValue(r, 'futureValue')), 22054, 50);
  });

  it('defaults to average rates for unknown vehicle type', () => {
    const r = config.calculate({
      purchasePrice: '45000',
      vehicleAge: '0',
      yearsOwned: '5',
      vehicleType: 'motorcycle',
    });
    expect(r).toHaveLength(4);
    near(parseNumber(getValue(r, 'futureValue')), 22054, 50);
  });

  // ─── Edge case: vehicleAge defaults to 0 when missing ────────────────────

  it('treats missing vehicleAge as 0 (brand new)', () => {
    const r = config.calculate({
      purchasePrice: '45000',
      yearsOwned: '5',
      vehicleType: 'average',
    });
    expect(r).toHaveLength(4);
    near(parseNumber(getValue(r, 'futureValue')), 22054, 50);
  });

  // ─── Output structure validation ──────────────────────────────────────────

  it('all result rows have required fields', () => {
    const r = config.calculate({
      purchasePrice: '35000',
      vehicleAge: '0',
      yearsOwned: '4',
      vehicleType: 'average',
    });
    for (const row of r) {
      expect(row).toHaveProperty('id');
      expect(row).toHaveProperty('label');
      expect(row).toHaveProperty('value');
      expect(typeof row.id).toBe('string');
      expect(typeof row.label).toBe('string');
      expect(typeof row.value).toBe('string');
    }
  });

  it('total depreciation result is highlighted', () => {
    const r = config.calculate({
      purchasePrice: '35000',
      vehicleAge: '0',
      yearsOwned: '4',
      vehicleType: 'average',
    });
    const totalDep = r.find(x => x.id === 'totalDepreciation');
    expect(totalDep).toBeDefined();
    expect(totalDep!.highlight).toBe(true);
  });

  // ─── Formatting validation ────────────────────────────────────────────────

  it('formats currency values with dollar signs and commas', () => {
    const r = config.calculate({
      purchasePrice: '50000',
      vehicleAge: '0',
      yearsOwned: '5',
      vehicleType: 'average',
    });
    const fv = getValue(r, 'futureValue');
    expect(fv).toMatch(/^\$/);
    const total = getValue(r, 'totalDepreciation');
    expect(total).toMatch(/^\$/);
    // total depreciation shows percentage
    expect(total).toMatch(/%/);
  });

  it('monthly and annual results include rate labels', () => {
    const r = config.calculate({
      purchasePrice: '30000',
      vehicleAge: '0',
      yearsOwned: '3',
      vehicleType: 'truck',
    });
    const monthly = getValue(r, 'monthlyDepreciation');
    expect(monthly).toMatch(/\/month/);
    const annual = getValue(r, 'annualDepreciation');
    expect(annual).toMatch(/\/year/);
  });

  // ─── Single-year ownership (boundary) ─────────────────────────────────────

  it('handles 1-year ownership period correctly', () => {
    const r = config.calculate({
      purchasePrice: '40000',
      vehicleAge: '0',
      yearsOwned: '1',
      vehicleType: 'average',
    });
    expect(r).toHaveLength(4);
    // Year 1 rate: 20%, future value = 40000 * 0.80 = 32000
    near(parseNumber(getValue(r, 'futureValue')), 32000, 50);
    near(parseNumber(getValue(r, 'totalDepreciation')), 8000, 50);
  });
});
