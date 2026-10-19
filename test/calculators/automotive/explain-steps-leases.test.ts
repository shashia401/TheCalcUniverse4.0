import { describe, it, expect } from 'vitest';
import type { CalculatorConfig, ExplainStep } from '../../../src/types/calculator';
import { rangeErrors, seedDefaults } from '../../../src/lib/initialForm';
import lease from '../../../src/calculators/automotive/lease-calculator';
import cashBack from '../../../src/calculators/automotive/cash-back-vs-low-interest';
import leaseVsBuy from '../../../src/calculators/automotive/lease-vs-buy';
import tire from '../../../src/calculators/automotive/tire-size';

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

const ALL: [string, CalculatorConfig][] = [['lease-calculator', lease], ['cash-back-vs-low-interest', cashBack], ['lease-vs-buy', leaseVsBuy], ['tire-size', tire]];

describe('automotive lease/tire explainSteps - default values give a worked solution', () => {
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

describe('automotive lease/tire explainSteps - blank, invalid and runaway input never print NaN/Infinity', () => {
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

describe('lease-calculator explainSteps', () => {
  const v = { msrp: '35000', negotiatedPrice: '33000', downPayment: '2000', tradeInValue: '0', leaseTerm: '36', residualValuePct: '60', rateInputType: 'mf', moneyFactor: '0.00125', aprRate: '', salesTax: '7', acquisitionFee: '695' };
  it('money-factor lease', () => {
    expectSteps(lease, v, [
      ['$33000.00 − $2000.00 down − $0.00 trade-in + $695.00 acquisition fee = $31695.00'],
      ['$35000.00 MSRP × 60% = $21000.00'],
      ['0.00125 × 2400 = 3.00%'],
      ['($31695.00 − $21000.00) ÷ 36 months = $297.08'],
      ['($31695.00 + $21000.00) × 0.00125 = $65.87'],
      ['$297.08 + $65.87 = $362.95', '+ 7% tax ($25.41) = $388.36/month'],
      ['$388.36 × 36 + $2000.00 down + $0.00 trade-in = $15980.91'],
    ]);
  });
  it('APR input is converted to a money factor', () => {
    const out = exprs(lease, { ...v, rateInputType: 'apr', moneyFactor: '', aprRate: '3.6' });
    expect(out[2]).toBe('3.6% ÷ 2400 = 0.00150');
    expect(out).toHaveLength(7);
  });
  it('the last step matches the displayed total lease cost', () => {
    expect(lease.calculate(v).find((r) => r.id === 'totalLeaseCostResult')!.value).toBe('$15,980.91');
  });
  it('a residual above the cap cost (non-positive payment) is empty', () => {
    expect(steps(lease, { ...v, residualValuePct: '99', negotiatedPrice: '20000' })).toEqual([]);
  });
});

describe('cash-back-vs-low-interest explainSteps', () => {
  const v = { vehiclePrice: '35000', downPayment: '3000', loanTermMonths: '60', cashRebate: '3000', standardRate: '7.5', promoRate: '1.9' };
  it('rebate at the standard rate vs the promotional rate', () => {
    expectSteps(cashBack, v, [
      ['Loan = $35000.00 − $3000.00 down − $3000.00 rebate = $29000.00'],
      ['$29000.00 at 7.5% over 60 months = $581.10/month'],
      ['Loan = $35000.00 − $3000.00 down = $32000.00', 'at 1.9% over 60 months = $559.49/month'],
      ['A: $581.10 × 60 + $3000.00 down = $37866.03', 'B: $559.49 × 60 + $3000.00 down = $36569.37'],
      ['Option B (low rate) is cheaper by $1296.66'],
    ]);
  });
  it('notes carry the interest paid under each option', () => {
    expect(steps(cashBack, v)[3].note).toContain('A $5,866.03');
    expect(steps(cashBack, v)[3].note).toContain('B $1,569.37');
  });
  it('a rebate bigger than the loan is credited back', () => {
    // loan 5000, rebate 8000 -> A principal 0, excess 3000 offsets the cost
    const out = exprs(cashBack, { vehiclePrice: '8000', downPayment: '3000', loanTermMonths: '36', cashRebate: '8000', standardRate: '6', promoRate: '0' });
    expect(out[0]).toContain('= $0.00');
    expect(out[3]).toContain('− $3000.00 rebate beyond the loan');
  });
});

describe('lease-vs-buy explainSteps', () => {
  const v = { vehiclePrice: '35000', leasePayment: '399', leaseDownPayment: '2999', leaseTerm: '36', buyDownPayment: '5000', buyAPR: '6.5', buyLoanTerm: '60', salesTax: '7', depreciationRate: '15' };
  it('36-month lease vs a 60-month loan', () => {
    expectSteps(leaseVsBuy, v, [
      ['$2999 down + $399.00 × 36 months × (1 + 7% tax) = $18368'],
      ['$35000 × (1 + 7%) − $5000 down = $32450'],
      ['$32450 at 6.5% over 60 months = $634.92/month'],
      ['Paid $634.92 × 36 = $22857; balance left = $14253'],
      ['$35000 × (1 − 15%)^(36 ÷ 12) = $21494'],
      ['$5000 down + $22857 paid + $14253 owed − $21494 car value = $20616'],
      ['$18368 (lease) vs $20616 (buy): leasing is $2247 cheaper'],
    ]);
  });
  it('the totals match the calculator results', () => {
    const r = leaseVsBuy.calculate(v);
    expect(r.find((x) => x.id === 'totalLease')!.value).toBe('$18,368');
    expect(r.find((x) => x.id === 'totalBuy')!.value).toBe('$20,616');
  });
  it('0% depreciation is honoured, a blank rate is not', () => {
    expect(exprs(leaseVsBuy, { ...v, depreciationRate: '0' })[4]).toContain('(1 − 0%)^(36 ÷ 12) = $35000');
    expect(steps(leaseVsBuy, { ...v, buyAPR: '' })).toEqual([]);
  });
});

describe('tire-size explainSteps', () => {
  const v = { origWidth: '225', origAspect: '65', origRim: '17', newWidth: '245', newAspect: '45', newRim: '20' };
  it('225/65R17 to 245/45R20', () => {
    expectSteps(tire, v, [
      ['17" × 25.4 + 2 × 225 mm × 65% = 724.3 mm (28.52")'],
      ['20" × 25.4 + 2 × 245 mm × 45% = 728.5 mm (28.68")'],
      ['(728.5 − 724.3) ÷ 724.3 = 0.58%'],
      ['60 × 728.5 ÷ 724.3 = 60.35 mph'],
    ]);
  });
  it('a smaller tire reads high and says so', () => {
    const s = steps(tire, { ...v, newWidth: '205', newAspect: '55', newRim: '16' });
    expect(s[3].note).toContain('higher than your real speed');
  });
  it('identical sizes say the speedometer stays accurate', () => {
    expect(steps(tire, { ...v, newWidth: '225', newAspect: '65', newRim: '17' })[3].note).toContain('stays accurate');
  });
});
