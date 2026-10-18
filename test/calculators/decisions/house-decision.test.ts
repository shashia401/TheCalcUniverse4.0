import { describe, it, expect } from 'vitest';
import { evaluateHouse, HOUSE_DEFAULTS, inputsFromQuery, queryFromInputs, validateHouse } from '../../../src/lib/houseDecision';
import { closingCosts } from '../../../src/calculators/realestate/closing-costs/closingMath';

// Oracle: Python Decimal (50 digits) from the published formulas, independent of the code under test.
//   P&I = loan * r / (1 - (1+r)^-n);  max price P solves (P - D)k + P*t + ins = H,  H = min(28% income, 36% income - debts)
const base = HOUSE_DEFAULTS; // $100k income, $500 debts, $400k home, 20% down, 6.75%, 30y, 1.1% tax, $1,500 insurance

describe('house decision engine: affordability, DTI, cash, verdict', () => {
  it('$400k at 20% down: payment and ratios match the independent calculation', () => {
    const d = evaluateHouse(base);
    expect(d.loan).toBe(320000);
    expect(d.principalAndInterest).toBeCloseTo(2075.51, 2);
    expect(d.propertyTax).toBeCloseTo(366.67, 2);
    expect(d.insurance).toBeCloseTo(125, 2);
    expect(d.pmi).toBe(0);
    expect(d.housing).toBeCloseTo(2567.18, 2);
    expect(d.frontEnd).toBeCloseTo(30.81, 2);
    expect(d.backEnd).toBeCloseTo(36.81, 2);
  });

  it('maximum price matches the independent solve (28% front limit binds)', () => {
    expect(evaluateHouse(base).maxPrice).toBeCloseTo(368410.32, 0);
  });

  it('maximum price when the 36% back-end limit binds ($1,500 other debts)', () => {
    expect(evaluateHouse({ ...base, debts: 1500 }).maxPrice).toBeCloseTo(255837.99, 0);
  });

  it('under 20% down adds PMI at 0.8% of the loan per year', () => {
    const d = evaluateHouse({ ...base, downPct: 10 });
    expect(d.pmi).toBeCloseTo(240, 2);
    expect(d.principalAndInterest).toBeCloseTo(2334.95, 2);
    expect(d.housing).toBeCloseTo(3066.62, 2);
    expect(d.frontEnd).toBeCloseTo(36.8, 1);
    expect(d.backEnd).toBeCloseTo(42.8, 1);
  });

  it('cash to close = down payment + the closing-cost model + 3 months of housing', () => {
    const d = evaluateHouse(base);
    expect(d.closing).toBe(closingCosts(400000, 20, 0.0675).totalBuyer);
    expect(d.reserves).toBeCloseTo(3 * d.housing, 6);
    expect(d.cashNeeded).toBeCloseTo(80000 + d.closing + d.reserves, 6);
    expect(d.cashLeft).toBeCloseTo(120000 - d.cashNeeded, 6);
  });

  it('verdict: $400k is over the $368k limit; $250k is comfortable', () => {
    expect(evaluateHouse(base).verdict).toBe('over');
    const ok = evaluateHouse({ ...base, price: 250000, savings: 100000 });
    expect(ok.verdict).toBe('comfortable');
    expect(ok.reasons).toHaveLength(1);
  });

  it('a cash shortfall makes an otherwise fine purchase "tight" and says by how much', () => {
    const d = evaluateHouse({ ...base, price: 250000, savings: 55000 });
    expect(d.cashLeft).toBeLessThan(0);
    expect(d.verdict).toBe('tight');
    expect(d.reasons.join(' ')).toMatch(/short/);
  });

  it('no room for any housing payment is "over", not a crash', () => {
    const d = evaluateHouse({ ...base, debts: 5000 });
    expect(d.maxPrice).toBeNull();
    expect(d.verdict).toBe('over');
  });

  it('rent vs buy: a short stay favours renting, a long stay buying (break-even from the shared simulation)', () => {
    const short = evaluateHouse({ ...base, stay: 2 });
    expect(short.rentVsBuy).toBe('rent');
    const long = evaluateHouse({ ...base, stay: 30 });
    expect(long.rentVsBuy).toBe('buy');
    expect(long.breakEvenYear).not.toBeNull();
    expect(long.breakEvenYear!).toBeGreaterThan(2);
  });
});

describe('house decision: validation and the shareable link', () => {
  it('rejects nonsense instead of producing numbers', () => {
    expect(validateHouse(base)).toBe(true);
    expect(validateHouse({ ...base, price: 0 })).toBe(false);
    expect(validateHouse({ ...base, downPct: 100 })).toBe(false);
    expect(validateHouse({ ...base, rate: NaN })).toBe(false);
    expect(validateHouse({ ...base, years: 1 })).toBe(false);
  });

  it('every input survives a trip through the query string', () => {
    const custom = { ...base, income: 142500, debts: 910, savings: 61000.5, price: 515000, downPct: 12.5, rate: 6.125, years: 20, taxPct: 0.85, insurance: 2100, hoa: 175, rent: 2650, stay: 9 };
    expect(inputsFromQuery(queryFromInputs(custom))).toEqual(custom);
  });

  it('ignores unknown keys, junk values and over-long values', () => {
    const got = inputsFromQuery('?price=abc&rate=7.25&evil=<script>&income=' + '9'.repeat(40) + '&down=');
    expect(got.price).toBe(base.price);
    expect(got.rate).toBe(7.25);
    expect(got.income).toBe(base.income);
    expect(got.downPct).toBe(base.downPct);
    expect(Object.keys(got).sort()).toEqual(Object.keys(base).sort());
  });
});
