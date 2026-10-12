// End-to-end audit regression tests for the automotive batch. Expected values were derived independently
// (closed-form PMT / hand arithmetic in a scratch script), not copied from the calculators' output.
import { describe, it, expect } from 'vitest';
import autoLoan from '../../../src/calculators/automotive/auto-loan/index';
import cashBack from '../../../src/calculators/automotive/cash-back-vs-low-interest/index';
import { compareOffers } from '../../../src/calculators/automotive/cash-back-vs-low-interest/cashBackMath';
import depreciation from '../../../src/calculators/automotive/depreciation/index';
import { valueAtAge, depreciation as dep } from '../../../src/calculators/automotive/depreciation/depreciationMath';
import lease from '../../../src/calculators/automotive/lease-calculator/index';
import leaseVsBuy from '../../../src/calculators/automotive/lease-vs-buy/index';
import { leaseVsBuy as lvb } from '../../../src/calculators/automotive/lease-vs-buy/leaseVsBuyMath';
import mpg from '../../../src/calculators/automotive/mpg-calculator/index';
import tire from '../../../src/calculators/automotive/tire-size/index';
import trip from '../../../src/calculators/automotive/trip-fuel-cost/index';
import { getValue } from '../../helpers';

describe('auto-loan', () => {
  const v = { vehiclePrice: '40000', loanTerm: '60', interestRate: '5', downPayment: '0', tradeInValue: '10000', tradeInOwed: '0', salesTaxPct: '8', titleRegFees: '0' };
  it('trade-in credit on the full allowance: (40,000 - 10,000) x 8% = 2,400', () => {
    expect(getValue(autoLoan.calculate(v), 'salesTaxLine')).toBe('$2,400.00');
  });
  it('a no-credit state taxes the full price: 40,000 x 8% = 3,200', () => {
    expect(getValue(autoLoan.calculate({ ...v, tradeInTaxCredit: 'no' }), 'salesTaxLine')).toBe('$3,200.00');
  });
  it('underwater trade-in still earns the allowance credit (worked example 2): payment 803.94', () => {
    const r = autoLoan.calculate({ vehiclePrice: '42000', loanTerm: '72', interestRate: '8.5', downPayment: '2000', tradeInValue: '15000', tradeInOwed: '18000', salesTaxPct: '6', titleRegFees: '600' });
    expect(getValue(r, 'salesTaxLine')).toBe('$1,620.00');
    expect(getValue(r, 'totalFinanced')).toBe('$45,220.00');
    expect(getValue(r, 'monthlyPayment')).toBe('$803.94');
  });
});

describe('cash-back-vs-low-interest', () => {
  const v = { vehiclePrice: '35000', downPayment: '0', loanTermMonths: '60', cashRebate: '3000', standardRate: '6.99', promoRate: '0' };
  it('worked example: A pays 633.49/mo, 38,009 total; B 583.33/mo, 35,000 -> promo wins by 3,009', () => {
    const c = compareOffers(v)!;
    expect(c.monthlyA).toBeCloseTo(633.49, 2);
    expect(c.totalPaidA).toBeCloseTo(38009.24, 1);
    expect(c.totalPaidB).toBeCloseTo(35000, 6);
    expect(c.aWins).toBe(false);
    expect(getValue(cashBack.calculate(v), 'winner')).toBe('Saves $3,009.24 overall');
  });
  it('shorter term and low bank rate flips the winner (4% bank, 36 mo: 34,012 vs 35,000)', () => {
    const c = compareOffers({ ...v, standardRate: '4', loanTermMonths: '36' })!;
    expect(c.totalPaidA).toBeCloseTo(34012, 0);
    expect(c.aWins).toBe(true);
    expect(compareOffers({ ...v, standardRate: '4', loanTermMonths: '60' })!.totalPaidA).toBeCloseTo(35360, 0);
  });
  it('a rebate larger than the loan does not create phantom interest', () => {
    const c = compareOffers({ ...v, vehiclePrice: '10000', cashRebate: '12000' })!;
    expect(c.principalA).toBe(0);
    expect(c.interestA).toBe(0);
    expect(c.totalPaidA).toBeCloseTo(-2000, 6); // 2,000 of rebate comes back as cash
  });
  it('identical totals are reported as a tie, not a win', () => {
    const r = cashBack.calculate({ ...v, cashRebate: '0', standardRate: '3', promoRate: '3' });
    expect(r.find((x) => x.id === 'winner')!.label).toBe('Both Options Cost the Same');
  });
});

describe('depreciation', () => {
  it('luxury 45,000 for 5 years: 17,770 left (0.75, 0.80, 0.85, 0.87, 0.89), loss 27,230', () => {
    const d = dep({ purchasePrice: '45000', vehicleAge: '0', yearsOwned: '5', vehicleType: 'luxury' })!;
    expect(d.futureValue).toBeCloseTo(45000 * 0.75 * 0.8 * 0.85 * 0.87 * 0.89, 6);
    expect(d.futureValue).toBeCloseTo(17770.2, 1);
    expect(d.totalDepreciation).toBeCloseTo(27229.8, 1);
    expect(d.monthly).toBeCloseTo(453.83, 2);
  });
  it('truck 45,000 for 5 years retains 25,920', () => {
    expect(valueAtAge(45000, 'truck', 5)).toBeCloseTo(25919.55, 1);
  });
  it('age past the 10-year table keeps compounding at 5% for the earlier years (was dropped)', () => {
    // avg table over 10 years then 5%/yr: age 12, hold 3 more -> only 3 tail years of loss
    const d = dep({ purchasePrice: '50000', vehicleAge: '12', yearsOwned: '3', vehicleType: 'average' })!;
    expect(d.futureValue / d.valueNow).toBeCloseTo(0.95 ** 3, 9);
    const ten = valueAtAge(50000, 'average', 10);
    expect(d.valueNow).toBeCloseTo(ten * 0.95 ** 2, 6);
  });
  it('half-year ages interpolate geometrically within a year', () => {
    expect(valueAtAge(1000, 'average', 0.5)).toBeCloseTo(1000 * Math.sqrt(0.8), 9);
  });
  it('adds a "value today" row only for used vehicles', () => {
    expect(depreciation.calculate({ purchasePrice: '30000', vehicleAge: '3', yearsOwned: '2', vehicleType: 'average' }).some((r) => r.id === 'currentValue')).toBe(true);
    expect(depreciation.calculate({ purchasePrice: '30000', vehicleAge: '0', yearsOwned: '2', vehicleType: 'average' }).some((r) => r.id === 'currentValue')).toBe(false);
  });
});

describe('lease-calculator', () => {
  const v = { msrp: '45000', negotiatedPrice: '42500', downPayment: '2000', leaseTerm: '36', residualValuePct: '55', rateInputType: 'mf', moneyFactor: '0.00125', salesTax: '8.25', acquisitionFee: '895' };
  it('worked example 1: 590.01/mo after tax, 23,240.30 all-in', () => {
    const r = lease.calculate(v);
    expect(getValue(r, 'totalMonthlyPayment')).toBe('$590.01');
    expect(getValue(r, 'baseMonthlyPayment')).toBe('$545.04');
    expect(getValue(r, 'totalLeaseCostResult')).toBe('$23,240.30');
    expect(getValue(r, 'effectiveAPRResult')).toBe('3.00%');
  });
  it('APR input converts at /2400: 3% APR gives the same payment as MF 0.00125', () => {
    const r = lease.calculate({ ...v, rateInputType: 'apr', aprRate: '3' });
    expect(getValue(r, 'totalMonthlyPayment')).toBe('$590.01');
  });
  it('worked example 2: dealer A 478.14 vs dealer B 487.68', () => {
    const a = lease.calculate({ msrp: '38000', negotiatedPrice: '36000', downPayment: '0', leaseTerm: '36', residualValuePct: '60', rateInputType: 'mf', moneyFactor: '0.0015', salesTax: '0', acquisitionFee: '795' });
    const b = lease.calculate({ msrp: '38000', negotiatedPrice: '36000', downPayment: '0', leaseTerm: '36', residualValuePct: '55', rateInputType: 'mf', moneyFactor: '0.0008', salesTax: '0', acquisitionFee: '795' });
    expect(getValue(a, 'totalMonthlyPayment')).toBe('$478.14');
    expect(getValue(b, 'totalMonthlyPayment')).toBe('$487.68');
  });
  it('a blank rate is incomplete, not a silent 0% lease; a residual above cap cost gives no payment', () => {
    expect(lease.calculate({ ...v, moneyFactor: '' })).toEqual([]);
    expect(lease.calculate({ ...v, residualValuePct: '95', negotiatedPrice: '20000', moneyFactor: '0' })).toEqual([]);
  });
});

describe('lease-vs-buy', () => {
  it('worked example 2: lease 15,180 vs net buy 20,952 (loan still owed 14,027, car 19,298)', () => {
    const c = lvb({ vehiclePrice: '35000', leasePayment: '380', leaseDownPayment: '1500', leaseTerm: '36', buyDownPayment: '3500', buyAPR: '7.5', depreciationRate: '18' })!;
    expect(c.totalLeaseCost).toBe(15180);
    expect(c.loanBalance).toBeCloseTo(14026.69, 1);
    expect(c.residualValue).toBeCloseTo(19297.88, 1);
    expect(c.netBuyCost).toBeCloseTo(20951.84, 1);
    expect(c.leaseWins).toBe(true);
  });
  it('an entered 0% depreciation is honored (it used to fall back to 15%)', () => {
    const c = lvb({ vehiclePrice: '40000', leasePayment: '450', leaseDownPayment: '2000', leaseTerm: '36', buyDownPayment: '5000', buyAPR: '6.9', depreciationRate: '0' })!;
    expect(c.residualValue).toBe(40000);
  });
  it('a 36-month loan is fully repaid inside a 36-month window', () => {
    const c = lvb({ vehiclePrice: '30000', leasePayment: '400', leaseTerm: '36', buyDownPayment: '0', buyAPR: '5', buyLoanTerm: '36', depreciationRate: '15' })!;
    expect(c.loanBalance).toBeCloseTo(0, 6);
  });
  it('sales tax: lease taxed per payment, purchase taxed on price and financed', () => {
    const c = lvb({ vehiclePrice: '30000', leasePayment: '400', leaseDownPayment: '1000', leaseTerm: '36', buyDownPayment: '0', buyAPR: '5', salesTax: '10', depreciationRate: '15' })!;
    expect(c.totalLeaseCost).toBeCloseTo(1000 + 400 * 36 * 1.1, 6);
    expect(c.loanPrincipal).toBeCloseTo(33000, 6);
  });
  it('blank APR is incomplete', () => {
    expect(leaseVsBuy.calculate({ vehiclePrice: '40000', leasePayment: '450' })).toEqual([]);
  });
});

describe('mpg-calculator', () => {
  it('L/100km = 235.2146 / mpg, km/L = mpg x 1.609344 / 3.785412', () => {
    const r = mpg.calculate({ mode: 'convert', mpg: '30' });
    expect(getValue(r, 'l100km')).toBe('7.84 L/100km');
    expect(getValue(r, 'kpl')).toBe('12.75 km/L');
  });
  it('worked examples: 385 mi / 14.2 gal = 27.11 MPG; 1,200 mi at 24 MPG, $3.45 = $172.50', () => {
    expect(getValue(mpg.calculate({ mode: 'mpg', milesDriven: '385', gallonsUsed: '14.2' }), 'mpg')).toBe('27.11 MPG');
    expect(getValue(mpg.calculate({ mode: 'tripcost', milesDriven: '1200', mpg: '24', fuelPrice: '3.45' }), 'tripCost')).toBe('$172.50');
    expect(getValue(mpg.calculate({ mode: 'range', tankSize: '18', mpg: '24' }), 'usable')).toBe('388.80 miles');
  });
});

describe('tire-size', () => {
  const t = (o: string, n: string) => {
    const [ow, oa, or] = o.split(/[/R]/); const [nw, na, nr] = n.split(/[/R]/);
    return tire.calculate({ origWidth: ow, origAspect: oa, origRim: or, newWidth: nw, newAspect: na, newRim: nr });
  };
  it('225/50R17 -> 235/45R18: 656.8 mm -> 668.7 mm = +1.81%; 60 mph indicated is 61.09 actual', () => {
    const r = t('225/50R17', '235/45R18');
    expect(getValue(r, 'diamDiff')).toBe('1.81%');
    expect(getValue(r, 'actualAt60')).toBe('61.09 mph');
  });
  it('245/75R17 -> 285/70R17 (33s): +3.94% (derived 799.3 -> 830.8 mm)', () => {
    expect(getValue(t('245/75R17', '285/70R17'), 'diamDiff')).toBe('3.94%');
  });
  it('identical sizes read "no change" (previously claimed the speedometer reads higher)', () => {
    expect(getValue(t('225/50R17', '225/50R17'), 'speedError')).toBe('0% (no change)');
  });
});

describe('trip-fuel-cost', () => {
  it('MPG path: 270 mi at 28 MPG, $3.50 -> 9.64 gal, $33.75, $12.50 per 100 mi', () => {
    const r = trip.calculate({ distance: '270', distanceUnit: 'miles', fuelEfficiency: '28', efficiencyUnit: 'mpg', fuelPrice: '3.50', passengers: '4' });
    expect(getValue(r, 'totalCost')).toBe('$33.75');
    expect(getValue(r, 'perPerson')).toBe('$8.44');
    expect(getValue(r, 'costPer100')).toBe('$12.50');
  });
  it('metric path: 450 km at 6.5 L/100km, 1.80 per liter, 3 people -> 29.25 L, 52.65, 17.55 each', () => {
    const r = trip.calculate({ distance: '450', distanceUnit: 'km', fuelEfficiency: '6.5', efficiencyUnit: 'l100km', fuelPrice: '1.80', passengers: '3' });
    expect(getValue(r, 'gallonsNeeded')).toBe('29.25 liters');
    expect(getValue(r, 'totalCost')).toBe('$52.65');
    expect(getValue(r, 'perPerson')).toBe('$17.55');
    expect(getValue(r, 'costPer100')).toBe('$11.70');
  });
  it('km distance with MPG efficiency converts the distance only (price stays per gallon)', () => {
    // 160.9344 km = 100 miles; 100 / 25 mpg = 4 gal x 3 = 12
    const r = trip.calculate({ distance: '160.9344', distanceUnit: 'km', fuelEfficiency: '25', efficiencyUnit: 'mpg', fuelPrice: '3' });
    expect(getValue(r, 'totalCost')).toBe('$12.00');
  });
});
