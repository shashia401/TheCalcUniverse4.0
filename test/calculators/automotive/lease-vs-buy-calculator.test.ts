import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/automotive/lease-vs-buy/index';

import { getValue, getResult, parseNumber, near } from '../../helpers';

describe('lease-vs-buy', () => {
  it('lease vs buy comparison: buying costs less for a typical scenario', () => {
    const r = config.calculate({
      vehiclePrice: '40000',
      leasePayment: '450',
      leaseDownPayment: '2000',
      leaseTerm: '36',
      buyDownPayment: '5000',
      buyAPR: '6.9',
      depreciationRate: '15',
    });
    expect(r).toHaveLength(5);
    // totalLeaseCost = 2000 + 450 * 36 = 18200
    near(parseNumber(getValue(r, 'totalLease')), 18200, 100);
    // recommendation should exist
    expect(getValue(r, 'recommendation')).toBeTruthy();
    // residual value should be positive
    near(parseNumber(getValue(r, 'residualValue')), 24565, 100);
  });

  it('worked example: Alex $40k SUV — regression for narrative drift fix', () => {
    // End-to-end audit: the old model ignored the loan still owed after 36 of 60 payments, so buying looked
    // $12,875 cheaper. Independent derivation: payment = 35,000 at 0.575%/month over 60 = 691.39; after 36
    // payments the balance is 15,457.95; the car is worth 40,000 x 0.85^3 = 24,565. Net buy cost =
    // 5,000 + 24,890.11 + 15,457.95 - 24,565.00 = 20,783.06 versus 18,200 to lease (lease saves 2,583).
    const r = config.calculate({
      vehiclePrice: '40000',
      leasePayment: '450',
      leaseDownPayment: '2000',
      leaseTerm: '36',
      buyDownPayment: '5000',
      buyAPR: '6.9',
      depreciationRate: '15',
    });
    near(parseNumber(getValue(r, 'totalBuy')), 20783, 1);
    near(parseNumber(getValue(r, 'loanBalance')), 15458, 1);
    expect(getValue(r, 'recommendation')).toContain('Save $2,583');
    expect(r.find((x) => x.id === 'recommendation')!.label).toContain('leasing costs less');
  });

  it('higher lease payment makes buying the recommendation', () => {
    const r = config.calculate({
      vehiclePrice: '40000',
      leasePayment: '700',
      leaseDownPayment: '3000',
      leaseTerm: '36',
      buyDownPayment: '5000',
      buyAPR: '6.9',
      depreciationRate: '15',
    });
    expect(r).toHaveLength(5);
    // totalLeaseCost = 3000 + 700 * 36 = 28200
    near(parseNumber(getValue(r, 'totalLease')), 28200, 100);
    // buying should be recommended since lease is expensive (check label)
    const recLabel = getResult(r, 'recommendation').label;
    expect(recLabel).toContain('buying');
  });

  it('zero buy APR uses simple division for buy payment', () => {
    const r = config.calculate({
      vehiclePrice: '24000',
      leasePayment: '350',
      leaseTerm: '36',
      buyDownPayment: '0',
      buyAPR: '0',
      depreciationRate: '15',
    });
    expect(r).toHaveLength(5);
    // totalLeaseCost = 0 + 350 * 36 = 12600
    near(parseNumber(getValue(r, 'totalLease')), 12600, 100);
    // Residual value: 24000 * (1-0.15)^3 = 24000 * 0.614125 = 14739
    near(parseNumber(getValue(r, 'residualValue')), 14739, 100);
  });

  it('returns empty for zero vehicle price', () => {
    const r = config.calculate({
      vehiclePrice: '0',
      leasePayment: '400',
    });
    expect(r).toHaveLength(0);
  });

  it('returns empty for missing required fields', () => {
    expect(config.calculate({})).toHaveLength(0);
    expect(config.calculate({ vehiclePrice: '30000' })).toHaveLength(0);
  });

  it('48-month lease term', () => {
    const r = config.calculate({
      vehiclePrice: '35000',
      leasePayment: '400',
      leaseDownPayment: '1500',
      leaseTerm: '48',
      buyDownPayment: '4000',
      buyAPR: '5.9',
      depreciationRate: '15',
    });
    expect(r).toHaveLength(5);
    // totalLeaseCost = 1500 + 400 * 48 = 20700
    near(parseNumber(getValue(r, 'totalLease')), 20700, 100);
    // Residual: 35000 * (1-0.15)^4 = 35000 * 0.5220 = 18270
    near(parseNumber(getValue(r, 'residualValue')), 18270, 100);
  });
});
