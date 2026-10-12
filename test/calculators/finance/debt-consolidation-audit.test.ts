import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/debt-consolidation/index';
import { parseDebts, simulateCurrentPlan } from '../../../src/calculators/finance/debt-consolidation/debtMath';
import { getValue, parseMoney, parseNumber } from '../../helpers';

// Expected values derived independently in Python (month-by-month simulation + PMT closed form).
const sarah = {
  debts: JSON.stringify([
    { name: 'Card A', balance: '6500', rate: '23', payment: '200' },
    { name: 'Card B', balance: '3200', rate: '20', payment: '150' },
    { name: 'Personal Loan', balance: '4000', rate: '10', payment: '100' },
  ]),
  newRate: '12', newTermMonths: '60', originationFee: '2',
};

describe('debt-consolidation audit', () => {
  it('Sarah worked example: payoff 52 months, $274 fee, $310.84 payment, saves $139/mo and $497 overall', () => {
    const r = config.calculate(sarah);
    expect(parseNumber(getValue(r, 'newPayment'))).toBeCloseTo(310.84, 2);
    expect(parseNumber(getValue(r, 'monthlySavings'))).toBeCloseTo(139.16, 2);
    expect(parseMoney(getValue(r, 'originationFeeAmt'))).toBe(274);
    expect(parseMoney(getValue(r, 'currentInterest'))).toBe(5448); // 5,447.93
    expect(parseMoney(getValue(r, 'newInterest'))).toBe(4677); // 4,676.63
    expect(parseMoney(getValue(r, 'lifetimeSaved'))).toBe(497); // 497.30
    expect(getValue(r, 'currentTimeline')).toBe('4yr 4mo');
  });

  it('interpretation text has no doubled dollar signs (regression: "$$139.16")', () => {
    const r = config.calculate(sarah);
    const text = r.map((x) => `${x.value} ${x.interpretation ?? ''}`).join(' ');
    expect(text).not.toMatch(/\$\$/);
  });

  it('single default debt: $6,500 @23% paying $200 takes 52 months, $3,774.59 interest', () => {
    const plan = simulateCurrentPlan(parseDebts(JSON.stringify([{ name: 'A', balance: '6500', rate: '23', payment: '200' }])));
    expect(plan.months).toBe(52);
    expect(plan.totalInterest).toBeCloseTo(3774.59, 1);
    expect(plan.paidOff).toBe(true);
  });

  it('payment below monthly interest gives a notice instead of a 50-year fantasy (regression)', () => {
    // 10,000 @ 24% => $200/mo interest; paying $150 never pays it off
    const r = config.calculate({ ...sarah, debts: JSON.stringify([{ name: 'Visa', balance: '10000', rate: '24', payment: '150' }]) });
    expect(r).toHaveLength(1);
    expect(r[0].id).toBe('error');
    expect(r[0].value).toContain('Visa');
  });

  it('a 0% new rate is a valid input (balance-transfer style): 13,700 over 12 months = 1,141.67', () => {
    const r = config.calculate({ ...sarah, newRate: '0', newTermMonths: '12', originationFee: '0' });
    expect(parseNumber(getValue(r, 'newPayment'))).toBeCloseTo(1141.67, 2);
    expect(parseMoney(getValue(r, 'newInterest'))).toBe(0);
  });

  it('longer, pricier loan can raise lifetime cost: 25% over 84 months is a loss', () => {
    const r = config.calculate({ ...sarah, newRate: '25', newTermMonths: '84', originationFee: '0' });
    expect(parseNumber(getValue(r, 'newPayment'))).toBeCloseTo(346.77, 2);
    expect(parseNumber(getValue(r, 'monthlySavings'))).toBeCloseTo(103.23, 2);
    expect(getValue(r, 'lifetimeSaved')).toBeTruthy();
    expect(r.find((x) => x.id === 'lifetimeSaved')!.color).toBe('negative');
  });

  it('parseDebts ignores incomplete rows and bad JSON', () => {
    expect(parseDebts('not json')).toEqual([]);
    expect(parseDebts('[{"name":"","balance":"","rate":"","payment":""}]')).toEqual([]);
    expect(parseDebts('[{"balance":"100","rate":"","payment":"10"}]')).toEqual([]); // blank APR is not silently 0%
    expect(parseDebts('[{"balance":"100","rate":"0","payment":"10"}]')).toHaveLength(1);
  });

  it('returns [] when fee is out of range or no debts', () => {
    expect(config.calculate({ ...sarah, originationFee: '11' })).toEqual([]);
    expect(config.calculate({ newRate: '12', newTermMonths: '60' })).toEqual([]);
  });
});
