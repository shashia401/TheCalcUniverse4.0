import { describe, it, expect } from 'vitest';
import type { ExplainStep } from '../../../src/types/calculator';
import dti from '../../../src/calculators/realestate/dti-ratio';
import { buildDemoValues, getValue } from '../../helpers';

// Every expected string below was computed independently in Python (decimal module at 60-digit precision with
// ROUND_HALF_UP), not by running the calculator.

type V = Record<string, string>;
const steps = (v: V): ExplainStep[] => dti.explainSteps!(v);
const strip = (s: string) => s.replace(/(\d),(?=\d{3})/g, '$1');
const exprs = (v: V) => steps(v).map((s) => strip(s.expr));
const clean = (st: ExplainStep[]) => st.forEach((s) => expect(`${s.label} ${s.expr} ${s.note ?? ''}`).not.toMatch(/NaN|Infinity|undefined/));

const PINNED: [string, V, string[]][] = [
  ['dt1', { grossMonthlySalary: '7000', bonusOvertime: '500', otherIncome: '0', housingPayment: '1800', carPayment: '400', studentLoans: '300', creditCardMin: '150', childSupport: '0', otherDebt: '0' }, [
      '$7000.00 + $500.00 + $0.00 = $7500.00',
      '$1800.00 + $400.00 + $300.00 + $150.00 + $0.00 + $0.00 = $2650.00',
      '$1800.00 ÷ $7500.00 × 100 = 24.0%',
      '$2650.00 ÷ $7500.00 × 100 = 35.3%',
      '$7500.00 × 0.28 = $2100.00/mo housing · × 0.36 = $2700.00/mo debt · × 0.43 = $3225.00/mo debt',
  ]],
  ['dt2', { grossMonthlySalary: '5000', bonusOvertime: '', otherIncome: '250.5', housingPayment: '2000', carPayment: '600', studentLoans: '', creditCardMin: '300.25', childSupport: '500', otherDebt: '100' }, [
      '$5000.00 + $0.00 + $250.50 = $5250.50',
      '$2000.00 + $600.00 + $0.00 + $300.25 + $500.00 + $100.00 = $3500.25',
      '$2000.00 ÷ $5250.50 × 100 = 38.1%',
      '$3500.25 ÷ $5250.50 × 100 = 66.7%',
      '$5250.50 × 0.28 = $1470.14/mo housing · × 0.36 = $1890.18/mo debt · × 0.43 = $2257.72/mo debt',
  ]],
];

describe('dti-ratio explainSteps', () => {
  it('demo values: five steps, ending on the displayed limits', () => {
    const v = buildDemoValues(dti.inputs);
    const r = dti.calculate(v);
    expect(r.length).toBeGreaterThan(0);
    const e = steps(v);
    expect(e).toHaveLength(5);
    expect(strip(e[2].expr).endsWith(getValue(r, 'frontEndDTI'))).toBe(true);
    expect(strip(e[3].expr).endsWith(getValue(r, 'backEndDTI'))).toBe(true);
    expect(e[4].expr).toContain(getValue(r, 'maxHousingFor28'));
    expect(e[4].expr).toContain(getValue(r, 'maxDebtFor43'));
    expect(e[4].note).toContain(getValue(r, 'debtHeadroom'));
    clean(e);
  });
  for (const [id, values, expected] of PINNED) {
    it(`pinned: ${id}`, () => {
      expect(exprs(values)).toEqual(expected);
      clean(steps(values));
    });
  }
  it('over the 43% limit the note says so', () => {
    const v = { grossMonthlySalary: '5000', bonusOvertime: '', otherIncome: '250.5', housingPayment: '2000', carPayment: '600', studentLoans: '', creditCardMin: '300.25', childSupport: '500', otherDebt: '100' };
    const note = steps(v)[4].note!;
    expect(note).toBe(`Against the 43% limit: ${getValue(dti.calculate(v), 'debtHeadroom')}.`);
    expect(note).toContain('over limit');
  });
  it('empty values and no income give no steps', () => {
    expect(steps({})).toEqual([]);
    expect(steps(Object.fromEntries(dti.inputs.map((i) => [i.id, ''])))).toEqual([]);
    expect(steps({ grossMonthlySalary: '0', housingPayment: '1000' })).toEqual([]);
    expect(steps({ grossMonthlySalary: '-100', housingPayment: '1000' })).toEqual([]);
    expect(steps({ grossMonthlySalary: 'abc', housingPayment: '1000' })).toEqual([]);
  });
  it('income only (no debts) still works and prints zero debts', () => {
    const e = exprs({ grossMonthlySalary: '4000' });
    expect(e[1]).toBe('$0.00 + $0.00 + $0.00 + $0.00 + $0.00 + $0.00 = $0.00');
    expect(e[2]).toBe('$0.00 ÷ $4000.00 × 100 = 0.0%');
  });
  it('junk and runaway numbers never print NaN/Infinity', () => {
    for (const junk of ['', 'abc', '-1', '0', '1e999', '1e308']) {
      const v = buildDemoValues(dti.inputs);
      for (const i of dti.inputs) if (i.type === 'number') v[i.id] = junk;
      const s = steps(v);
      if (dti.calculate(v).length === 0) expect(s, `junk "${junk}"`).toEqual([]);
      clean(s);
    }
    for (const field of dti.inputs.filter((i) => i.type === 'number')) {
      for (const big of ['1e999', '1e308']) {
        const v = buildDemoValues(dti.inputs);
        v[field.id] = big;
        clean(steps(v));
      }
    }
  });
});
