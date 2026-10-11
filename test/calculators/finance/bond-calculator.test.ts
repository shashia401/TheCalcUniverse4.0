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

describe('bond-calculator – audit regressions', () => {
  const ytm = (v: Record<string, string>) => parseFloat(config.calculate(v).find((r: any) => r.id === 'ytm')!.value);
  it('$1000 5% semi-annual 10y at $950 -> YTM 5.6617% (bisection on PV of 20 coupons + face)', () => {
    expect(ytm({ faceValue: '1000', couponRate: '5', marketPrice: '950', yearsToMaturity: '10', paymentFrequency: '2' })).toBeCloseTo(5.6617, 3);
  });
  it('annual 6% bond at $1100, 5y -> 3.7683%', () => {
    expect(ytm({ faceValue: '1000', couponRate: '6', marketPrice: '1100', yearsToMaturity: '5', paymentFrequency: '1' })).toBeCloseTo(3.7683, 3);
  });
  it('zero-coupon priced above face has a NEGATIVE yield: 2*((1000/1100)^(1/10)-1) = -1.8971% (was clamped to +0.02%)', () => {
    expect(ytm({ faceValue: '1000', couponRate: '0', marketPrice: '1100', yearsToMaturity: '5', paymentFrequency: '2' })).toBeCloseTo(-1.8971, 3);
  });
});
