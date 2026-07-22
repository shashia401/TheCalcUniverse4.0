import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/automotive/trip-fuel-cost/index';

import { getValue, parseNumber, near } from '../../helpers';

describe('trip-fuel-cost', () => {
  it('basic trip calculation: 300 miles, 25 MPG, $3.50/gal', () => {
    const r = config.calculate({
      distance: '300',
      distanceUnit: 'miles',
      fuelEfficiency: '25',
      efficiencyUnit: 'mpg',
      fuelPrice: '3.50',
    });
    expect(r).toHaveLength(4);
    // totalCost = (300/25) * 3.50 = 12 * 3.50 = 42.00
    near(parseNumber(getValue(r, 'totalCost')), 42.00);
    // costPerPerson = 42 / 1 = 42
    near(parseNumber(getValue(r, 'perPerson')), 42.00);
    // gallonsNeeded = 300/25 = 12
    near(parseNumber(getValue(r, 'gallonsNeeded')), 12.00);
    // costPer100 = (100/300) * 42 = 14.00
    near(parseNumber(getValue(r, 'costPer100')), 14.00);
  });

  it('distance in kilometers and L/100km', () => {
    const r = config.calculate({
      distance: '500',
      distanceUnit: 'km',
      fuelEfficiency: '8',
      efficiencyUnit: 'l100km',
      fuelPrice: '4.00',
    });
    expect(r).toHaveLength(4);
    // distance in miles: 500 * 0.621371 = 310.6855
    // mpg = 235.215 / 8 = 29.401875
    // gallonsNeeded = 310.6855 / 29.401875 ≈ 10.567
    // totalCost = 10.567 * 4.00 ≈ 42.27
    const cost = parseNumber(getValue(r, 'totalCost'));
    near(cost, 42.27, 0.1);
  });

  it('high MPG and multiple passengers', () => {
    const r = config.calculate({
      distance: '1000',
      distanceUnit: 'miles',
      fuelEfficiency: '50',
      efficiencyUnit: 'mpg',
      fuelPrice: '4.00',
      passengers: '4',
    });
    expect(r).toHaveLength(4);
    // gallonsNeeded = 1000/50 = 20
    // totalCost = 20 * 4.00 = 80.00
    near(parseNumber(getValue(r, 'totalCost')), 80.00);
    // costPerPerson = 80/4 = 20.00
    near(parseNumber(getValue(r, 'perPerson')), 20.00);
  });

  it('zero distance is allowed (calculator does not reject zero distance)', () => {
    const r = config.calculate({
      distance: '0',
      distanceUnit: 'miles',
      fuelEfficiency: '25',
      efficiencyUnit: 'mpg',
      fuelPrice: '3.50',
    });
    expect(r).toHaveLength(4);
    near(parseNumber(getValue(r, 'totalCost')), 0);
  });

  it('zero or negative efficiency returns empty', () => {
    const r1 = config.calculate({
      distance: '100',
      fuelEfficiency: '0',
      fuelPrice: '3.50',
    });
    expect(r1).toHaveLength(0);

    const r2 = config.calculate({
      distance: '100',
      fuelEfficiency: '-5',
      fuelPrice: '3.50',
    });
    expect(r2).toHaveLength(0);
  });

  it('missing required fields returns empty', () => {
    expect(config.calculate({})).toHaveLength(0);
    expect(config.calculate({ distance: '100' })).toHaveLength(0);
  });

  it('rejects NaN distance', () => {
    const r = config.calculate({
      distance: 'abc',
      fuelEfficiency: '25',
      fuelPrice: '3.50',
    });
    expect(r).toHaveLength(0);
  });

  it('rejects NaN fuel efficiency', () => {
    const r = config.calculate({
      distance: '300',
      fuelEfficiency: 'not-a-number',
      fuelPrice: '3.50',
    });
    expect(r).toHaveLength(0);
  });

  it('rejects NaN fuel price', () => {
    const r = config.calculate({
      distance: '300',
      fuelEfficiency: '25',
      fuelPrice: '',
    });
    expect(r).toHaveLength(0);
  });

  it('rejects negative distance with error message', () => {
    const r = config.calculate({
      distance: '-100',
      fuelEfficiency: '25',
      fuelPrice: '3.50',
    });
    expect(r).toHaveLength(1);
    expect(r[0].id).toBe('error');
    expect(r[0].color).toBe('negative');
  });

  it('zero passengers defaults to 1 person', () => {
    const r = config.calculate({
      distance: '300',
      fuelEfficiency: '25',
      fuelPrice: '3.50',
      passengers: '0',
    });
    expect(r).toHaveLength(4);
    // passengers defaults to 1 when 0 is passed, so perPerson = totalCost
    near(parseNumber(getValue(r, 'perPerson')), 42.00);
  });

  it('negative fuel price produces negative totals (accepted as valid input)', () => {
    const r = config.calculate({
      distance: '300',
      fuelEfficiency: '25',
      fuelPrice: '-3.50',
    });
    expect(r).toHaveLength(4);
    // totalCost = (300/25) * (-3.50) = -42.00
    near(parseNumber(getValue(r, 'totalCost')), -42.00);
  });

  it('handles large distance values correctly', () => {
    const r = config.calculate({
      distance: '10000',
      distanceUnit: 'miles',
      fuelEfficiency: '35',
      efficiencyUnit: 'mpg',
      fuelPrice: '3.00',
    });
    expect(r).toHaveLength(4);
    // gallons = 10000/35 ≈ 285.71
    // totalCost = 285.71 * 3.00 = 857.14
    near(parseNumber(getValue(r, 'totalCost')), 857.14, 0.5);
  });

  it('L/100km conversion edge case: very efficient vehicle', () => {
    const r = config.calculate({
      distance: '100',
      distanceUnit: 'km',
      fuelEfficiency: '3.5',
      efficiencyUnit: 'l100km',
      fuelPrice: '1.50',
    });
    expect(r).toHaveLength(4);
    // mpg = 235.215 / 3.5 = 67.204
    // distance miles = 100 * 0.621371 = 62.1371
    // gallons = 62.1371 / 67.204 = 0.9246
    // totalCost = 0.9246 * 1.50 ≈ 1.39
    near(parseNumber(getValue(r, 'totalCost')), 1.39, 0.1);
  });

  it('default units assumed when not provided', () => {
    const r = config.calculate({
      distance: '300',
      fuelEfficiency: '30',
      fuelPrice: '3.00',
    });
    expect(r).toHaveLength(4);
    // miles + mpg assumed, totalCost = (300/30) * 3.00 = 30.00
    near(parseNumber(getValue(r, 'totalCost')), 30.00);
    near(parseNumber(getValue(r, 'gallonsNeeded')), 10.00);
  });

  describe('Educational content', () => {
    it('has formula defined', () => {
      expect(config.educational.formula).toBeTruthy();
    });

    it('has 4+ variables', () => {
      expect(config.educational.variables).toHaveLength(4);
    });

    it('has how-to-use instructions', () => {
      expect(config.educational.howToUse?.length).toBeGreaterThanOrEqual(5);
    });

    it('has explanation', () => {
      expect(config.educational.explanation).toBeTruthy();
      expect(config.educational.explanation.length).toBeGreaterThan(500);
    });

    it('has 5+ FAQs', () => {
      expect(config.educational.faqs?.length).toBeGreaterThanOrEqual(5);
    });

    it('has worked examples', () => {
      expect(config.educational.workedExamples?.length).toBeGreaterThanOrEqual(2);
    });

    it('has pro tips', () => {
      expect(config.educational.proTips?.length).toBeGreaterThanOrEqual(4);
    });

    it('has limitations', () => {
      expect(config.educational.limitations?.length).toBeGreaterThanOrEqual(3);
    });

    it('has quick reference', () => {
      expect(config.educational.quickReference?.length).toBeGreaterThanOrEqual(5);
    });

    it('all relevant inputs have inputMode defined', () => {
      for (const input of config.inputs) {
        if (input.type === 'number' || input.type === 'percentage') {
          expect(input.inputMode).toBeTruthy();
        }
      }
    });
  });
});
