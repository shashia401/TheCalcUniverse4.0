import { describe, it, expect } from 'vitest';
import {
  evaluateRefinance,
  inputsFromQuery,
  queryFromInputs,
  REFINANCE_DEFAULTS,
  validateRefinance,
  type RefinanceInputs,
} from '../../../src/lib/refinanceDecision';
import { refinanceEngine } from '../../../src/components/decisions/refinanceEngine';

// Oracle: Python Decimal (60 digits), independent of the code under test.
//   payment = B r / (1 - (1+r)^-n), r = APR/1200 and n whole months (round-half-up of years x 12)
//   balances and interest are rolled forward month by month (not the closed form the code uses)
//   break-even = ceil(closing / (current payment - new payment)) when the saving exceeds half a cent
//   net cost to keep    = payments over the stay + balance still owed at the end
//   net cost to refi    = closing + payments over the stay + balance still owed at the end - cash out
//   lifetime interest   = payment x months - amount borrowed
// Cross-checks with the refinance calculator's audited cases: $1,847 -> $1,499, interest saved $14,648 (7.5%/25y -> 6%/30y),
// $88,391 (6.5%/20y -> 5.75%/15y) and the +$82,945 reset-the-term example.
const base = REFINANCE_DEFAULTS; // $250k, 7.5%, 25 years left -> 6%, 25 years, $6,000 costs, no cash out, 7-year stay
const cents = (actual: number, expected: number) => expect(Math.abs(actual - expected)).toBeLessThanOrEqual(0.0051);
const make = (o: Partial<RefinanceInputs>): RefinanceInputs => ({ ...base, ...o });

describe('refinance decision: payments, break-even, horizon figures', () => {
  it('$250k 7.5% 25y -> 6% 25y, $6,000, 7-year stay: every figure matches the oracle', () => {
    const d = evaluateRefinance(base);
    expect([d.monthsLeft, d.newMonths, d.stayMonths]).toEqual([300, 300, 84]);
    cents(d.currentPayment, 1847.48);
    cents(d.newPayment, 1610.75);
    cents(d.monthlySaving, 236.72);
    expect(d.breakEvenMonth).toBe(26);
    cents(d.currentInterestStay, 123831.49);
    cents(d.newInterestStay, 97758.26);
    cents(d.currentBalanceEnd, 218643.34);
    cents(d.newBalanceEnd, 212454.97);
    cents(d.netCostStay, 373831.49);
    cents(d.netCostRefi, 353758.26);
    cents(d.netAdvantage, 20073.23);
    cents(d.currentLifetimeInterest, 304243.38);
    cents(d.newLifetimeInterest, 233226.05);
    cents(d.lifetimeDiff, -71017.33);
    expect(d.verdict).toBe('comfortable');
  });

  it('matches the refinance calculator: 7.5%/25y -> 6%/30y saves $349 a month, break-even 18 months, $14,648 less lifetime interest', () => {
    const d = evaluateRefinance(make({ newYears: 30, stay: 5 }));
    cents(d.currentPayment, 1847.48);
    cents(d.newPayment, 1498.88);
    cents(d.monthlySaving, 348.6);
    expect(d.breakEvenMonth).toBe(18);
    cents(d.currentBalanceEnd, 229331.37);
    cents(d.newBalanceEnd, 232635.89); // a longer loan leaves more owed after 5 years
    cents(d.netAdvantage, 11611.58);
    cents(d.lifetimeDiff, -14647.91);
    expect(d.verdict).toBe('comfortable');
  });

  it('resetting the term: $200k 7% 20y left -> 6.5% over 30y, no costs, 2-year stay: payment falls $286, lifetime interest rises $82,945', () => {
    const d = evaluateRefinance(make({ balance: 200000, currentRate: 7, yearsLeft: 20, newRate: 6.5, newYears: 30, closingCosts: 0, stay: 2 }));
    cents(d.currentPayment, 1550.6);
    cents(d.newPayment, 1264.14);
    cents(d.monthlySaving, 286.46);
    expect(d.breakEvenMonth).toBe(0);
    cents(d.currentBalanceEnd, 190140.25);
    cents(d.newBalanceEnd, 195379.39);
    cents(d.netAdvantage, 1635.95);
    cents(d.currentLifetimeInterest, 172143.49);
    cents(d.newLifetimeInterest, 255088.98);
    cents(d.lifetimeDiff, 82945.49);
    // cheaper over two years, dearer to the end: tight, and the reasons say so plainly
    expect(d.verdict).toBe('tight');
    expect(d.reasons.join(' ')).toMatch(/\$82,945 more interest/);
  });

  it('the same reset over a 10-year stay (with $3,000 costs) costs more than staying put: not worth it', () => {
    const d = evaluateRefinance(make({ balance: 200000, currentRate: 7, yearsLeft: 20, newRate: 6.5, newYears: 30, closingCosts: 3000, stay: 10 }));
    expect(d.breakEvenMonth).toBe(11);
    cents(d.currentInterestStay, 119619.09);
    cents(d.newInterestStay, 121248.58);
    cents(d.currentBalanceEnd, 133547.34);
    cents(d.newBalanceEnd, 169552.25);
    cents(d.netCostStay, 319619.09);
    cents(d.netCostRefi, 324248.58);
    cents(d.netAdvantage, -4629.49);
    expect(d.verdict).toBe('over');
  });

  it('fractional years left and stay: 12.5 years -> 150 months, 4.5 years -> 54 months', () => {
    const d = evaluateRefinance(make({ balance: 180000, currentRate: 6.75, yearsLeft: 12.5, newRate: 5.9, newYears: 12.5, closingCosts: 3500, stay: 4.5 }));
    expect([d.monthsLeft, d.newMonths, d.stayMonths]).toEqual([150, 150, 54]);
    cents(d.currentPayment, 1779.79);
    cents(d.newPayment, 1699.22);
    cents(d.monthlySaving, 80.57);
    expect(d.breakEvenMonth).toBe(44);
    cents(d.currentBalanceEnd, 131742.22);
    cents(d.newBalanceEnd, 129782.99);
    cents(d.netAdvantage, 2809.92);
    cents(d.lifetimeDiff, -12085.25);
  });

  it('a stay longer than both loans: balances are zero and only payments made count', () => {
    const d = evaluateRefinance(make({ balance: 200000, currentRate: 7, yearsLeft: 20, newRate: 6, newYears: 15, closingCosts: 3000, stay: 30 }));
    expect(d.currentBalanceEnd).toBe(0);
    expect(d.newBalanceEnd).toBe(0);
    cents(d.currentInterestStay, 172143.49);
    cents(d.newInterestStay, 103788.46);
    cents(d.netAdvantage, 65355.03);
  });

  it('zero-rate loans amortise in a straight line', () => {
    const d = evaluateRefinance(make({ balance: 120000, currentRate: 0, yearsLeft: 10, newRate: 0, newYears: 5, closingCosts: 1000, stay: 3 }));
    cents(d.currentPayment, 1000);
    cents(d.newPayment, 2000);
    cents(d.currentBalanceEnd, 84000);
    cents(d.newBalanceEnd, 48000);
    cents(d.netCostStay, 120000);
    cents(d.netCostRefi, 121000);
    cents(d.netAdvantage, -1000);
    cents(d.lifetimeDiff, 0);
    expect(d.verdict).toBe('over');
  });
});

describe('refinance decision: verdict paths', () => {
  it('same rate, same term: no saving, no break-even, closing costs are pure loss -> over', () => {
    const d = evaluateRefinance(make({ balance: 200000, currentRate: 6, yearsLeft: 25, newRate: 6, newYears: 25, closingCosts: 3000 }));
    expect(d.breakEvenMonth).toBeNull();
    cents(d.monthlySaving, 0);
    cents(d.netAdvantage, -3000);
    expect(d.verdict).toBe('over');
    expect(d.reasons.join(' ')).toMatch(/does not fall/);
  });

  it('a tiny rate cut with big costs: break-even far beyond the stay -> over', () => {
    const d = evaluateRefinance(make({ balance: 200000, currentRate: 6.5, yearsLeft: 25, newRate: 6.4, newYears: 25, closingCosts: 6000, stay: 3 }));
    cents(d.monthlySaving, 12.47);
    expect(d.breakEvenMonth).toBe(482);
    cents(d.netAdvantage, -5400.86);
    expect(d.verdict).toBe('over');
  });

  it('break-even at 82% of the stay (44 of 54 months) but cheaper and less interest -> tight', () => {
    const d = evaluateRefinance(make({ balance: 180000, currentRate: 6.75, yearsLeft: 12.5, newRate: 5.9, newYears: 12.5, closingCosts: 3500, stay: 4.5 }));
    expect(d.breakEvenMonth! / d.stayMonths).toBeGreaterThan(0.75);
    expect(d.breakEvenMonth!).toBeLessThanOrEqual(d.stayMonths);
    expect(d.lifetimeDiff).toBeLessThan(0);
    expect(d.verdict).toBe('tight');
  });

  it('payment saving alone does not repay the costs inside the stay, but faster paydown still leaves it ahead -> tight, and says why', () => {
    const d = evaluateRefinance(make({ balance: 200000, currentRate: 7, yearsLeft: 20, newRate: 6.5, newYears: 20, closingCosts: 1500, stay: 2 }));
    cents(d.monthlySaving, 59.45);
    expect(d.breakEvenMonth).toBe(26);
    cents(d.netAdvantage, 489.2);
    cents(d.lifetimeDiff, -14268.38);
    expect(d.verdict).toBe('tight');
    expect(d.reasons.join(' ')).toMatch(/paying principal down faster/);
  });

  it('a shorter term raises the payment yet saves $88,391 of interest: judged on net cost, not "no saving"', () => {
    const d = evaluateRefinance(make({ balance: 300000, currentRate: 6.5, yearsLeft: 20, newRate: 5.75, newYears: 15, closingCosts: 5500, stay: 10 }));
    cents(d.currentPayment, 2236.72);
    cents(d.newPayment, 2491.23);
    cents(d.monthlySaving, -254.51);
    expect(d.breakEvenMonth).toBeNull();
    cents(d.currentInterestStay, 165390.85);
    cents(d.newInterestStay, 128585.99);
    cents(d.currentBalanceEnd, 196984.52);
    cents(d.newBalanceEnd, 129638.36);
    cents(d.netAdvantage, 31304.86);
    cents(d.lifetimeDiff, -88391.21);
    expect(d.verdict).toBe('comfortable');
  });

  it('cash out: $50k added to the new loan, payment rises, net cost and interest decide', () => {
    const d = evaluateRefinance(make({ cashOut: 50000 }));
    expect(d.newBalance).toBe(300000);
    cents(d.newPayment, 1932.9);
    cents(d.monthlySaving, -85.43);
    expect(d.breakEvenMonth).toBeNull();
    cents(d.newInterestStay, 117309.91);
    cents(d.newBalanceEnd, 254945.96);
    cents(d.netCostRefi, 373309.91); // 6,000 + payments - 50,000 cash + balance owed
    cents(d.netAdvantage, 521.58);
    cents(d.newLifetimeInterest, 279871.26);
    cents(d.lifetimeDiff, -24372.12);
    expect(d.reasons.join(' ')).toMatch(/Cash-out of \$50,000/);
  });
});

describe('refinance decision: validation and the shareable link', () => {
  it('accepts the defaults and rejects nonsense instead of producing numbers', () => {
    expect(validateRefinance(base)).toBe(true);
    expect(validateRefinance(make({ balance: 0 }))).toBe(false);
    expect(validateRefinance(make({ balance: NaN }))).toBe(false);
    expect(validateRefinance(make({ currentRate: -1 }))).toBe(false);
    expect(validateRefinance(make({ newRate: 31 }))).toBe(false);
    expect(validateRefinance(make({ yearsLeft: 0 }))).toBe(false);
    expect(validateRefinance(make({ newYears: 41 }))).toBe(false);
    expect(validateRefinance(make({ closingCosts: -1 }))).toBe(false);
    expect(validateRefinance(make({ cashOut: -5 }))).toBe(false);
    expect(validateRefinance(make({ stay: 0 }))).toBe(false);
    expect(validateRefinance(make({ stay: Infinity }))).toBe(false);
    expect(validateRefinance(make({ cashOut: 0, closingCosts: 0, yearsLeft: 0.5 }))).toBe(true);
  });

  it('every input survives a trip through the query string, with short keys of 12 characters or fewer', () => {
    const custom: RefinanceInputs = { balance: 312500.5, currentRate: 6.875, yearsLeft: 22.5, newRate: 5.625, newYears: 20, closingCosts: 4850, cashOut: 15000, stay: 6.5 };
    const q = queryFromInputs(custom);
    expect(inputsFromQuery(q)).toEqual(custom);
    expect(inputsFromQuery('?' + q)).toEqual(custom);
    for (const k of new URLSearchParams(q).keys()) expect(k.length).toBeLessThanOrEqual(12);
  });

  it('ignores unknown keys, junk values and over-long values', () => {
    const got = inputsFromQuery('?bal=abc&rate=7.25&evil=<script>&left=' + '9'.repeat(40) + '&cost=&nrate=5,5&nterm=1e2');
    expect(got.balance).toBe(base.balance);
    expect(got.currentRate).toBe(7.25);
    expect(got.yearsLeft).toBe(base.yearsLeft);
    expect(got.closingCosts).toBe(base.closingCosts);
    expect(got.newRate).toBe(55); // commas are thousands separators, as in the other tools
    expect(Object.keys(got).sort()).toEqual(Object.keys(base).sort());
    expect(inputsFromQuery('')).toEqual(base);
  });
});

describe('refinance engine config', () => {
  it('has four steps whose links seed the refinance calculator in months', () => {
    const d = evaluateRefinance(base);
    const steps = refinanceEngine.steps(d, base);
    expect(steps).toHaveLength(4);
    const url = new URL(steps[0].href, 'https://example.test');
    expect(url.pathname).toBe('/finance/refinance-calculator/');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      currentBalance: '250000', currentRate: '7.5', currentTerm: '300', newRate: '6', newTerm: '300', closingCosts: '6000', plannedStay: '84',
    });
  });

  it('verdict titles read naturally and the form ids use the rf prefix', () => {
    expect(refinanceEngine.idPrefix).toBe('rf');
    expect(refinanceEngine.storageKey).toBe('refinanceDecisionScenarios');
    expect(refinanceEngine.verdict(evaluateRefinance(base), base).title).toBe('Worth refinancing');
    const over = make({ newRate: 7.5, newYears: 25 });
    expect(refinanceEngine.verdict(evaluateRefinance(over), over).title).toBe('Not worth it at these numbers');
    const fields = refinanceEngine.groups.flatMap((g) => g.fields.map((f) => f.key)).sort();
    expect(fields).toEqual(Object.keys(base).sort());
  });
});
