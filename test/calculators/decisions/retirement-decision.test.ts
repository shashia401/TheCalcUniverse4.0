import { describe, it, expect } from 'vitest';
import {
  RETIREMENT_DEFAULTS,
  evaluateRetirement,
  inputsFromQuery,
  queryFromInputs,
  validateRetirement,
  type RetirementInputs,
} from '../../../src/lib/retirementDecision';
import { retirementEngine } from '../../../src/components/decisions/retirementEngine';
import retirementConfig from '../../../src/calculators/finance/retirement/index';
import k401Config from '../../../src/calculators/finance/401k/index';
import socialSecurityConfig from '../../../src/calculators/finance/social-security/index';
import annuityConfig from '../../../src/calculators/finance/annuity-payout/index';

// Oracle: Python Decimal (50 digits), month-by-month simulation, independent of the code under test.
//   real return  g = (1 + nominal) / (1 + inflation) - 1;  monthly m = (1 + g)^(1/12) - 1
//   balance      b = b*(1+m) + monthly, repeated for each month to retirement (deposit at the END of the month)
//   nest egg     work BACKWARDS from a zero balance at the plan age: b = b/(1+m) + w, w = (spend - benefit)/12
//                (a withdrawal at the START of each month, then growth)
//   extra saving = shortfall / (balance after a $1-a-month simulation from a zero start)
//   runs out     = simulate FORWARD from the projected balance; the first month with less than w left
//   sustainable  = benefit + 12 x projected / (nest egg for a $1-a-month withdrawal)
//   verdict      = funded = projected / nest egg: >= 100% comfortable, >= 75% tight, else over
const base = RETIREMENT_DEFAULTS; // age 35 -> 67, plan to 95, $60k saved, $800/mo, 6.5% / 4.5%, 2.5% inflation, $70k spend, $24k benefit
const mk = (o: Partial<RetirementInputs>): RetirementInputs => ({ ...base, ...o });
// zero real return in both phases (return = inflation) makes every figure an exact integer
const zero = mk({ age: 40, retireAge: 65, lifeAge: 90, savings: 100000, monthly: 3000, returnPct: 3, retireReturnPct: 3, inflationPct: 3, spend: 50000, benefit: 10000 });

describe('retirement decision engine: balance, nest egg, gap, fix, run-out', () => {
  it('default scenario matches the independent simulation', () => {
    const d = evaluateRetirement(base);
    expect(d.yearsToRetire).toBe(32);
    expect(d.yearsInRetirement).toBe(28);
    expect(d.realSaveReturnPct).toBeCloseTo(3.9024390244, 8);
    expect(d.realRetireReturnPct).toBeCloseTo(1.9512195122, 8);
    expect(d.projected).toBeCloseTo(806211.7013787994, 2);
    expect(d.contributed).toBeCloseTo(367200, 6);
    expect(d.netNeed).toBe(46000);
    expect(d.needed).toBeCloseTo(995534.8850462753, 2);
    expect(d.ruleOfThumb).toBeCloseTo(1150000, 6);
    expect(d.gap).toBeCloseTo(-189323.1836674759, 2);
    expect(d.shortfall).toBeCloseTo(189323.1836674759, 2);
    expect(d.surplus).toBe(0);
    expect(d.fundedPct).toBeCloseTo(80.9827675041, 7);
    expect(d.extraMonthly).toBeCloseTo(251.610821773, 4);
    expect(d.runOutAge).toBeCloseTo(88.3333333333, 9); // 256 full monthly withdrawals after 67
    expect(d.sustainableSpend).toBeCloseTo(61252.0730518659, 2);
    expect(d.verdict).toBe('tight');
  });

  it('saving more: on track, no extra saving, money lasts, surplus reported', () => {
    const d = evaluateRetirement(mk({ monthly: 1500 }));
    expect(d.projected).toBeCloseTo(1332922.8644097388, 2);
    expect(d.needed).toBeCloseTo(995534.8850462753, 2);
    expect(d.fundedPct).toBeCloseTo(133.8901212234, 7);
    expect(d.surplus).toBeCloseTo(337387.9793634635, 2);
    expect(d.shortfall).toBe(0);
    expect(d.extraMonthly).toBe(0);
    expect(d.runOutAge).toBeNull();
    expect(d.sustainableSpend).toBeCloseTo(85589.4557627661, 2);
    expect(d.verdict).toBe('comfortable');
  });

  it('late and light saving: not on track, runs out at 64.75', () => {
    const d = evaluateRetirement(mk({ age: 45, retireAge: 62, savings: 20000, monthly: 300 }));
    expect(d.projected).toBeCloseTo(124443.6379530394, 2);
    expect(d.needed).toBeCloseTo(1123260.3319857142, 2); // 33 years to 95
    expect(d.fundedPct).toBeCloseTo(11.0787886307, 7);
    expect(d.extraMonthly).toBeCloseTo(3480.1058328253, 3);
    expect(d.runOutAge).toBeCloseTo(64.75, 9);
    expect(d.sustainableSpend).toBeCloseTo(29096.2427701156, 2);
    expect(d.verdict).toBe('over');
  });

  it('no benefit: the whole spending comes from savings', () => {
    const d = evaluateRetirement(mk({ age: 30, retireAge: 65, savings: 50000, monthly: 500, returnPct: 7, retireReturnPct: 5, inflationPct: 3, spend: 40000, benefit: 0 }));
    expect(d.realSaveReturnPct).toBeCloseTo(3.8834951456, 8);
    expect(d.realRetireReturnPct).toBeCloseTo(1.9417475728, 8);
    expect(d.projected).toBeCloseTo(629061.6297129733, 2);
    expect(d.needed).toBeCloseTo(912546.0370262731, 2);
    expect(d.ruleOfThumb).toBeCloseTo(1000000, 6);
    expect(d.fundedPct).toBeCloseTo(68.9347829248, 7);
    expect(d.extraMonthly).toBeCloseTo(322.6197000389, 4);
    expect(d.runOutAge).toBeCloseTo(83.6666666667, 9);
    expect(d.sustainableSpend).toBeCloseTo(27573.9131699221, 2);
    expect(d.verdict).toBe('over');
  });

  it('a negative real return (return below inflation) still follows the simulation', () => {
    const d = evaluateRetirement(mk({ age: 30, retireAge: 65, lifeAge: 90, savings: 40000, monthly: 600, returnPct: 2, retireReturnPct: 1, inflationPct: 3, spend: 45000, benefit: 15000 }));
    expect(d.realSaveReturnPct).toBeCloseTo(-0.9708737864, 8);
    expect(d.realRetireReturnPct).toBeCloseTo(-1.9417475728, 8);
    expect(d.projected).toBeCloseTo(241997.2741451307, 2);
    expect(d.needed).toBeCloseTo(967151.16725, 2);
    expect(d.fundedPct).toBeCloseTo(25.0216597301, 7);
    expect(d.extraMonthly).toBeCloseTo(2037.2527003523, 3);
    expect(d.runOutAge).toBeCloseTo(72.4166666667, 9);
    expect(d.sustainableSpend).toBeCloseTo(22506.4979190349, 2);
    expect(d.verdict).toBe('over');
  });

  it('tight with different saving and retirement returns (nonzero rates throughout)', () => {
    const d = evaluateRetirement(mk({ age: 40, retireAge: 67, lifeAge: 92, savings: 100000, monthly: 900, returnPct: 6, retireReturnPct: 4, spend: 60000, benefit: 20000 }));
    expect(d.projected).toBeCloseTo(721611.630256375, 2);
    expect(d.needed).toBeCloseTo(839032.7761765303, 2);
    expect(d.fundedPct).toBeCloseTo(86.0051777172, 7);
    expect(d.extraMonthly).toBeCloseTo(222.9362474243, 4);
    expect(d.runOutAge).toBeCloseTo(87.8333333333, 9);
    expect(d.sustainableSpend).toBeCloseTo(54402.0710868892, 2);
    expect(d.verdict).toBe('tight');
  });

  it('zero real return in retirement only: the nest egg is simply net need x years', () => {
    const d = evaluateRetirement(mk({ age: 50, retireAge: 67, lifeAge: 92, savings: 300000, monthly: 1000, returnPct: 6, retireReturnPct: 2.5, inflationPct: 2.5, spend: 60000, benefit: 20000 }));
    expect(d.realRetireReturnPct).toBe(0);
    expect(d.needed).toBeCloseTo(1000000, 6); // 40,000 x 25 years
    expect(d.projected).toBeCloseTo(805597.1258853609, 2);
    expect(d.fundedPct).toBeCloseTo(80.5597125885, 7);
    expect(d.extraMonthly).toBeCloseTo(707.7069331187, 4);
    expect(d.runOutAge).toBeCloseTo(87.0833333333, 9);
    expect(d.sustainableSpend).toBeCloseTo(52223.8850354144, 2);
  });

  it('a young saver with no head start is far off and runs out in the mid-60s of life', () => {
    const d = evaluateRetirement(mk({ age: 25, retireAge: 65, savings: 0, monthly: 100, returnPct: 7, retireReturnPct: 5, inflationPct: 3, spend: 60000, benefit: 0 }));
    expect(d.projected).toBeCloseTo(112908.3477258165, 2);
    expect(d.needed).toBeCloseTo(1368819.0555394097, 2);
    expect(d.fundedPct).toBeCloseTo(8.2485955517, 7);
    expect(d.extraMonthly).toBeCloseTo(1112.327594115, 3);
    expect(d.runOutAge).toBeCloseTo(66.8333333333, 9);
    expect(d.sustainableSpend).toBeCloseTo(4949.15733101, 2);
    expect(d.verdict).toBe('over');
  });

  it('zero return everywhere is simple arithmetic', () => {
    const d = evaluateRetirement(zero);
    expect(d.realSaveReturnPct).toBe(0);
    expect(d.projected).toBeCloseTo(1000000, 6); // 100,000 + 3,000 x 300
    expect(d.needed).toBeCloseTo(1000000, 6); // 40,000 x 25 years
    expect(d.ruleOfThumb).toBeCloseTo(1000000, 6);
    expect(d.sustainableSpend).toBeCloseTo(50000, 6);
  });

  it('benefit at or above spending: nothing to fund, comfortable, not a divide-by-zero', () => {
    const d = evaluateRetirement(mk({ age: 30, retireAge: 65, savings: 0, monthly: 0, returnPct: 7, retireReturnPct: 5, inflationPct: 3, spend: 20000, benefit: 25000 }));
    expect(d.netNeed).toBe(0);
    expect(d.needed).toBe(0);
    expect(d.ruleOfThumb).toBe(0);
    expect(d.fundedPct).toBe(Infinity);
    expect(d.extraMonthly).toBe(0);
    expect(d.runOutAge).toBeNull();
    expect(d.sustainableSpend).toBeCloseTo(25000, 6);
    expect(d.verdict).toBe('comfortable');
    expect(d.reasons).toEqual(['Your $25,000 a year of Social Security or pension covers the $20,000 a year you plan to spend, so no savings are needed to fund it.']);
  });

  it('the extra monthly saving is exact: adding it lands on 100% funded in a fresh run', () => {
    for (const inputs of [base, mk({ age: 45, retireAge: 62, savings: 20000, monthly: 300 }), mk({ returnPct: 2, retireReturnPct: 1, benefit: 15000, age: 30, retireAge: 65, lifeAge: 90 })]) {
      const d = evaluateRetirement(inputs);
      expect(d.extraMonthly).toBeGreaterThan(0);
      const fixed = evaluateRetirement({ ...inputs, monthly: inputs.monthly + d.extraMonthly });
      expect(fixed.fundedPct).toBeCloseTo(100, 6);
      expect(fixed.verdict).toBe('comfortable');
      expect(fixed.extraMonthly).toBe(0);
    }
  });
});

describe('retirement decision: verdict paths and boundaries', () => {
  it('exactly 100% funded is on track; $1 short is close but short', () => {
    const at = evaluateRetirement(zero);
    expect(at.fundedPct).toBeCloseTo(100, 9);
    expect(at.verdict).toBe('comfortable');
    expect(at.extraMonthly).toBe(0);
    expect(at.runOutAge).toBeNull();
    const below = evaluateRetirement({ ...zero, savings: 99999 });
    expect(below.fundedPct).toBeCloseTo(99.9999, 9);
    expect(below.extraMonthly).toBeCloseTo(0.0033333333, 8);
    expect(below.runOutAge).toBeCloseTo(89.9166666667, 9);
    expect(below.verdict).toBe('tight');
    expect(below.reasons).toHaveLength(3);
  });

  it('exactly 75% funded is close but short; $1 less is not on track', () => {
    const at = evaluateRetirement({ ...zero, savings: 150000, monthly: 2000 });
    expect(at.projected).toBeCloseTo(750000, 6);
    expect(at.fundedPct).toBeCloseTo(75, 9);
    expect(at.verdict).toBe('tight');
    expect(at.extraMonthly).toBeCloseTo(833.3333333333, 8);
    expect(at.runOutAge).toBeCloseTo(83.75, 9); // 225 full withdrawals: the balance is exactly spent at the 18.75th year
    expect(at.sustainableSpend).toBeCloseTo(40000, 6);
    const below = evaluateRetirement({ ...zero, savings: 149999, monthly: 2000 });
    expect(below.fundedPct).toBeCloseTo(74.9999, 9);
    expect(below.verdict).toBe('over');
    expect(below.extraMonthly).toBeCloseTo(833.3366666667, 8);
    expect(below.runOutAge).toBeCloseTo(83.6666666667, 9);
    expect(below.sustainableSpend).toBeCloseTo(39999.96, 6);
    const mid = evaluateRetirement({ ...zero, savings: 149000, monthly: 2000 });
    expect(mid.runOutAge).toBeCloseTo(83.6666666667, 9);
  });

  it('reasons name the visitor numbers: tight (default)', () => {
    expect(evaluateRetirement(base).reasons).toEqual([
      'You are projected to have $806,212 at 67, $189,323 short of the $995,535 this plan needs (81.0% funded).',
      'At $70,000 a year the money would run out around age 88.3, not 95.',
      'Saving about $252 more a month would close the gap, or the same balance would carry about $61,252 a year to 95.',
    ]);
  });

  it('reasons name the visitor numbers: on track', () => {
    expect(evaluateRetirement(mk({ monthly: 1500 })).reasons).toEqual([
      'You are projected to have $1,332,923 at 67, $337,388 more than the $995,535 this plan needs (133.9% funded).',
    ]);
  });

  it('reasons name the visitor numbers: not on track', () => {
    const d = evaluateRetirement(mk({ age: 45, retireAge: 62, savings: 20000, monthly: 300 }));
    expect(d.reasons).toEqual([
      'You are projected to have $124,444 at 62, $998,817 short of the $1,123,260 this plan needs (11.1% funded).',
      'At $70,000 a year the money would run out around age 64.8, not 95.',
      'Saving about $3,480 more a month would close the gap, or the same balance would carry about $29,096 a year to 95.',
    ]);
  });
});

describe('retirement decision: validation and the shareable link', () => {
  it('rejects nonsense instead of producing numbers', () => {
    expect(validateRetirement(base)).toBe(true);
    expect(validateRetirement(mk({ retireAge: 35 }))).toBe(false); // retire age must be above age
    expect(validateRetirement(mk({ retireAge: 34 }))).toBe(false);
    expect(validateRetirement(mk({ lifeAge: 67 }))).toBe(false); // plan-to age must be above retire age
    expect(validateRetirement(mk({ lifeAge: 111 }))).toBe(false);
    expect(validateRetirement(mk({ age: 15 }))).toBe(false);
    expect(validateRetirement(mk({ age: 35.5 }))).toBe(false);
    expect(validateRetirement(mk({ retireAge: 101, lifeAge: 105 }))).toBe(false);
    expect(validateRetirement(mk({ savings: -1 }))).toBe(false);
    expect(validateRetirement(mk({ monthly: -1 }))).toBe(false);
    expect(validateRetirement(mk({ benefit: -1 }))).toBe(false);
    expect(validateRetirement(mk({ spend: 0 }))).toBe(false);
    expect(validateRetirement(mk({ spend: -5 }))).toBe(false);
    expect(validateRetirement(mk({ returnPct: -5.1 }))).toBe(false);
    expect(validateRetirement(mk({ returnPct: 15.1 }))).toBe(false);
    expect(validateRetirement(mk({ retireReturnPct: 16 }))).toBe(false);
    expect(validateRetirement(mk({ retireReturnPct: -6 }))).toBe(false);
    expect(validateRetirement(mk({ inflationPct: -1 }))).toBe(false);
    expect(validateRetirement(mk({ inflationPct: 16 }))).toBe(false);
    expect(validateRetirement(mk({ savings: NaN }))).toBe(false);
    expect(validateRetirement(mk({ monthly: Infinity }))).toBe(false);
  });

  it('accepts the edges of every range', () => {
    expect(validateRetirement(mk({ returnPct: -5, retireReturnPct: 15, inflationPct: 0 }))).toBe(true);
    expect(validateRetirement(mk({ returnPct: 15, retireReturnPct: -5, inflationPct: 15 }))).toBe(true);
    expect(validateRetirement(mk({ age: 16, retireAge: 17, lifeAge: 18 }))).toBe(true);
    expect(validateRetirement(mk({ age: 90, retireAge: 100, lifeAge: 110 }))).toBe(true);
    expect(validateRetirement(mk({ savings: 0, monthly: 0, benefit: 0 }))).toBe(true);
  });

  it('valid flag follows validation', () => {
    expect(evaluateRetirement(base).valid).toBe(true);
    expect(evaluateRetirement(mk({ retireAge: 30 })).valid).toBe(false);
  });

  it('every input survives a trip through the query string, with short keys', () => {
    const custom: RetirementInputs = { age: 41, retireAge: 63, lifeAge: 92, savings: 250000.5, monthly: 1234, returnPct: 5.25, retireReturnPct: 3.75, inflationPct: 3, spend: 82000, benefit: 31500 };
    const qs = queryFromInputs(custom);
    expect(inputsFromQuery(qs)).toEqual(custom);
    expect(Object.fromEntries(new URLSearchParams(qs))).toEqual({
      age: '41', retire: '63', life: '92', saved: '250000.5', monthly: '1234', ret: '5.25', rret: '3.75', infl: '3', spend: '82000', benefit: '31500',
    });
    for (const key of new URLSearchParams(qs).keys()) expect(key.length).toBeLessThanOrEqual(12);
    expect(inputsFromQuery('?' + qs)).toEqual(custom);
  });

  it('ignores unknown keys, junk values and over-long values', () => {
    const got = inputsFromQuery('?age=abc&ret=7.25&evil=<script>&saved=' + '9'.repeat(40) + '&retire=&life=Infinity&infl=1e400&spend=%20&benefit=1,200&monthly=--5');
    expect(got.age).toBe(base.age);
    expect(got.returnPct).toBe(7.25);
    expect(got.savings).toBe(base.savings);
    expect(got.retireAge).toBe(base.retireAge);
    expect(got.lifeAge).toBe(base.lifeAge);
    expect(got.inflationPct).toBe(base.inflationPct);
    expect(got.spend).toBe(base.spend);
    expect(got.benefit).toBe(1200);
    expect(got.monthly).toBe(base.monthly);
    expect(Object.keys(got).sort()).toEqual(Object.keys(base).sort());
  });

  it('an empty query gives the defaults', () => {
    expect(inputsFromQuery('')).toEqual(base);
  });

  it('a junk query that parses to numbers still fails validation rather than evaluating', () => {
    expect(validateRetirement(inputsFromQuery('?age=70&retire=60'))).toBe(false);
    expect(validateRetirement(inputsFromQuery('?ret=40'))).toBe(false);
  });
});

describe('retirement engine config: deep links seed the real calculators', () => {
  const inputIds = (cfg: { inputs: { id: string }[] }) => new Set(cfg.inputs.map((i) => i.id));
  const params = (href: string) => Object.fromEntries(new URL(href, 'https://x.test').searchParams);
  const steps = retirementEngine.steps(evaluateRetirement(base), base);

  it("the id prefix and storage key are the retirement tool's own", () => {
    expect(retirementEngine.idPrefix).toBe('rd');
    expect(retirementEngine.storageKey).toBe('retirementDecisionScenarios');
  });

  it('there are four steps pointing at the right calculators', () => {
    expect(steps).toHaveLength(4);
    expect(steps.map((s) => new URL(s.href, 'https://x.test').pathname)).toEqual([
      '/finance/retirement-calculator/',
      '/finance/social-security-calculator/',
      '/finance/401k-calculator/',
      '/finance/annuity-payout-calculator/',
    ]);
  });

  it('every carried parameter is a real input id of the target calculator and inside its allowed range', () => {
    const targets = [retirementConfig, socialSecurityConfig, k401Config, annuityConfig];
    steps.forEach((s, n) => {
      const cfg = targets[n] as unknown as { inputs: { id: string; min?: number; max?: number }[] };
      const ids = inputIds(cfg);
      for (const [k, v] of Object.entries(params(s.href))) {
        expect(ids.has(k), `${s.href} ${k}`).toBe(true);
        const def = cfg.inputs.find((i) => i.id === k)!;
        if (Number.isFinite(Number(v)) && def.min !== undefined) expect(Number(v), `${k} >= min`).toBeGreaterThanOrEqual(def.min);
        if (Number.isFinite(Number(v)) && def.max !== undefined) expect(Number(v), `${k} <= max`).toBeLessThanOrEqual(def.max);
      }
    });
  });

  it('the retirement calculator link carries ages, savings, saving, rates and the net yearly need', () => {
    expect(params(steps[0].href)).toEqual({
      currentAge: '35', retirementAge: '67', currentSavings: '60000', monthlyContribution: '800', annualReturn: '6.5', inflationRate: '2.5', desiredIncome: '46000',
    });
  });

  it('the annuity link carries an annual rate that reproduces the monthly real retirement rate, and the net monthly need', () => {
    const p = params(steps[3].href);
    expect(p.solveFor).toBe('duration');
    expect(p.principal).toBe('806212');
    expect(p.payoutAmount).toBe('3833'); // 46,000 / 12
    expect(p.annualReturn).toBe('1.93'); // 1200 x ((1.045 / 1.025)^(1/12) - 1) = 1.93398...
  });

  it('out-of-range ages are left out of the links instead of blanking the target calculator', () => {
    const early = mk({ age: 30, retireAge: 55 });
    const [, ss, k401] = retirementEngine.steps(evaluateRetirement(early), early);
    expect(params(ss.href)).toEqual({}); // Social Security calculator accepts retirement ages 62 to 70 only
    expect(params(k401.href).retirementAge).toBe('55'); // 401(k) calculator accepts 40 to 90, so 55 stays
    expect(params(k401.href).currentAge).toBe('30');
  });

  it('the 401(k) link drops a retirement age below its minimum', () => {
    const young = mk({ age: 20, retireAge: 30, lifeAge: 80 });
    const k = retirementEngine.steps(evaluateRetirement(young), young)[2];
    expect(params(k.href).retirementAge).toBeUndefined();
  });

  it('verdict card and comparison rows render without throwing for every verdict', () => {
    const cases = [base, mk({ monthly: 1500 }), mk({ age: 45, retireAge: 62, savings: 20000, monthly: 300 }), mk({ spend: 20000, benefit: 25000 })];
    expect(cases.map((c) => evaluateRetirement(c).verdict)).toEqual(['tight', 'comfortable', 'over', 'comfortable']);
    for (const inputs of cases) {
      const d = evaluateRetirement(inputs);
      const v = retirementEngine.verdict(d, inputs);
      expect(v.level).toBe(d.verdict);
      expect(v.lines.length).toBeGreaterThan(0);
      for (const l of v.lines) expect(l.value).not.toMatch(/NaN|undefined|Infinity/);
      for (const row of retirementEngine.compareRows) expect(row.value(d, inputs)).not.toMatch(/NaN|undefined|Infinity/);
      for (const s of retirementEngine.steps(d, inputs)) {
        expect(s.answer).not.toMatch(/NaN|undefined|Infinity/);
        for (const l of s.lines) expect(l.value).not.toMatch(/NaN|undefined|Infinity/);
      }
    }
  });

  it('the default verdict card and steps show the independently computed figures', () => {
    const d = evaluateRetirement(base);
    const v = retirementEngine.verdict(d, base);
    expect(v.title).toBe('Close, but short');
    expect(v.lines.map((l) => l.value)).toEqual(['$806,212', '$995,535', '81.0%', '$252 a month']);
    const s = retirementEngine.steps(d, base);
    expect(s[1].lines.map((l) => l.value)).toContain('$1,150,000'); // 4% rule of thumb: 46,000 / 0.04
    expect(s[3].lines[0].value).toBe('about age 88.3');
  });
});
