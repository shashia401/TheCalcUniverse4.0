import { describe, it, expect } from 'vitest';
import type { CalculatorConfig, ExplainStep } from '../../../src/types/calculator';
import { rangeErrors, seedDefaults } from '../../../src/lib/initialForm';
import fba from '../../../src/calculators/ecommerce/amazon-fba';
import cac from '../../../src/calculators/ecommerce/cac';
import cogs from '../../../src/calculators/ecommerce/cogs';

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

const ALL: [string, CalculatorConfig][] = [['amazon-fba', fba], ['cac', cac], ['cogs', cogs]];

describe('ecommerce explainSteps - default values give a worked solution', () => {
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

describe('ecommerce explainSteps - blank, invalid and runaway input never print NaN/Infinity', () => {
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

describe('amazon-fba explainSteps', () => {
  it('general category with storage', () => {
    expectSteps(fba, { sellingPrice: '29.99', productCost: '8', weight: '1.2', category: 'general', volume: '0.1' }, [
      ['$29.99 × 15% (effective rate for General / Standard) = $4.50'],
      ['1.2 lb → $4.18'],
      ['0.1 cu ft × $0.78 = $0.08'],
      ['$4.50 + $4.18 + $0.08 = $8.76'],
      ['$29.99 − $8.00 cost − $8.76 fees = $13.23'],
      ['Margin = $13.23 ÷ $29.99 = 44.1%; ROI = $13.23 ÷ $8.00 = 165.4%'],
    ]);
  });
  it('books add the closing fee', () => {
    expectSteps(fba, { sellingPrice: '20', productCost: '4', weight: '0.5', category: 'books', volume: '' }, [
      ['$20.00 × 15% (effective rate for Books / Media) = $3.00'],
      ['+ $1.80 per item sold'],
      ['0.5 lb → $3.22'],
      ['$3.00 + $1.80 + $3.22 = $8.02'],
      ['$20.00 − $4.00 cost − $8.02 fees = $7.98'],
      ['Margin = $7.98 ÷ $20.00 = 39.9%; ROI = $7.98 ÷ $4.00 = 199.5%'],
    ]);
  });
  it('fulfillment is labelled as an estimate and the fee table is not hard-coded in the step text', () => {
    const s = steps(fba, { sellingPrice: '29.99', productCost: '8', weight: '1.2', category: 'general', volume: '' });
    expect(s[1].label).toContain('illustrative estimate');
    expect(s[1].note).toContain('current rate card');
  });
  it('the net profit step matches the displayed result', () => {
    const v = { sellingPrice: '29.99', productCost: '8', weight: '1.2', category: 'general', volume: '0.1' };
    expect(fba.calculate(v).find((r) => r.id === 'netProfit')!.value).toBe('$13.23');
  });
});

describe('cac explainSteps', () => {
  it('CAC, LTV ratio and payback', () => {
    expectSteps(cac, { totalMarketingSpend: '15000', newCustomers: '300', ltv: '450', avgOrderValue: '60', ordersPerMonth: '1', grossMarginPct: '40' }, [
      ['$15000.00 ÷ 300 = $50.00'],
      ['$450.00 ÷ $50.00 = 9.00x'],
      ['$60.00 × 40% × 1 order = $24.00'],
      ['$50.00 ÷ $24.00 = 2.1 months'],
    ]);
  });
  it('spend and customers alone give one step', () => {
    expect(steps(cac, { totalMarketingSpend: '15000', newCustomers: '300' })).toHaveLength(1);
  });
  it('zero spend has no LTV ratio step', () => {
    const s = steps(cac, { totalMarketingSpend: '0', newCustomers: '300', ltv: '450' });
    expect(s).toHaveLength(1);
    expect(s[0].expr).toContain('= $0.00');
  });
  it('zero customers is empty', () => {
    expect(steps(cac, { totalMarketingSpend: '1000', newCustomers: '0' })).toEqual([]);
  });
});

describe('cogs explainSteps', () => {
  it('beginning inventory + purchases - ending inventory, with revenue', () => {
    expectSteps(cogs, { beginningInventory: '10000', purchases: '25000', endingInventory: '8000', revenue: '60000' }, [
      ['$10000.00 beginning inventory + $25000.00 purchases = $35000.00'],
      ['$35000.00 − $8000.00 ending inventory = $27000.00 cost of goods sold'],
      ['$60000.00 revenue − $27000.00 COGS = $33000.00'],
      ['$33000.00 ÷ $60000.00 = 55.00% margin; $27000.00 ÷ $60000.00 = 45.00% of revenue'],
    ]);
  });
  it('without revenue the margin steps are dropped', () => {
    expect(steps(cogs, { beginningInventory: '10000', purchases: '25000', endingInventory: '8000' })).toHaveLength(2);
  });
  it('ending inventory above goods available is flagged, not negative', () => {
    const s = steps(cogs, { beginningInventory: '1000', purchases: '500', endingInventory: '2000' });
    expect(s[1].expr).toContain('is negative, so COGS is shown as $0.00');
  });
});
