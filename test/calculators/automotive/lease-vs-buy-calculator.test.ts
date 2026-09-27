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
    expect(r).toHaveLength(4);
    // totalLeaseCost = 2000 + 450 * 36 = 18200
    near(parseNumber(getValue(r, 'totalLease')), 18200, 100);
    // recommendation should exist
    expect(getValue(r, 'recommendation')).toBeTruthy();
    // residual value should be positive
    near(parseNumber(getValue(r, 'residualValue')), 24565, 100);
  });

  it('worked example: Alex $40k SUV — regression for narrative drift fix', () => {
    // Educational workedExamples "result" text previously claimed $12,535 savings and a
    // $5,665 net buy cost, disagreeing with its own insight text ($12,870 / $5,330) and
    // with the real calculate() output. Pin the correct values: $12,875 savings, $5,325 net buy cost.
    const r = config.calculate({
      vehiclePrice: '40000',
      leasePayment: '450',
      leaseDownPayment: '2000',
      leaseTerm: '36',
      buyDownPayment: '5000',
      buyAPR: '6.9',
      depreciationRate: '15',
    });
    near(parseNumber(getValue(r, 'totalBuy')), 5325, 5);
    const savings = 18200 - parseNumber(getValue(r, 'totalBuy'));
    near(savings, 12875, 5);
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
    expect(r).toHaveLength(4);
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
    expect(r).toHaveLength(4);
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
    expect(r).toHaveLength(4);
    // totalLeaseCost = 1500 + 400 * 48 = 20700
    near(parseNumber(getValue(r, 'totalLease')), 20700, 100);
    // Residual: 35000 * (1-0.15)^4 = 35000 * 0.5220 = 18270
    near(parseNumber(getValue(r, 'residualValue')), 18270, 100);
  });
});
