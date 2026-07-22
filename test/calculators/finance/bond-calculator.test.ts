import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/bond-calculator';
import { getValue, parseMoney, parseNumber, near } from '../../helpers';

describe('bond-calculator', () => {
  const base = {
    faceValue: '1000',
    couponRate: '5',
    marketPrice: '1000',
    yearsToMaturity: '10',
    paymentFrequency: '2',
  };

  it('par bond: YTM equals coupon rate', () => {
    const r = config.calculate(base);
    const ytm = parseNumber(getValue(r, 'ytm'));
    near(ytm, 5, 0.1);
    expect(getValue(r, 'pricingStatus')).toContain('At Par');
  });

  it('discount bond: YTM exceeds coupon rate', () => {
    const r = config.calculate({ ...base, marketPrice: '950' });
    const ytm = parseNumber(getValue(r, 'ytm'));
    expect(ytm).toBeGreaterThan(5);
    expect(getValue(r, 'pricingStatus')).toContain('Discount');
    expect(parseMoney(getValue(r, 'capitalGainLoss'))).toBeGreaterThan(0);
  });

  it('premium bond: YTM is below coupon rate', () => {
    const r = config.calculate({ ...base, marketPrice: '1050' });
    const ytm = parseNumber(getValue(r, 'ytm'));
    expect(ytm).toBeLessThan(5);
    expect(getValue(r, 'pricingStatus')).toContain('Premium');
    expect(parseMoney(getValue(r, 'capitalGainLoss'))).toBeLessThan(0);
  });

  it('annual coupon equals faceValue * couponRate', () => {
    const r = config.calculate(base);
    near(parseMoney(getValue(r, 'annualCoupon')), 50);
  });

  it('semi-annual frequency: annual coupon still same total', () => {
    const rAnnual = config.calculate({ ...base, paymentFrequency: '1' });
    const rSemi = config.calculate({ ...base, paymentFrequency: '2' });
    near(
      parseMoney(getValue(rAnnual, 'annualCoupon')),
      parseMoney(getValue(rSemi, 'annualCoupon')),
    );
  });

  it('current yield = coupon / price for par bond matches coupon', () => {
    const r = config.calculate(base);
    const cy = parseNumber(getValue(r, 'currentYield'));
    near(cy, 5, 0.1);
  });

  it('returns empty when required fields are missing', () => {
    expect(config.calculate({})).toHaveLength(0);
  });
});
