import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/electricity-cost/index';
import { getValue, parseMoney, near } from '../../helpers';

describe('Electricity Cost Calculator', () => {
  // ─── Basic Cost Calculation ─────────────────────────────────────────────

  it('calculates basic cost: 1500W, 4hrs/day, 30 days, $0.14/kWh', () => {
    const r = config.calculate({
      wattage: '1500',
      hoursPerDay: '4',
      days: '30',
      costPerKwh: '0.14',
      applianceCount: '1',
    });
    // kWh = 1500 × 4 / 1000 = 6 kWh/day
    // 30 days = 180 kWh
    // cost = 180 × 0.14 = $25.20
    near(parseMoney(getValue(r, 'costPerPeriod')), 25.20);
    expect(getValue(r, 'kwhUsed')).toContain('180');
  });

  // ─── Appliance Preset ───────────────────────────────────────────────────

  it('auto-fills wattage from appliance preset', () => {
    const r = config.calculate({
      preset: 'led-bulb',
      hoursPerDay: '8',
      days: '30',
      costPerKwh: '0.14',
      applianceCount: '1',
    });
    // LED bulb = 10W, 8 hrs/day, 30 days
    // kWh = 10 × 8 / 1000 = 0.08 kWh/day
    // 30 days = 2.4 kWh
    // cost = 2.4 × 0.14 = $0.336
    near(parseMoney(getValue(r, 'costPerPeriod')), 0.34, 0.01);
    expect(getValue(r, 'applianceLabel')).toContain('LED Bulb');
  });

  // ─── Daily / Weekly / Monthly / Yearly ──────────────────────────────────

  it('calculates daily cost correctly', () => {
    const r = config.calculate({
      wattage: '1000',
      hoursPerDay: '1',
      days: '1',
      costPerKwh: '0.10',
      applianceCount: '1',
    });
    // 1 kWh × $0.10 = $0.10
    near(parseMoney(getValue(r, 'costPerPeriod')), 0.10);
  });

  it('calculates weekly cost correctly (7 days)', () => {
    const r = config.calculate({
      wattage: '1000',
      hoursPerDay: '1',
      days: '7',
      costPerKwh: '0.10',
      applianceCount: '1',
    });
    // 7 kWh × $0.10 = $0.70
    near(parseMoney(getValue(r, 'costPerPeriod')), 0.70);
  });

  it('calculates monthly cost correctly (30 days)', () => {
    const r = config.calculate({
      wattage: '1000',
      hoursPerDay: '1',
      days: '30',
      costPerKwh: '0.10',
      applianceCount: '1',
    });
    // 30 kWh × $0.10 = $3.00
    near(parseMoney(getValue(r, 'costPerPeriod')), 3.00);
  });

  it('calculates yearly cost correctly (365 days)', () => {
    const r = config.calculate({
      wattage: '1000',
      hoursPerDay: '1',
      days: '365',
      costPerKwh: '0.10',
      applianceCount: '1',
    });
    // 365 kWh × $0.10 = $36.50
    near(parseMoney(getValue(r, 'costPerPeriod')), 36.50);
  });

  // ─── Multiple Appliances ────────────────────────────────────────────────

  it('scales cost for multiple appliances', () => {
    const r = config.calculate({
      wattage: '100',
      hoursPerDay: '10',
      days: '30',
      costPerKwh: '0.10',
      applianceCount: '5',
    });
    // Single: 100 × 10 / 1000 = 1 kWh/day, 30 kWh/period, $3.00
    // With 5: $15.00
    near(parseMoney(getValue(r, 'costPerPeriod')), 15.00);
    expect(getValue(r, 'applianceLabel')).toContain('×5');
  });

  // ─── Zero / Missing Values ──────────────────────────────────────────────

  it('returns empty for missing wattage (and no preset)', () => {
    const r = config.calculate({
      hoursPerDay: '4',
      days: '30',
      costPerKwh: '0.14',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for zero hoursPerDay', () => {
    const r = config.calculate({
      wattage: '1500',
      hoursPerDay: '0',
      days: '30',
      costPerKwh: '0.14',
    });
    expect(r).toEqual([]);
  });

  // ─── Cost Scaling Checks ────────────────────────────────────────────────

  it('cost per day, month, and year are consistent with each other', () => {
    const r = config.calculate({
      wattage: '1500',
      hoursPerDay: '4',
      days: '30',
      costPerKwh: '0.14',
      applianceCount: '1',
    });
    const dayCost = parseMoney(getValue(r, 'costPerDay'));
    const monthCost = parseMoney(getValue(r, 'costPerMonth'));
    const yearCost = parseMoney(getValue(r, 'costPerYear'));
    // Month should be ~30× day
    near(monthCost, dayCost * 30, 0.01);
    // Year should be ~365× day
    near(yearCost, dayCost * 365, 0.01);
  });

  // ─── kWh Calculation ────────────────────────────────────────────────────

  it('calculates kWh correctly for known values', () => {
    const r = config.calculate({
      wattage: '2000',
      hoursPerDay: '3',
      days: '7',
      costPerKwh: '0.12',
      applianceCount: '1',
    });
    // 2000W × 3hrs = 6000 Wh = 6 kWh/day
    // 6 × 7 = 42 kWh for the period
    // 42 × 0.12 = $5.04
    near(parseMoney(getValue(r, 'costPerPeriod')), 5.04);
  });

  // ─── Custom Input ───────────────────────────────────────────────────────

  it('uses custom wattage even when preset is selected with no value', () => {
    const r = config.calculate({
      preset: 'space-heater',
      wattage: '1000',
      hoursPerDay: '4',
      days: '30',
      costPerKwh: '0.10',
      applianceCount: '1',
    });
    // Should use 1000W (custom), not 1500W (preset)
    near(parseMoney(getValue(r, 'costPerPeriod')), 12.00);
    expect(getValue(r, 'applianceLabel')).toContain('Space Heater');
  });

  // ─── Period Label ───────────────────────────────────────────────────────

  it('shows correct period label in costPerPeriod result', () => {
    const r = config.calculate({
      wattage: '1000',
      hoursPerDay: '2',
      days: '365',
      costPerKwh: '0.10',
      applianceCount: '1',
    });
    expect(getValue(r, 'costPerPeriod')).toBeTruthy();
  });

  // ─── Cost Per Day / Month / Year all present ────────────────────────────

  it('returns costPerDay, costPerMonth, and costPerYear', () => {
    const r = config.calculate({
      wattage: '1000',
      hoursPerDay: '2',
      days: '30',
      costPerKwh: '0.10',
      applianceCount: '1',
    });
    expect(getValue(r, 'costPerDay')).toBeTruthy();
    expect(getValue(r, 'costPerMonth')).toBeTruthy();
    expect(getValue(r, 'costPerYear')).toBeTruthy();
  });

  // ─── Total Fields Count ─────────────────────────────────────────────────

  it('returns all expected result fields', () => {
    const r = config.calculate({
      wattage: '1500',
      hoursPerDay: '4',
      days: '30',
      costPerKwh: '0.14',
      applianceCount: '1',
    });
    expect(r.length).toBeGreaterThanOrEqual(8);
    const ids = r.map((x) => x.id);
    expect(ids).toContain('costPerPeriod');
    expect(ids).toContain('kwhUsed');
    expect(ids).toContain('kwhPerDay');
    expect(ids).toContain('costPerDay');
    expect(ids).toContain('costPerMonth');
    expect(ids).toContain('costPerYear');
    expect(ids).toContain('applianceLabel');
  });
});
