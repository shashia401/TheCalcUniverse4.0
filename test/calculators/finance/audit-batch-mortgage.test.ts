import { describe, it, expect } from 'vitest';
import mortgage from '../../../src/calculators/finance/mortgage-calculator';

type Out = { id: string; value: string; label?: string }[];
const val = (r: unknown, id: string) => (r as Out).find((x) => x.id === id)?.value;

// Every expected number below was computed independently in Python (decimal at 60 digits, ROUND_HALF_UP to the cent),
// never copied from calculator output. Oracle conventions:
//   loan = price - down; M = loan * i(1+i)^n / ((1+i)^n - 1) with i = rate/1200 (loan/n at 0%), rounded to the cent;
//   tax = price * taxPct/100/12; insurance = annual/12; PMI = loan * 0.8%/12 only when down/price < 20%; each rounded to the cent;
//   total monthly = sum of the rounded parts; total interest = M_rounded * n - loan (0 at 0%);
//   total paid = M_rounded * n + (tax + insurance + HOA) * n + PMI * pmiMonths;
//   pmiMonths = first payment after which the exact (unrounded-payment) balance is <= 80% of the price.
const base = { homePrice: '400000', downPayment: '80000', downPaymentPct: '', loanTerm: '30', interestRate: '6.8', propertyTax: '1.1', homeInsurance: '1500', hoaFee: '0' };

interface Case {
  name: string;
  input: Record<string, string>;
  loan: string; pi: string; tax: string; ins: string; pmi: string; hoa: string; total: string;
  interest: string; paid: string; pmiEnds: string;
}

const NO_PMI = 'No PMI needed (20% or more down)';

const cases: Case[] = [
  {
    name: '20% down, 30 years at 6.8% (no PMI)',
    input: base,
    loan: '$320,000.00', pi: '$2,086.16', tax: '$366.67', ins: '$125.00', pmi: '$0.00', hoa: '$0.00', total: '$2,577.83',
    interest: '$431,017.60', paid: '$928,018.80', pmiEnds: NO_PMI,
  },
  {
    name: '5% down (percent box): PMI for 127 payments',
    input: { ...base, downPayment: '1', downPaymentPct: '5' },
    loan: '$380,000.00', pi: '$2,477.32', tax: '$366.67', ins: '$125.00', pmi: '$253.33', hoa: '$0.00', total: '$3,222.32',
    interest: '$511,835.20', paid: '$1,101,009.31', pmiEnds: 'After payment 127 (10 yr 7 mo)',
  },
  {
    name: '15-year loan, 20% down',
    input: { ...base, loanTerm: '15' },
    loan: '$320,000.00', pi: '$2,840.59', tax: '$366.67', ins: '$125.00', pmi: '$0.00', hoa: '$0.00', total: '$3,332.26',
    interest: '$191,306.20', paid: '$599,806.80', pmiEnds: NO_PMI,
  },
  {
    name: '10-year loan at 5.5%',
    input: { ...base, homePrice: '500000', downPayment: '', downPaymentPct: '20', loanTerm: '10', interestRate: '5.5' },
    loan: '$400,000.00', pi: '$4,341.05', tax: '$458.33', ins: '$125.00', pmi: '$0.00', hoa: '$0.00', total: '$4,924.38',
    interest: '$120,926.00', paid: '$590,925.60', pmiEnds: NO_PMI,
  },
  {
    name: '0% interest, 5% down: payment is loan / 360, no interest',
    input: { ...base, homePrice: '250000', downPayment: '', downPaymentPct: '5', interestRate: '0' },
    loan: '$237,500.00', pi: '$659.72', tax: '$229.17', ins: '$125.00', pmi: '$158.33', hoa: '$0.00', total: '$1,172.22',
    interest: '$0.00', paid: '$374,026.01', pmiEnds: 'After payment 57 (4 yr 9 mo)',
  },
  {
    name: 'HOA, custom tax and insurance, 7% rate',
    input: { ...base, homePrice: '300000', downPayment: '', downPaymentPct: '20', interestRate: '7', propertyTax: '1.5', homeInsurance: '1800', hoaFee: '275' },
    loan: '$240,000.00', pi: '$1,596.73', tax: '$375.00', ins: '$150.00', pmi: '$0.00', hoa: '$275.00', total: '$2,396.73',
    interest: '$334,822.80', paid: '$862,822.80', pmiEnds: NO_PMI,
  },
  {
    name: '15-year, $70,000 down on $350,000 at 6% with $150 HOA',
    input: { ...base, homePrice: '350000', downPayment: '70000', loanTerm: '15', interestRate: '6', hoaFee: '150' },
    loan: '$280,000.00', pi: '$2,362.80', tax: '$320.83', ins: '$125.00', pmi: '$0.00', hoa: '$150.00', total: '$2,958.63',
    interest: '$145,304.00', paid: '$532,553.40', pmiEnds: NO_PMI,
  },
  {
    name: '15% down on 20 years at 6.25%: PMI for 27 payments',
    input: { ...base, homePrice: '275000', downPayment: '', downPaymentPct: '15', loanTerm: '20', interestRate: '6.25', propertyTax: '2', homeInsurance: '1200' },
    loan: '$233,750.00', pi: '$1,708.54', tax: '$458.33', ins: '$100.00', pmi: '$155.83', hoa: '$0.00', total: '$2,422.70',
    interest: '$176,299.60', paid: '$548,256.21', pmiEnds: 'After payment 27 (2 yr 3 mo)',
  },
  {
    name: 'big price: $2.5M, 10% down, 20 years at 6.5%',
    input: { ...base, homePrice: '2500000', downPayment: '', downPaymentPct: '10', loanTerm: '20', interestRate: '6.5', propertyTax: '0.9', homeInsurance: '6000' },
    loan: '$2,250,000.00', pi: '$16,775.40', tax: '$1,875.00', ins: '$500.00', pmi: '$1,500.00', hoa: '$0.00', total: '$20,650.40',
    interest: '$1,776,096.00', paid: '$4,668,096.00', pmiEnds: 'After payment 48 (4 yr)',
  },
  {
    name: 'zero down: PMI for 150 payments',
    input: { ...base, downPayment: '0' },
    loan: '$400,000.00', pi: '$2,607.70', tax: '$366.67', ins: '$125.00', pmi: '$266.67', hoa: '$0.00', total: '$3,366.04',
    interest: '$538,772.00', paid: '$1,155,773.70', pmiEnds: 'After payment 150 (12 yr 6 mo)',
  },
  {
    name: '$1 under 20% down still gets PMI (213.33), stopping after payment 1',
    input: { ...base, downPayment: '79999' },
    loan: '$320,001.00', pi: '$2,086.17', tax: '$366.67', ins: '$125.00', pmi: '$213.33', hoa: '$0.00', total: '$2,791.17',
    interest: '$431,020.20', paid: '$928,235.73', pmiEnds: 'After payment 1 (1 mo)',
  },
];

describe('mortgage-calculator audit (independent Python Decimal oracle)', () => {
  for (const c of cases) {
    it(c.name, () => {
      const r = mortgage.calculate(c.input);
      expect(val(r, 'loanAmount')).toBe(c.loan);
      expect(val(r, 'monthlyPI')).toBe(c.pi);
      expect(val(r, 'monthlyTax')).toBe(c.tax);
      expect(val(r, 'monthlyInsurance')).toBe(c.ins);
      expect(val(r, 'monthlyPmi')).toBe(c.pmi);
      expect(val(r, 'monthlyHoa')).toBe(c.hoa);
      expect(val(r, 'totalMonthly')).toBe(c.total);
      expect(val(r, 'totalInterest')).toBe(c.interest);
      expect(val(r, 'totalPaid')).toBe(c.paid);
      expect(val(r, 'pmiEnds')).toBe(c.pmiEnds);
      // The headline is the total monthly payment.
      expect((r as { id: string; highlight?: boolean }[]).filter((x) => x.highlight).map((x) => x.id)).toEqual(['totalMonthly']);
    });
  }

  it('the monthly parts always add up to the headline (to the cent)', () => {
    for (const c of cases) {
      const r = mortgage.calculate(c.input);
      const n = (id: string) => parseFloat(val(r, id)!.replace(/[$,]/g, ''));
      const sum = n('monthlyPI') + n('monthlyTax') + n('monthlyInsurance') + n('monthlyPmi') + n('monthlyHoa');
      expect(Math.abs(sum - n('totalMonthly'))).toBeLessThan(0.005);
    }
  });

  it('20% down is the PMI boundary: exactly 20% -> none, one dollar under -> PMI', () => {
    expect(val(mortgage.calculate({ ...base, downPayment: '80000' }), 'monthlyPmi')).toBe('$0.00');
    expect(val(mortgage.calculate({ ...base, downPayment: '79999' }), 'monthlyPmi')).toBe('$213.33');
    expect(val(mortgage.calculate({ ...base, downPayment: '', downPaymentPct: '20' }), 'monthlyPmi')).toBe('$0.00');
    expect(val(mortgage.calculate({ ...base, downPayment: '', downPaymentPct: '19.99' }), 'monthlyPmi')).not.toBe('$0.00');
  });

  it('the percent box wins over the dollar box when both are filled', () => {
    const both = mortgage.calculate({ ...base, downPayment: '1000', downPaymentPct: '20' });
    expect(val(both, 'loanAmount')).toBe('$320,000.00');
  });

  it('invalid and empty input gives no results', () => {
    const bad: Record<string, string>[] = [
      {},
      { ...base, homePrice: '' },
      { ...base, homePrice: '0' },
      { ...base, homePrice: '-400000' },
      { ...base, homePrice: 'abc' },
      { ...base, interestRate: '' },
      { ...base, interestRate: 'abc' },
      { ...base, interestRate: '-1' },
      { ...base, loanTerm: '0' },
      { ...base, loanTerm: '1000' },
      { ...base, loanTerm: 'abc' },
      { ...base, downPayment: '400000' },
      { ...base, downPayment: '500000' },
      { ...base, downPayment: '', downPaymentPct: '100' },
      { ...base, downPayment: '-5000' },
      { ...base, interestRate: '1e308' },
    ];
    for (const v of bad) expect(mortgage.calculate(v), JSON.stringify(v)).toEqual([]);
  });

  it('blank optional fields are treated as zero, not as errors', () => {
    const r = mortgage.calculate({ homePrice: '400000', downPayment: '80000', downPaymentPct: '', loanTerm: '30', interestRate: '6.8', propertyTax: '', homeInsurance: '', hoaFee: '' });
    expect(val(r, 'totalMonthly')).toBe('$2,086.16');
    expect(val(r, 'monthlyTax')).toBe('$0.00');
  });
});

describe('mortgage-calculator explainSteps (independent Python values)', () => {
  const steps = (v: Record<string, string>) => mortgage.explainSteps!(v);
  const joined = (v: Record<string, string>) => steps(v).map((s) => `${s.label} | ${s.expr} | ${s.note ?? ''}`);

  it('20% down: loan, rate, payment, tax, insurance, total, interest, total paid', () => {
    const out = steps(base);
    expect(out).toHaveLength(8);
    expect(out[0].expr).toContain('$400,000.00 − $80,000.00 = $320,000.00');
    expect(out[0].expr).toContain('20% down');
    expect(out[1].expr).toContain('r = 6.8% ÷ 12 = 0.5667% per month');
    expect(out[1].expr).toContain('n = 30 years × 12 = 360 payments');
    expect(out[2].expr).toContain('(1 + r)ⁿ = 7.6465');
    expect(out[2].expr).toContain('= $2,086.16');
    expect(out[3].expr).toBe('$400,000.00 × 1.1% ÷ 12 = $366.67 a month');
    expect(out[4].expr).toBe('$1,500.00 ÷ 12 = $125.00 a month');
    expect(out[5].expr).toBe('$2,086.16 + $366.67 tax + $125.00 insurance = $2,577.83');
    expect(out[6].expr).toBe('$2,086.16 × 360 − $320,000.00 = $431,017.60');
    expect(out[7].expr).toBe('$2,086.16 × 360 + $491.67 × 360 = $928,018.80');
  });

  it('5% down adds the PMI and the PMI-stop steps', () => {
    const out = steps({ ...base, downPayment: '', downPaymentPct: '5' });
    expect(out).toHaveLength(10);
    const text = joined({ ...base, downPayment: '', downPaymentPct: '5' }).join('\n');
    expect(text).toContain('$380,000.00 × 0.8% ÷ 12 = $253.33 a month');
    expect(text).toContain('80% × $400,000.00 = $320,000.00');
    expect(text).toContain('after payment 127 (10 yr 7 mo)');
    expect(text).toContain('$2,477.32 + $366.67 tax + $125.00 insurance + $253.33 PMI = $3,222.32');
    expect(text).toContain('$2,477.32 × 360 + $491.67 × 360 + $253.33 × 127 = $1,101,009.31');
  });

  it('HOA appears as its own step and in the total', () => {
    const v = { ...base, homePrice: '300000', downPayment: '', downPaymentPct: '20', interestRate: '7', propertyTax: '1.5', homeInsurance: '1800', hoaFee: '275' };
    const text = joined(v).join('\n');
    expect(text).toContain('HOA dues | $275.00 a month');
    expect(text).toContain('$1,596.73 + $375.00 tax + $150.00 insurance + $275.00 HOA = $2,396.73');
    expect(text).toContain('$1,596.73 × 360 + $800.00 × 360 = $862,822.80');
  });

  it('0% interest divides the loan evenly and pays no interest', () => {
    const v = { ...base, homePrice: '250000', downPayment: '', downPaymentPct: '5', interestRate: '0' };
    const text = joined(v).join('\n');
    expect(text).toContain('M = $237,500.00 ÷ 360 = $659.72');
    expect(text).toContain('No interest rate, so no interest is paid: $0.00');
    expect(text).toContain('$237,500.00 + $354.17 × 360 + $158.33 × 57 = $374,026.01');
    expect(text).not.toContain('(1 + r)ⁿ');
  });

  it('returns [] for blank or invalid input and never prints NaN', () => {
    for (const v of [{}, { ...base, homePrice: '' }, { ...base, interestRate: 'abc' }, { ...base, downPayment: '400000' }, { ...base, loanTerm: '0' }]) {
      expect(steps(v)).toEqual([]);
    }
    for (const c of cases) {
      for (const s of steps(c.input)) expect(`${s.label} ${s.expr} ${s.note ?? ''}`).not.toMatch(/NaN|Infinity|undefined/);
    }
  });
});
