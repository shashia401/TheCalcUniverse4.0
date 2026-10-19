import { describe, it, expect } from 'vitest';
import type { CalculatorConfig, ExplainStep } from '../../../src/types/calculator';
import { rangeErrors, seedDefaults } from '../../../src/lib/initialForm';
import rentVsBuy from '../../../src/calculators/finance/rent-vs-buy';
import realEstateRentVsBuy from '../../../src/calculators/realestate/rent-vs-buy';

// Oracle: every pinned number below was computed independently in Python's decimal module (50-digit precision,
// ROUND_HALF_UP, `python -I`) from the model's documented rules, not by running the calculator.

type V = Record<string, string>;
const steps = (v: V): ExplainStep[] => rentVsBuy.explainSteps!(v);
const strip = (s: string) => s.replace(/(\d),(?=\d{3})/g, '$1');
const exprs = (v: V) => steps(v).map((s) => strip(s.expr));
const config: CalculatorConfig = rentVsBuy;

const base: V = {
  monthlyRent: '2000', annualRentIncrease: '3', rentersInsurance: '200', homePrice: '400000', downPaymentPct: '20',
  mortgageRate: '6.5', closingCostsPct: '3', propertyTaxRate: '1.2', maintenancePct: '1.5', homeInsurancePct: '0.5',
  homeAppreciationRate: '3', sellingCostsPct: '6', pmiRate: '0.7', yearsToStay: '7',
};

function expectSteps(v: V, expected: string[][]) {
  const out = exprs(v);
  expect(out).toHaveLength(expected.length);
  expected.forEach((subs, i) => {
    for (const s of subs) expect(out[i], `step ${i + 1}`).toContain(s);
  });
}

describe('finance rent-vs-buy explainSteps', () => {
  it('20% down, 7 years: decisive figures and the break-even year', () => {
    expectSteps(base, [
      ['$400000 × (20% down + 3% closing) = $92000'],
      ['$320000 at 6.5% = $2023/month'],
      ['$400000 × (1 + 3%)^7 = $491950; minus the remaining loan $289332 = $202618 equity'],
      ['$491950 × (1 − 6% selling costs) − $289332 = $173101'],
      ['$92000 up front + $169900 mortgage + $33600 tax + $15325 insurance + $45975 upkeep + $0 PMI − $173101 proceeds = $183699'],
      ['$183899 rent (rising 3% a year) + $1400 renters insurance − $55732 growth on the $92000 not spent (at 7%) = $129567'],
      ['$183699 (buy) vs $129567 (rent): renting comes out $54132 cheaper'],
      ['year 20: buy $387422 vs rent $384878 (renting cheaper), then year 21: buy $397492 vs rent $403504 (buying cheaper), so the break-even is year 21'],
    ]);
  });
  it('5% down charges PMI over a 3 year horizon', () => {
    expectSteps({ ...base, homePrice: '300000', downPaymentPct: '5', monthlyRent: '1800', rentersInsurance: '180', yearsToStay: '3' }, [
      ['$300000 × (5% down + 3% closing) = $24000'],
      ['$285000 at 6.5% = $1801/month'],
      ['$300000 × (1 + 3%)^3 = $327818; minus the remaining loan $274789 = $53029 equity'],
      ['$327818 × (1 − 6% selling costs) − $274789 = $33360'],
      ['$24000 up front + $64850 mortgage + $10800 tax + $4636 insurance + $13909 upkeep + $5985 PMI − $33360 proceeds = $90821'],
      ['$66763 rent (rising 3% a year) + $540 renters insurance − $5401 growth on the $24000 not spent (at 7%) = $61902'],
      ['$90821 (buy) vs $61902 (rent): renting comes out $28918 cheaper'],
      ['year 10: buy $227528 vs rent $226208 (renting cheaper), then year 11: buy $244012 vs rent $252112 (buying cheaper), so the break-even is year 11'],
    ]);
  });
  it('no break-even in 30 years, negative net rent cost keeps its sign', () => {
    expectSteps({ ...base, homePrice: '500000', monthlyRent: '1000', homeAppreciationRate: '0', yearsToStay: '5' }, [
      ['$500000 × (20% down + 3% closing) = $115000'],
      ['$400000 at 6.5% = $2528/month'],
      ['$500000 × (1 + 0%)^5 = $500000; minus the remaining loan $374444 = $125556 equity'],
      ['$500000 × (1 − 6% selling costs) − $374444 = $95556'],
      ['$115000 up front + $151696 mortgage + $30000 tax + $12500 insurance + $37500 upkeep + $0 PMI − $95556 proceeds = $251140'],
      ['$63710 rent (rising 3% a year) + $1000 renters insurance − $46293 growth on the $115000 not spent (at 7%) = $18416'],
      ['$251140 (buy) vs $18416 (rent): renting comes out $232724 cheaper'],
      ['year 30: buy $1035178 vs rent -$183504, and buying is never the cheaper option in any of the 30 simulated years'],
    ]);
  });
  it('buying already cheaper after year one', () => {
    const out = exprs({ ...base, homePrice: '200000', monthlyRent: '5000', mortgageRate: '4', yearsToStay: '2' });
    expect(out[1]).toContain('$160000 at 4% = $764/month');
    expect(out[2]).toContain('$200000 × (1 + 3%)^2 = $212180; minus the remaining loan $154250 = $57930 equity');
    expect(out[6]).toContain('buying comes out $83481 cheaper');
    expect(out[7]).toContain('year 1: buy $25109 vs rent $56980, so buying is already cheaper after the first year');
  });
  it('matches the calculator own result rows and the real-estate version for the same inputs', () => {
    const rows = Object.fromEntries(rentVsBuy.calculate(base).map((r) => [r.id, r.value]));
    expect(rows.buyingTotalCost).toBe('$183,699');
    expect(rows.rentingTotalCost).toBe('$129,567');
    expect(rows.breakEvenResult).toBe('21 years');
    const re: V = { homePrice: '400000', downPaymentPct: '20', interestRate: '6.5', homeAppreciation: '3', monthlyRent: '2000', years: '7', rentersInsurance: '200', closingCostsPct: '3', propertyTaxPct: '1.2', maintenancePct: '1.5', rentIncrease: '3' };
    expect(realEstateRentVsBuy.explainSteps!(re).map((s) => strip(s.expr)).slice(0, 7)).toEqual(exprs(base).slice(0, 7));
  });
  it('blank optional fields use the calculator defaults (10% down, 7 years)', () => {
    const out = exprs({ monthlyRent: '2000', homePrice: '400000', mortgageRate: '6.5' });
    expect(out[0]).toContain('(10% down + 3% closing)');
    expect(out[2]).toContain('^7 =');
  });
  it('invalid or empty required input gives no steps', () => {
    expect(steps({ ...base, homePrice: '' })).toEqual([]);
    expect(steps({ ...base, monthlyRent: '0' })).toEqual([]);
    expect(steps({ ...base, mortgageRate: 'abc' })).toEqual([]);
    expect(steps({})).toEqual([]);
  });
});

describe('finance rent-vs-buy explainSteps - defaults and junk input', () => {
  it('default values give a worked solution', () => {
    const v = seedDefaults(config.inputs);
    if (config.calculate(v).length === 0) return;
    const s = steps(v);
    expect(s.length).toBeGreaterThanOrEqual(1);
    expect(s.length).toBeLessThanOrEqual(8);
  });
  it('empty values -> []', () => {
    expect(steps(Object.fromEntries(config.inputs.map((i) => [i.id, ''])))).toEqual([]);
  });
  it('junk in every number field is either clean or empty', () => {
    for (const junk of ['abc', '-1', '0', '1e999', '1e308']) {
      const v = seedDefaults(config.inputs);
      for (const i of config.inputs) if (i.type === 'number') v[i.id] = junk;
      if (Object.keys(rangeErrors(config.inputs, v)).length) continue;
      const s = steps(v);
      if (config.calculate(v).length === 0) expect(s, `junk ${junk}`).toEqual([]);
      for (const st of s) expect(`${st.label} ${st.expr} ${st.note ?? ''}`, `junk ${junk}`).not.toMatch(/NaN|Infinity|undefined/);
    }
  });
  it('one runaway field at a time stays clean', () => {
    for (const i of config.inputs) {
      if (i.type !== 'number') continue;
      for (const junk of ['1e999', '1e308', '-1e308']) {
        const v = seedDefaults(config.inputs);
        v[i.id] = junk;
        if (Object.keys(rangeErrors(config.inputs, v)).length) continue;
        for (const st of steps(v)) expect(`${st.label} ${st.expr} ${st.note ?? ''}`, `${i.id}=${junk}`).not.toMatch(/NaN|Infinity|undefined/);
      }
    }
  });
});
