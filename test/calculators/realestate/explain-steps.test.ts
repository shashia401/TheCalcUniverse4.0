import { describe, it, expect } from 'vitest';
import type { CalculatorConfig, ExplainStep } from '../../../src/types/calculator';
import { rangeErrors, seedDefaults } from '../../../src/lib/initialForm';
import capRate from '../../../src/calculators/realestate/cap-rate';
import closing from '../../../src/calculators/realestate/closing-costs';
import fha from '../../../src/calculators/realestate/fha-loan';
import rentVsBuy from '../../../src/calculators/realestate/rent-vs-buy';

// Oracle: every pinned number below was computed independently in Python's decimal module (50-digit precision,
// ROUND_HALF_UP, `python -I`), not by running the calculators.

type V = Record<string, string>;
const steps = (c: CalculatorConfig, v: V): ExplainStep[] => c.explainSteps!(v);
const strip = (s: string) => s.replace(/(\d),(?=\d{3})/g, '$1');
const exprs = (c: CalculatorConfig, v: V) => steps(c, v).map((s) => strip(s.expr));

/** One array of required substrings per step; the step count must match exactly. */
function expectSteps(c: CalculatorConfig, v: V, expected: string[][]) {
  const out = exprs(c, v);
  expect(out).toHaveLength(expected.length);
  expected.forEach((subs, i) => {
    for (const s of subs) expect(out[i], `step ${i + 1}`).toContain(s);
  });
  for (const s of steps(c, v)) {
    expect(s.label.length).toBeGreaterThan(0);
    expect(`${s.label} ${s.expr} ${s.note ?? ''}`).not.toMatch(/NaN|Infinity|undefined/);
  }
}

const ALL: [string, CalculatorConfig][] = [['cap-rate', capRate], ['closing-costs', closing], ['fha-loan', fha], ['rent-vs-buy', rentVsBuy]];

describe('realestate explainSteps - default values give a worked solution', () => {
  for (const [name, config] of ALL) {
    it(name, () => {
      const v = seedDefaults(config.inputs);
      if (config.calculate(v).length === 0) return;
      const s = steps(config, v);
      expect(s.length).toBeGreaterThanOrEqual(1);
      expect(s.length).toBeLessThanOrEqual(8);
    });
  }
});

describe('realestate explainSteps - blank, invalid and runaway input never print NaN/Infinity', () => {
  for (const [name, config] of ALL) {
    it(`${name}: empty values -> []`, () => {
      const blank = Object.fromEntries(config.inputs.map((i) => [i.id, '']));
      expect(steps(config, blank)).toEqual([]);
    });
    it(`${name}: junk in every number field is either clean or empty`, () => {
      for (const junk of ['abc', '-1', '0', '1e999', '1e308']) {
        const v = seedDefaults(config.inputs);
        for (const i of config.inputs) if (i.type === 'number') v[i.id] = junk;
        if (Object.keys(rangeErrors(config.inputs, v)).length) continue;
        const s = steps(config, v);
        if (config.calculate(v).length === 0) expect(s, `junk ${junk}`).toEqual([]);
        for (const st of s) expect(`${st.label} ${st.expr} ${st.note ?? ''}`, `junk ${junk}`).not.toMatch(/NaN|Infinity|undefined/);
      }
    });
    it(`${name}: one runaway field at a time stays clean`, () => {
      for (const i of config.inputs) {
        if (i.type !== 'number') continue;
        for (const junk of ['1e999', '1e308', '-1e308']) {
          const v = seedDefaults(config.inputs);
          v[i.id] = junk;
          if (Object.keys(rangeErrors(config.inputs, v)).length) continue;
          for (const st of steps(config, v)) expect(`${st.label} ${st.expr} ${st.note ?? ''}`, `${i.id}=${junk}`).not.toMatch(/NaN|Infinity|undefined/);
        }
      }
    });
  }
});

describe('cap-rate explainSteps', () => {
  const v = { propertyValue: '400000', annualRent: '36000', vacancyRate: '5', propertyTax: '4800', insurance: '1200', hoa: '0', maintenance: '1800', propertyManagement: '3000', otherExpenses: '600' };
  it('NOI, cap rate and break-even occupancy', () => {
    expectSteps(capRate, v, [
      ['$36000 × (1 − 5%) = $34200 effective income'],
      ['$4800 tax + $1200 insurance + $0 HOA + $1800 maintenance + $3000 management + $600 other = $11400'],
      ['$34200 − $11400 = $22800 a year'],
      ['$22800 ÷ $400000 = 5.70%'],
      ['$11400 ÷ $36000 = 31.7%'],
    ]);
  });
  it('expenses above income give a negative NOI and cap rate', () => {
    const out = exprs(capRate, { ...v, propertyTax: '40000' });
    // egi 34200 - 46600 expenses = -12400 -> -3.10%
    expect(out[2]).toContain('$34200 − $46600 = -$12400 a year');
    expect(out[3]).toContain('-$12400 ÷ $400000 = -3.10%');
  });
  it('blank value or rent is empty', () => {
    expect(steps(capRate, { ...v, propertyValue: '' })).toEqual([]);
    expect(steps(capRate, { ...v, annualRent: '0' })).toEqual([]);
  });
});

describe('closing-costs explainSteps', () => {
  const v = { homePrice: '400000', downPaymentPct: '20', loanTerm: '30', interestRate: '6.5', party: 'buyer' };
  it('buyer: loan, three fee groups and the total', () => {
    expectSteps(closing, v, [
      ['$400000 × (1 − 20% down) = $320000'],
      ['$3200 + $550 + $35 + $995 = $4780'],
      ['$350 + $1600 + $1600 + $450 + $150 = $4150'],
      ['$855 + $2000 + $1200 + $350 = $4405'],
      ['$4780 + $4150 + $4405 = $13335 (3.3% of price)'],
    ]);
  });
  it('seller: commissions, transfer tax and warranty', () => {
    expectSteps(closing, { ...v, party: 'seller' }, [['$10000 + $10000 + $800 + $500 = $21300 (5.3% of price)']]);
  });
  it('both parties give buyer steps plus the seller total', () => {
    expect(steps(closing, { ...v, party: 'both' })).toHaveLength(6);
  });
  it('a blank down payment means the standard 20%', () => {
    expect(exprs(closing, { ...v, downPaymentPct: '' })[0]).toContain('(1 − 20% down)');
  });
  it('100% down has no buyer loan', () => {
    expect(steps(closing, { ...v, downPaymentPct: '100' })).toEqual([]);
  });
});

describe('fha-loan explainSteps', () => {
  const v = { homePrice: '300000', downPaymentPct: '3.5', interestRate: '6.5', loanTerm: '30' };
  it('3.5% down: upfront premium, P&I, monthly premium, total', () => {
    expectSteps(fha, v, [
      ['$300000.00 − $10500.00 (3.5% down) = $289500.00'],
      ['$289500.00 × 1.75% = $5066.25, so the loan is $294566.25'],
      ['$294566.25 at 6.5% over 360 payments = $1861.86/month'],
      ['$289500.00 × 0.55% ÷ 12 = $132.69/month'],
      ['$1861.86 + $132.69 = $1994.55/month'],
    ]);
  });
  it('the premium note follows the down payment', () => {
    expect(steps(fha, v)[3].note).toContain('life of the loan');
    expect(steps(fha, { ...v, downPaymentPct: '10' })[3].note).toContain('11 years');
  });
  it('a bad price is empty', () => {
    expect(steps(fha, { ...v, homePrice: '0' })).toEqual([]);
  });
});

describe('rent-vs-buy explainSteps', () => {
  const v = { homePrice: '400000', downPaymentPct: '20', interestRate: '6.5', closingCostsPct: '3', propertyTaxPct: '1.2', maintenancePct: '1.5', homeAppreciation: '3', monthlyRent: '2200', rentIncrease: '3', rentersInsurance: '200', years: '7' };
  it('7 years at 20% down', () => {
    expectSteps(rentVsBuy, v, [
      ['$400000 × (20% down + 3% closing) = $92000'],
      ['$320000 at 6.5% = $2023/month'],
      ['$400000 × (1 + 3%)^7 = $491950', 'minus the remaining loan $289332 = $202618 equity'],
      ['$491950 × (1 − 6% selling costs) − $289332 = $173101'],
      ['$92000 up front + $169900 mortgage + $33600 tax + $15325 insurance + $45975 upkeep + $0 PMI − $173101 proceeds = $183699'],
      ['$202289 rent (rising 3% a year) + $1400 renters insurance − $55732 growth on the $92000 not spent (at 7%) = $147957'],
      ['$183699 (buy) vs $147957 (rent): renting comes out $35742 cheaper'],
    ]);
  });
  it('under 20% down adds PMI', () => {
    const out = exprs(rentVsBuy, { ...v, downPaymentPct: '10' });
    expect(out[4]).toContain('$17640 PMI');
    expect(out[4]).toContain('= $218743');
    expect(out[5]).toContain('= $172188');
  });
  it('the last step names the same winner the calculator reports', () => {
    const r = rentVsBuy.calculate(v);
    expect(r.find((x) => x.id === 'netBuyCost')!.value).toBe('$183,699');
    expect(r.find((x) => x.id === 'netRentCost')!.value).toBe('$147,957');
  });
  it('blank rent is empty', () => {
    expect(steps(rentVsBuy, { ...v, monthlyRent: '' })).toEqual([]);
  });
});
