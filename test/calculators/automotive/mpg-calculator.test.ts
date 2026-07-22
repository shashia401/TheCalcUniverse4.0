import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/automotive/mpg-calculator/index';

import { getValue, parseNumber, near } from '../../helpers';

describe('mpg-calculator', () => {
  describe('mpg mode', () => {
    it('calculates MPG from miles and gallons', () => {
      const r = config.calculate({
        mode: 'mpg',
        milesDriven: '350',
        gallonsUsed: '12.5',
      });
      expect(r).toHaveLength(3);
      // 350 / 12.5 = 28 MPG
      near(parseNumber(getValue(r, 'mpg')), 28.00);
      // L/100km = 235.215 / 28 = 8.40
      near(parseNumber(getValue(r, 'l100km')), 8.40, 0.1);
    });

    it('returns empty for missing gallons or miles', () => {
      expect(config.calculate({ mode: 'mpg' })).toHaveLength(0);
      expect(config.calculate({ mode: 'mpg', milesDriven: '100' })).toHaveLength(0);
      expect(config.calculate({ mode: 'mpg', gallonsUsed: '10' })).toHaveLength(0);
    });

    it('returns empty for zero gallons used', () => {
      const r = config.calculate({
        mode: 'mpg',
        milesDriven: '100',
        gallonsUsed: '0',
      });
      expect(r).toHaveLength(0);
    });
  });

  describe('trip cost mode', () => {
    it('calculates trip fuel cost', () => {
      const r = config.calculate({
        mode: 'tripcost',
        milesDriven: '300',
        mpg: '25',
        fuelPrice: '3.50',
      });
      expect(r).toHaveLength(3);
      // gallonsNeeded = 300 / 25 = 12
      // tripCost = 12 * 3.50 = 42.00
      near(parseNumber(getValue(r, 'tripCost')), 42.00);
      // costPerMile = 42 / 300 = 0.14
      near(parseNumber(getValue(r, 'costPerMile')), 0.14, 0.01);
    });

    it('returns empty for missing inputs', () => {
      expect(config.calculate({ mode: 'tripcost' })).toHaveLength(0);
      expect(config.calculate({ mode: 'tripcost', milesDriven: '100', mpg: '25' })).toHaveLength(0);
    });
  });

  describe('range mode', () => {
    it('calculates full tank range', () => {
      const r = config.calculate({
        mode: 'range',
        tankSize: '15',
        mpg: '30',
      });
      expect(r).toHaveLength(2);
      // range = 15 * 30 = 450
      near(parseNumber(getValue(r, 'range')), 450);
      // usable = 15 * 0.9 * 30 = 405
      near(parseNumber(getValue(r, 'usable')), 405);
    });

    it('returns empty for zero MPG', () => {
      const r = config.calculate({
        mode: 'range',
        tankSize: '15',
        mpg: '0',
      });
      expect(r).toHaveLength(0);
    });
  });

  describe('convert mode', () => {
    it('converts MPG to L/100km and km/L', () => {
      const r = config.calculate({
        mode: 'convert',
        mpg: '30',
      });
      expect(r).toHaveLength(3);
      // L/100km = 235.215 / 30 = 7.84
      near(parseNumber(getValue(r, 'l100km')), 7.84, 0.1);
      // km/L = 30 * 1.60934 / 3.78541 = 12.756
      near(parseNumber(getValue(r, 'kpl')), 12.76, 0.1);
      // MPG should be echoed back
      near(parseNumber(getValue(r, 'mpg')), 30);
    });

    it('returns empty for invalid or zero MPG', () => {
      expect(config.calculate({ mode: 'convert', mpg: '' })).toHaveLength(0);
      expect(config.calculate({ mode: 'convert', mpg: '0' })).toHaveLength(0);
    });
  });

  it('returns empty for unknown mode', () => {
    const r = config.calculate({ mode: 'invalid', mpg: '25' });
    expect(r).toHaveLength(0);
  });

  it('returns empty for completely empty inputs', () => {
    expect(config.calculate({})).toHaveLength(0);
  });
});
