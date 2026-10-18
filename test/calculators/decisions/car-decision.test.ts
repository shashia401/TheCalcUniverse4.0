import { describe, it, expect } from 'vitest';
import { CAR_DEFAULTS, evaluateCar, inputsFromQuery, queryFromInputs, validateCar, type CarInputs } from '../../../src/lib/carDecision';
import { carEngine } from '../../../src/components/decisions/carEngine';
import { autoLoan } from '../../../src/calculators/automotive/auto-loan/autoLoanMath';
import autoLoanConfig from '../../../src/calculators/automotive/auto-loan/index';
import dtiConfig from '../../../src/calculators/realestate/dti-ratio/index';
import depreciationConfig from '../../../src/calculators/automotive/depreciation/index';

// Oracle: Python Decimal (50 digits) from the published formulas, independent of the code under test.
//   cash down = min(price*down%, max(0, price-trade));  tax/fees = price*tax%;  financed = max(0, price-trade-cash down)
//   payment   = financed*r / (1-(1+r)^-n), r = APR/12 (financed/n at 0%);  interest = payment*n - financed
//   share     = (payment+insurance+running) / (income/12);  DTI = (debts+payment) / (income/12)
//   cash need = cash down + tax/fees;  total = need + payment*n + (insurance+running)*n
//   verdict   = over if cash short, share > 15 or DTI > 43; else tight if down+trade < 20%, term > 48 (with a loan) or share > 10
const base = CAR_DEFAULTS; // $75k, $1,400 debts, $15k cash, $32k car, 8% tax, no trade, 20% down, 7%, 60 months, $150 + $200 a month
const comfy: CarInputs = { ...base, income: 120000, debts: 1500, savings: 30000, price: 25000, tradeIn: 2000, rate: 6, months: 48, insurance: 130, running: 170 };
// exact-boundary car at 0% APR: $10,000 a month income, payment 600, insurance + running 400 -> exactly 10.000%
const edge: CarInputs = { income: 120000, debts: 1000, savings: 100000, price: 36000, salesTaxPct: 8, tradeIn: 0, downPct: 20, rate: 0, months: 48, insurance: 200, running: 200 };

describe('car decision engine: payment, 20/4/10, DTI, cash', () => {
  it('default scenario matches the independent calculation', () => {
    const d = evaluateCar(base);
    expect(d.cashDown).toBeCloseTo(6400, 6);
    expect(d.taxFees).toBeCloseTo(2560, 6);
    expect(d.financed).toBeCloseTo(25600, 6);
    expect(d.payment).toBeCloseTo(506.9107, 3);
    expect(d.totalInterest).toBeCloseTo(4814.641, 2);
    expect(d.downSharePct).toBeCloseTo(20, 9);
    expect(d.monthlyCost).toBeCloseTo(856.9107, 3);
    expect(d.costSharePct).toBeCloseTo(13.7106, 3);
    expect(d.paymentRoom).toBeCloseTo(275, 6);
    expect(d.backEnd).toBeCloseTo(30.5106, 3);
    expect(d.cashNeeded).toBeCloseTo(8960, 6);
    expect(d.cashLeft).toBeCloseTo(6040, 6);
    expect(d.totalCost).toBeCloseTo(60374.641, 2);
  });

  it('trade-in counts toward the 20% and reduces the loan', () => {
    const d = evaluateCar(comfy);
    expect(d.cashDown).toBeCloseTo(5000, 6);
    expect(d.financed).toBeCloseTo(18000, 6);
    expect(d.payment).toBeCloseTo(422.7305, 3);
    expect(d.totalInterest).toBeCloseTo(2291.0651, 2);
    expect(d.downSharePct).toBeCloseTo(28, 9);
    expect(d.costSharePct).toBeCloseTo(7.2273, 3);
    expect(d.backEnd).toBeCloseTo(19.2273, 3);
    expect(d.cashNeeded).toBeCloseTo(7000, 6);
    expect(d.cashLeft).toBeCloseTo(23000, 6);
    expect(d.totalCost).toBeCloseTo(41691.0651, 2);
  });

  it('0% APR is simple division', () => {
    const d = evaluateCar({ ...base, rate: 0, months: 48, price: 24000, income: 100000, savings: 20000, debts: 1400 });
    expect(d.financed).toBeCloseTo(19200, 6);
    expect(d.payment).toBeCloseTo(400, 9);
    expect(d.totalInterest).toBeCloseTo(0, 9);
    expect(d.costSharePct).toBeCloseTo(9, 9);
    expect(d.backEnd).toBeCloseTo(21.6, 9);
    expect(d.verdict).toBe('comfortable');
  });

  it('cash down is capped so cash plus trade-in never exceed the price; no loan means no payment', () => {
    const d = evaluateCar({ ...base, price: 10000, tradeIn: 9000, downPct: 50, savings: 5000 });
    expect(d.cashDown).toBeCloseTo(1000, 6); // 50% would be $5,000 but only $1,000 is left to pay
    expect(d.financed).toBe(0);
    expect(d.payment).toBe(0);
    expect(d.totalInterest).toBe(0);
    expect(d.cashNeeded).toBeCloseTo(1800, 6); // $1,000 down + $800 tax and fees
    expect(d.cashLeft).toBeCloseTo(3200, 6);
    expect(d.costSharePct).toBeCloseTo(5.6, 9);
    expect(d.backEnd).toBeCloseTo(22.4, 9);
    expect(d.totalCost).toBeCloseTo(22800, 6);
    expect(d.failedTerm).toBe(false); // 60 months on a loan you do not take is not a failure
    expect(d.verdict).toBe('comfortable');
  });
});

describe('car decision: verdict paths and reasons', () => {
  it('comfortable: every test passes and the single reason says so', () => {
    const d = evaluateCar(comfy);
    expect(d.verdict).toBe('comfortable');
    expect(d.reasons).toHaveLength(1);
  });

  it('tight on term and cost only (default): reasons name both failures with the visitor numbers', () => {
    const d = evaluateCar(base);
    expect([d.failedDown, d.failedTerm, d.failedCost, d.overCost, d.overDti, d.short]).toEqual([false, true, true, false, false, false]);
    expect(d.verdict).toBe('tight');
    expect(d.reasons).toEqual([
      'All-in transportation cost is 13.7% of gross income ($857 a month), above the 10% guideline.',
      'The 60-month loan is longer than the 48-month (4-year) guideline.',
    ]);
  });

  it('tight on the 4-year test alone', () => {
    const d = evaluateCar({ ...comfy, months: 60 });
    expect(d.payment).toBeCloseTo(347.9904, 3);
    expect([d.failedDown, d.failedTerm, d.failedCost]).toEqual([false, true, false]);
    expect(d.verdict).toBe('tight');
    expect(d.reasons).toEqual(['The 60-month loan is longer than the 48-month (4-year) guideline.']);
  });

  it('tight on the 20% down test alone', () => {
    const d = evaluateCar({ ...comfy, tradeIn: 0, downPct: 10 });
    expect(d.payment).toBeCloseTo(528.4132, 3);
    expect(d.downSharePct).toBeCloseTo(10, 9);
    expect(d.cashNeeded).toBeCloseTo(4500, 6);
    expect([d.failedDown, d.failedTerm, d.failedCost]).toEqual([true, false, false]);
    expect(d.verdict).toBe('tight');
    expect(d.reasons).toEqual(['Down payment plus trade-in is 10.0% of the price, below the 20% guideline.']);
  });

  it('tight on the 10% cost test alone (14.3% is under the 15% ceiling)', () => {
    const d = evaluateCar({ ...comfy, income: 60000, debts: 500, price: 22000, tradeIn: 0 });
    expect(d.payment).toBeCloseTo(413.3365, 3);
    expect(d.costSharePct).toBeCloseTo(14.2667, 3);
    expect(d.paymentRoom).toBeCloseTo(200, 6);
    expect([d.failedDown, d.failedTerm, d.failedCost, d.overCost]).toEqual([false, false, true, false]);
    expect(d.verdict).toBe('tight');
    expect(d.reasons).toEqual(['All-in transportation cost is 14.3% of gross income ($713 a month), above the 10% guideline.']);
  });

  it('over on cost, term and cash at once: three reasons, each with its numbers', () => {
    const d = evaluateCar({ ...base, price: 60000 });
    expect(d.payment).toBeCloseTo(950.4575, 3);
    expect(d.costSharePct).toBeCloseTo(20.8073, 3);
    expect(d.backEnd).toBeCloseTo(37.6073, 3);
    expect(d.cashNeeded).toBeCloseTo(16800, 6);
    expect(d.cashLeft).toBeCloseTo(-1800, 6);
    expect(d.verdict).toBe('over');
    expect(d.reasons).toEqual([
      'Cash needed at signing is $16,800 (down payment plus sales tax and fees); you are $1,800 short.',
      'All-in transportation cost is 20.8% of gross income ($1,300 a month), above the 15% ceiling this tool treats as over budget.',
      'The 60-month loan is longer than the 48-month (4-year) guideline.',
    ]);
  });

  it('over on debt-to-income alone (cost 11.7% is only a guideline miss)', () => {
    const d = evaluateCar({ ...base, debts: 2400, price: 20000, months: 48, savings: 30000 });
    expect(d.payment).toBeCloseTo(383.1399, 3);
    expect(d.costSharePct).toBeCloseTo(11.7302, 3);
    expect(d.backEnd).toBeCloseTo(44.5302, 3);
    expect([d.overCost, d.overDti, d.short]).toEqual([false, true, false]);
    expect(d.verdict).toBe('over');
    expect(d.reasons).toEqual([
      'All-in transportation cost is 11.7% of gross income ($733 a month), above the 10% guideline.',
      'Debt-to-income with the car payment is 44.5%, above the 43% most lenders treat as the ceiling.',
    ]);
  });

  it('over on cash alone, even when every 20/4/10 test passes', () => {
    const d = evaluateCar({ ...comfy, savings: 5000 });
    expect(d.cashLeft).toBeCloseTo(-2000, 6);
    expect([d.failedDown, d.failedTerm, d.failedCost, d.overDti]).toEqual([false, false, false, false]);
    expect(d.verdict).toBe('over');
    expect(d.reasons).toEqual(['Cash needed at signing is $7,000 (down payment plus sales tax and fees); you are $2,000 short.']);
  });

  it('over on the 15% ceiling with only the 48-month default term (15.4%)', () => {
    const d = evaluateCar({ ...base, months: 48 });
    expect(d.payment).toBeCloseTo(613.0239, 3);
    expect(d.costSharePct).toBeCloseTo(15.4084, 3);
    expect(d.verdict).toBe('over');
  });

  it('boundaries are inclusive: exactly 10% cost, 20% down, 48 months, 43% DTI and zero cash left all pass', () => {
    const d = evaluateCar(edge);
    expect(d.payment).toBeCloseTo(600, 9);
    expect(d.costSharePct).toBeCloseTo(10, 9);
    expect(d.verdict).toBe('comfortable');
    const dti = evaluateCar({ ...edge, debts: 3700 });
    expect(dti.backEnd).toBeCloseTo(43, 9);
    expect(dti.verdict).toBe('comfortable');
    const exactCash = evaluateCar({ ...edge, savings: 10080 });
    expect(exactCash.cashLeft).toBeCloseTo(0, 9);
    expect(exactCash.verdict).toBe('comfortable');
  });

  it('one step past each boundary flips the verdict', () => {
    expect(evaluateCar({ ...edge, debts: 3701 }).backEnd).toBeCloseTo(43.01, 9);
    expect(evaluateCar({ ...edge, debts: 3701 }).verdict).toBe('over');
    expect(evaluateCar({ ...edge, savings: 10079 }).verdict).toBe('over');
    expect(evaluateCar({ ...edge, months: 49 }).verdict).toBe('tight');
    expect(evaluateCar({ ...edge, downPct: 19 }).verdict).toBe('tight');
    // exactly 15.000% (payment 1,100 + 400) is a guideline miss, not yet over
    const fifteen = evaluateCar({ ...edge, price: 66000 });
    expect(fifteen.costSharePct).toBeCloseTo(15, 9);
    expect(fifteen.verdict).toBe('tight');
    expect(evaluateCar({ ...edge, price: 66100 }).verdict).toBe('over');
  });
});

describe('car decision: validation and the shareable link', () => {
  it('rejects nonsense instead of producing numbers', () => {
    expect(validateCar(base)).toBe(true);
    expect(validateCar({ ...base, price: 0 })).toBe(false);
    expect(validateCar({ ...base, income: 0 })).toBe(false);
    expect(validateCar({ ...base, downPct: 101 })).toBe(false);
    expect(validateCar({ ...base, downPct: -1 })).toBe(false);
    expect(validateCar({ ...base, rate: NaN })).toBe(false);
    expect(validateCar({ ...base, rate: 31 })).toBe(false);
    expect(validateCar({ ...base, months: 11 })).toBe(false);
    expect(validateCar({ ...base, months: 97 })).toBe(false);
    expect(validateCar({ ...base, months: 60.5 })).toBe(false);
    expect(validateCar({ ...base, savings: -1 })).toBe(false);
    expect(validateCar({ ...base, salesTaxPct: 26 })).toBe(false);
    expect(validateCar({ ...base, running: Infinity })).toBe(false);
    expect(validateCar({ ...base, months: 12 })).toBe(true);
    expect(validateCar({ ...base, months: 96, downPct: 100, tradeIn: 0, rate: 0 })).toBe(true);
  });

  it('valid flag follows validation', () => {
    expect(evaluateCar(base).valid).toBe(true);
    expect(evaluateCar({ ...base, price: 0 }).valid).toBe(false);
  });

  it('every input survives a trip through the query string, with short keys', () => {
    const custom: CarInputs = { income: 88500.5, debts: 910, savings: 21000, price: 41250, salesTaxPct: 7.25, tradeIn: 6500, downPct: 12.5, rate: 5.99, months: 72, insurance: 165, running: 240 };
    const qs = queryFromInputs(custom);
    expect(inputsFromQuery(qs)).toEqual(custom);
    expect(Object.fromEntries(new URLSearchParams(qs))).toEqual({
      income: '88500.5', debts: '910', savings: '21000', price: '41250', tax: '7.25', trade: '6500', down: '12.5', rate: '5.99', term: '72', ins: '165', run: '240',
    });
    expect(inputsFromQuery('?' + qs)).toEqual(custom);
  });

  it('ignores unknown keys, junk values and over-long values', () => {
    const got = inputsFromQuery('?price=abc&rate=7.25&evil=<script>&income=' + '9'.repeat(40) + '&down=&term=Infinity&ins=1e400&trade=%20&run=1,200');
    expect(got.price).toBe(base.price);
    expect(got.rate).toBe(7.25);
    expect(got.income).toBe(base.income);
    expect(got.downPct).toBe(base.downPct);
    expect(got.months).toBe(base.months);
    expect(got.insurance).toBe(base.insurance);
    expect(got.tradeIn).toBe(base.tradeIn);
    expect(got.running).toBe(1200);
    expect(Object.keys(got).sort()).toEqual(Object.keys(base).sort());
  });

  it('an empty query gives the defaults', () => {
    expect(inputsFromQuery('')).toEqual(base);
  });
});

describe('car decision engine config: deep links seed the real calculators', () => {
  const linkParams = (href: string) => Object.fromEntries(new URL(href, 'https://x.test').searchParams);
  const inputIds = (cfg: { inputs: { id: string }[] }) => new Set(cfg.inputs.map((i) => i.id));

  it('the id prefix and storage key are the car tool\'s own', () => {
    expect(carEngine.idPrefix).toBe('cd');
    expect(carEngine.storageKey).toBe('carDecisionScenarios');
  });

  it('every carried parameter is a real input id of the target calculator', () => {
    const steps = carEngine.steps(evaluateCar(base), base);
    expect(steps).toHaveLength(4);
    const [loan, rule, dti, cash] = steps.map((s) => new URL(s.href, 'https://x.test'));
    expect(loan.pathname).toBe('/automotive/auto-loan-calculator/');
    expect(rule.pathname).toBe('/automotive/auto-loan-calculator/');
    expect(dti.pathname).toBe('/finance/dti-ratio-calculator/');
    expect(cash.pathname).toBe('/automotive/vehicle-depreciation-calculator/');
    for (const [url, cfg] of [[loan, autoLoanConfig], [rule, autoLoanConfig], [dti, dtiConfig], [cash, depreciationConfig]] as const) {
      const ids = inputIds(cfg);
      for (const k of url.searchParams.keys()) expect(ids.has(k), `${url.pathname} ${k}`).toBe(true);
    }
  });

  it('the auto-loan link reproduces this tool\'s amount financed and payment in the real auto-loan math', () => {
    for (const inputs of [base, comfy, { ...base, months: 48 }]) {
      const d = evaluateCar(inputs);
      const m = autoLoan(linkParams(carEngine.steps(d, inputs)[0].href));
      expect(m).not.toBeNull();
      expect(m!.loanAmount).toBeCloseTo(d.financed, 0);
      expect(m!.monthlyPayment).toBeCloseTo(d.payment, 0);
    }
  });

  it('the 48-month link changes only the term', () => {
    const steps = carEngine.steps(evaluateCar(base), base);
    expect(linkParams(steps[1].href).loanTerm).toBe('48');
    expect({ ...linkParams(steps[1].href), loanTerm: '60' }).toEqual(linkParams(steps[0].href));
  });

  it('verdict card and comparison rows render without throwing for every verdict', () => {
    for (const inputs of [base, comfy, { ...base, price: 60000 }]) {
      const d = evaluateCar(inputs);
      const v = carEngine.verdict(d, inputs);
      expect(v.level).toBe(d.verdict);
      expect(v.lines.length).toBeGreaterThan(0);
      for (const row of carEngine.compareRows) expect(row.value(d, inputs)).not.toMatch(/NaN|undefined/);
    }
  });
});
