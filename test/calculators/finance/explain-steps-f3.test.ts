import { describe, it, expect } from 'vitest';
import type { CalculatorConfig } from '../../../src/types/calculator';
import { seedDefaults } from '../../../src/lib/initialForm';
import { TAX_YEAR } from '../../../src/utils/taxData';
import rental from '../../../src/calculators/finance/rental-property';
import retirement from '../../../src/calculators/finance/retirement';
import rmd from '../../../src/calculators/finance/rmd';
import roth from '../../../src/calculators/finance/roth-ira';
import salaryCalc from '../../../src/calculators/finance/salary-calculator';
import salaryHourly from '../../../src/calculators/finance/salary-hourly';
import salaryTakeHome from '../../../src/calculators/finance/salary-take-home';
import salaryToHourly from '../../../src/calculators/finance/salary-to-hourly';
import salesTax from '../../../src/calculators/finance/sales-tax';
import seTax from '../../../src/calculators/finance/self-employment-tax';
import socialSecurity from '../../../src/calculators/finance/social-security';
import studentLoan from '../../../src/calculators/finance/student-loan';
import swp from '../../../src/calculators/finance/swp-calculator';
import taxCalc from '../../../src/calculators/finance/tax-calculator';
import texas from '../../../src/calculators/finance/texas-mortgage-calculator';
import tvm from '../../../src/calculators/finance/tvm-calculator';
import va from '../../../src/calculators/finance/va-mortgage';
import vat from '../../../src/calculators/finance/vat-calculator';

// Oracle: every pinned number below was computed independently in Python
// (decimal at 60 digits, fractions for the Social Security rules, bisection for
// the TVM rate, a month-by-month Decimal run for the SWP), run with `python -I`,
// not by re-running the calculators. Federal brackets and the standard deduction
// are the 2026 figures the calculators hold (utils/taxData.ts); the state-tax
// figures come from the calculator's own state engine, so those steps are only
// checked against the calculator's own result rows.

const defaults = (c: CalculatorConfig) => seedDefaults(c.inputs);
const blank = (c: CalculatorConfig) => Object.fromEntries(c.inputs.map((i) => [i.id, '']));
const steps = (c: CalculatorConfig, v: Record<string, string>) => c.explainSteps!(v);
const resultValue = (c: CalculatorConfig, v: Record<string, string>, id: string) =>
  c.calculate(v).find((r) => r.id === id)!.value;

/** One array of required substrings per step; the step count must match exactly. */
function expectSteps(c: CalculatorConfig, v: Record<string, string>, expected: string[][]) {
  const out = steps(c, v);
  expect(out).toHaveLength(expected.length);
  expected.forEach((subs, i) => {
    for (const s of subs) expect(out[i].expr, `step ${i + 1} (${out[i].label})`).toContain(s);
  });
  for (const s of out) {
    expect(s.label.length).toBeGreaterThan(0);
    expect(`${s.label} ${s.expr} ${s.note ?? ''}`).not.toMatch(/NaN|Infinity|undefined/);
  }
}

describe('explainSteps - finance batch F3', () => {
  describe('rental-property', () => {
    const base = {
      purchasePrice: '350000', downPayment: '70000', closingCosts: '10000', interestRate: '7.25', loanTerm: '30',
      monthlyRent: '2500', vacancyRate: '5', propertyTaxState: 'custom', propertyTax: '4200', insurance: '1800',
      hoaFees: '0', maintenancePct: '10', propertyMgmtPct: '8',
    };
    it('demo values match the pinned case and the headline cash flow', () => {
      expect(defaults(rental)).toMatchObject(base);
      const out = steps(rental, defaults(rental));
      expect(out.at(-1)!.expr).toContain(resultValue(rental, defaults(rental), 'monthlyCashFlow'));
      expect(out.at(-1)!.expr).toContain(resultValue(rental, defaults(rental), 'cashOnCash'));
    });
    it('pins every step (custom tax, with a loan)', () => {
      expectSteps(rental, base, [
        ['Loan = $350,000.00 price − $70,000.00 down = $280,000.00', 'Cash invested = $70,000.00 down + $10,000.00 closing and repairs = $80,000.00'],
        ['n = 30 years × 12 = 360', '(1 + r)ⁿ = 8.7448', '= $1,910.09/month'],
        ['Gross rent = $2,500.00 × 12 = $30,000.00', 'Vacancy 5% × $30,000.00 = −$1,500.00', 'Effective rent = $28,500.00'],
        ['Property tax (as entered) = $4,200.00', 'Insurance = $1,800.00', 'Maintenance = 10% × $30,000.00 gross rent = $3,000.00', 'Management = 8% × $28,500.00 effective rent = $2,280.00', 'Total = $11,280.00'],
        ['NOI = $28,500.00 − $11,280.00 = $17,220.00/yr', 'Cap rate = $17,220.00 ÷ $350,000.00 × 100 = 4.92%'],
        ['($1,910.09 × 12 = $22,921.12) = 0.75x', 'GRM = $350,000.00 ÷ $30,000.00 = 11.7x'],
        ['Annual cash flow = $17,220.00 − $22,921.12 debt service = -$5,701.12', '÷ 12 = -$475.09/month', 'Cash-on-cash = -$5,701.12 ÷ $80,000.00 × 100 = -7.13%'],
      ]);
    });
    it('state average tax rate and HOA', () => {
      const v = { ...base, propertyTaxState: 'al', propertyTax: '', hoaFees: '150' };
      expectSteps(rental, v, [
        ['= $280,000.00'],
        ['$1,910.09/month'],
        ['Effective rent = $28,500.00'],
        ['Property tax = $350,000.00 × 0.41% (Alabama average rate) = $1,435.00', 'HOA = $150.00 × 12 = $1,800.00', 'Total = $10,315.00'],
        ['NOI = $28,500.00 − $10,315.00 = $18,185.00/yr', '= 5.20%'],
        ['= 0.79x'],
        ['-$4,736.12', '-$394.68/month', '= -5.92%'],
      ]);
    });
    it('no loan: no mortgage, DSCR not defined', () => {
      const v = { ...base, downPayment: '200000', purchasePrice: '200000', closingCosts: '0', interestRate: '5', monthlyRent: '2000', vacancyRate: '0', propertyTax: '2400', insurance: '1200', propertyMgmtPct: '0' };
      expectSteps(rental, v, [
        ['Loan = $200,000.00 price − $200,000.00 down = $0.00', 'Cash invested = $200,000.00 down + $0.00 closing and repairs = $200,000.00'],
        ['Loan = $0.00, so the monthly mortgage payment is $0.00'],
        ['Gross rent = $2,000.00 × 12 = $24,000.00', 'Vacancy 0% × $24,000.00 = −$0.00', 'Effective rent = $24,000.00'],
        ['Total = $6,000.00'],
        ['NOI = $24,000.00 − $6,000.00 = $18,000.00/yr', '= 9.00%'],
        ['DSCR: not defined without a loan', 'GRM = $200,000.00 ÷ $24,000.00 = 8.3x'],
        ['Annual cash flow = $18,000.00 − $0.00 debt service = $18,000.00', '÷ 12 = $1,500.00/month', 'Cash-on-cash = $18,000.00 ÷ $200,000.00 × 100 = 9.00%'],
      ]);
    });
    it('0% interest spreads the loan evenly', () => {
      const v = { ...base, purchasePrice: '240000', downPayment: '40000', closingCosts: '5000', interestRate: '0', loanTerm: '20', monthlyRent: '2000', propertyTax: '3000', insurance: '1200', propertyMgmtPct: '0' };
      expectSteps(rental, v, [
        ['= $200,000.00', '= $45,000.00'],
        ['M = $200,000.00 ÷ 240 payments = $833.33/month'],
        ['Effective rent = $22,800.00'],
        ['Total = $6,600.00'],
        ['$16,200.00/yr', '= 6.75%'],
        ['$10,000.00) = 1.62x', '= 10.0x'],
        ['= $6,200.00', '$516.67/month', '= 13.78%'],
      ]);
    });
    it('returns [] for blank / invalid input', () => {
      expect(steps(rental, blank(rental))).toEqual([]);
      expect(steps(rental, { ...base, purchasePrice: '0' })).toEqual([]);
      expect(steps(rental, { ...base, monthlyRent: '0' })).toEqual([]);
      expect(steps(rental, { ...base, downPayment: '400000' })).toEqual([]);
      expect(steps(rental, { ...base, interestRate: 'abc' })).toEqual([]);
    });
  });

  describe('retirement', () => {
    const base = { currentAge: '30', retirementAge: '65', currentSavings: '50000', monthlyContribution: '500', annualReturn: '7', inflationRate: '3', desiredIncome: '60000' };
    it('demo values and the shortfall path', () => {
      expect(defaults(retirement)).toMatchObject(base);
      expectSteps(retirement, base, [
        ['65 − 30 = 35 years = 420 months', '0.5833% per month'],
        ['(1 + 0.005833)^420 = 11.5062'],
        ['$50,000.00 × 11.5062 = $575,307.59'],
        ['$500.00 × (11.5062 − 1) ÷ 0.005833 = $900,527.30'],
        ['$575,307.59 + $900,527.30 = $1,475,834.89 (shown as $1.48M)'],
        ['Contributed = $50,000.00 + $500.00 × 420 = $260,000.00', 'Growth = $1,475,834.89 − $260,000.00 = $1,215,834.89'],
        ['Real return ≈ 7% − 3% inflation = 4%', '÷ (1 + 3%)^35 = $524,487'],
        ['$60,000.00 × (1 + 3%)^35 = $168,831.75 a year at retirement prices', '÷ 4% = $4,220,793.68'],
        ['$1,475,834.89 − $4,220,793.68 = −$2,744,958.79', 'gap shown as $2.74M'],
        ['= $2,024.08 → rounded up to $2,025/month'],
      ]);
      const out = steps(retirement, base);
      expect(out.at(-1)!.expr).toContain(resultValue(retirement, base, 'requiredContribution').replace('/month', ''));
      expect(out[6].note).toContain("today's dollars");
      expect(out[6].note).toContain('nominal');
    });
    it('on track: surplus and no contribution step', () => {
      const v = { ...base, currentSavings: '2000000' };
      expectSteps(retirement, v, [
        ['420 months'], ['11.5062'], ['$2,000,000.00 × 11.5062 = $23,012,303.68'], ['= $900,527.30'],
        ['$23,012,303.68 + $900,527.30 = $23,912,830.98 (shown as $23.91M)'],
        ['Contributed = $2,000,000.00 + $500.00 × 420 = $2,210,000.00', '= $21,702,830.98'],
        ['÷ (1 + 3%)^35 = $8.50M'],
        ['÷ 4% = $4,220,793.68'],
        ['$23,912,830.98 − $4,220,793.68 = +$19,692,037.30', 'surplus shown as $19.69M'],
      ]);
    });
    it('0% return adds balances; no income goal skips the goal steps', () => {
      const v = { currentAge: '40', retirementAge: '65', currentSavings: '10000', monthlyContribution: '200', annualReturn: '0', inflationRate: '2', desiredIncome: '' };
      expectSteps(retirement, v, [
        ['65 − 40 = 25 years = 300 months', '0.0000% per month'],
        ['$10,000.00 + $200.00 × 300 months = $70,000'],
        ['Contributed = $10,000.00 + $200.00 × 300 = $70,000.00', 'Growth = $70,000.00 − $70,000.00 = $0.00'],
        ['Real return ≈ 0% − 2% inflation = -2%', '= $42,667'],
      ]);
    });
    it('explicit 0% inflation is respected', () => {
      const v = { currentAge: '60', retirementAge: '65', currentSavings: '100000', monthlyContribution: '1000', annualReturn: '5', inflationRate: '0', desiredIncome: '50000' };
      expectSteps(retirement, v, [
        ['5 years = 60 months', '0.4167% per month'],
        ['= 1.2834'],
        ['$100,000.00 × 1.2834 = $128,335.87'],
        ['= $68,006.08'],
        ['= $196,341.95'],
        ['= $36,341.95'],
        ['÷ (1 + 0%)^5 = $196,342'],
        ['$50,000.00 × (1 + 0%)^5 = $50,000.00 a year', '÷ 4% = $1,250,000.00'],
        ['−$1,053,658.05'],
        ['= $16,493.59 → rounded up to $16,494/month'],
      ]);
    });
    it('returns [] for blank / invalid input', () => {
      expect(steps(retirement, blank(retirement))).toEqual([]);
      expect(steps(retirement, { ...base, retirementAge: '30' })).toEqual([]);
      expect(steps(retirement, { ...base, retirementAge: '20' })).toEqual([]);
      expect(steps(retirement, { ...base, annualReturn: '' })).toEqual([]);
      expect(steps(retirement, { ...base, currentAge: 'abc' })).toEqual([]);
    });
  });

  describe('rmd', () => {
    const at = (age: number, extra: Record<string, string> = {}) => ({
      birthYear: String(TAX_YEAR - age), accountBalance: '500000', spouseToggle: 'no', spouseAge: '', expectedReturn: '6', ...extra,
    });
    it('Uniform Lifetime table, age 76', () => {
      expectSteps(rmd, at(76), [
        [`${TAX_YEAR} − ${TAX_YEAR - 76} = age 76`],
        ['Table III (Uniform Lifetime), age 76: distribution period 23.7'],
        ['$500,000.00 ÷ 23.7 = $21,097.05'],
        ['$21,097.05 ÷ $500,000.00 × 100 = 4.22%', '25% × $21,097.05 = $5,274.26'],
      ]);
      expect(steps(rmd, at(76))[2].expr).toContain(resultValue(rmd, at(76), 'currentRmd'));
    });
    it('Uniform Lifetime table, age 73', () => {
      expectSteps(rmd, at(73), [
        ['age 73'],
        ['age 73: distribution period 26.5'],
        ['$500,000.00 ÷ 26.5 = $18,867.92'],
        ['= 3.77%', '= $4,716.98'],
      ]);
    });
    it('Joint Life table for a spouse more than 10 years younger', () => {
      const v = at(76, { spouseToggle: 'yes', spouseAge: '60' });
      expectSteps(rmd, v, [
        ['age 76'],
        ['Table II (Joint Life and Last Survivor), owner age 76, spouse age 60: distribution period 28.2'],
        ['$500,000.00 ÷ 28.2 = $17,730.50'],
        ['= 3.55%', '= $4,432.62'],
      ]);
    });
    it('falls back to the Uniform table when the spouse is not 10+ years younger', () => {
      const out = steps(rmd, at(76, { spouseToggle: 'yes', spouseAge: '70' }));
      expect(out[1].expr).toContain('distribution period 23.7');
      expect(out[1].expr).toContain('Table II did not apply');
      expect(out[2].expr).toContain('$21,097.05');
    });
    it('returns [] when no RMD is due yet, and for blank / invalid input', () => {
      expect(steps(rmd, at(60))).toEqual([]);
      expect(steps(rmd, blank(rmd))).toEqual([]);
      expect(steps(rmd, at(76, { accountBalance: '0' }))).toEqual([]);
      expect(steps(rmd, at(76, { accountBalance: '' }))).toEqual([]);
      expect(steps(rmd, at(76, { birthYear: '' }))).toEqual([]);
      expect(steps(rmd, at(76, { spouseToggle: 'yes', spouseAge: '' }))).toEqual([]);
      expect(() => steps(rmd, defaults(rmd))).not.toThrow();
    });
  });

  describe('roth-ira', () => {
    const base = { currentAge: '30', retirementAge: '65', currentBalance: '15000', annualContribution: '7500', annualReturn: '7.00', marginalTaxRate: '10', expectedRetirementTaxRate: '10' };
    it('demo values, pinned', () => {
      expect(defaults(roth)).toMatchObject(base);
      expectSteps(roth, base, [
        [`65 − 30 = 35 years`, `Limit at age 30: $7,500 (${TAX_YEAR})`, 'Contribution = min($7,500, $7,500) = $7,500 a year'],
        ['(1 + 7%)^35 = 10.6766'],
        ['$15,000.00 × 10.6766 = $160,148.72'],
        ['$7,500.00 × (10.6766 − 1) ÷ 7% = $1,036,776.59'],
        ['$160,148.72 + $1,036,776.59 = $1,196,925.31 (shown as $1.20M)'],
        ['Contributed = $15,000.00 + $7,500.00 × 35 = $277,500.00', 'Growth = $1,196,925.31 − $277,500.00 = $919,425.31'],
        ['$919,425.31 × 10% expected retirement tax rate = $91,943'],
        ['$1,196,925.31 × (1 − 10%) ÷ (1 − 10%) = $1,196,925.31 after tax', 'Roth minus Traditional = +$0.00'],
      ]);
      expect(steps(roth, base)[6].expr).toContain(resultValue(roth, base, 'taxSavingsVsTraditional'));
    });
    it('over the limit, age 50+, Traditional comes out ahead', () => {
      const v = { currentAge: '52', retirementAge: '62', currentBalance: '0', annualContribution: '12000', annualReturn: '6', marginalTaxRate: '22', expectedRetirementTaxRate: '12' };
      expectSteps(roth, v, [
        ['62 − 52 = 10 years', 'Limit at age 52: $8,600', 'Contribution = min($12,000, $8,600) = $8,600 a year'],
        ['(1 + 6%)^10 = 1.7908'],
        ['$0.00 × 1.7908 = $0.00'],
        ['$8,600.00 × (1.7908 − 1) ÷ 6% = $113,354.84'],
        ['= $113,354.84'],
        ['Contributed = $0.00 + $8,600.00 × 10 = $86,000.00', '= $27,354.84'],
        ['$27,354.84 × 12% expected retirement tax rate = $3,283'],
        ['$113,354.84 × (1 − 12%) ÷ (1 − 22%) = $127,887.51 after tax', 'Roth minus Traditional = −$14,532.67'],
      ]);
    });
    it('Roth ahead when retirement rate is higher; 0% return', () => {
      const v = { currentAge: '40', retirementAge: '65', currentBalance: '20000', annualContribution: '7500', annualReturn: '7', marginalTaxRate: '12', expectedRetirementTaxRate: '22' };
      const out = steps(roth, v);
      expect(out[4].expr).toContain('= $582,916.44');
      expect(out[7].expr).toContain('= $516,675.93 after tax');
      expect(out[7].expr).toContain('+$66,240.50');
      const z = { currentAge: '25', retirementAge: '30', currentBalance: '1000', annualContribution: '3000', annualReturn: '0', marginalTaxRate: '24', expectedRetirementTaxRate: '24' };
      expectSteps(roth, z, [
        ['5 years'], ['(1 + 0%)^5 = 1.0000'], ['$1,000.00 × 1.0000 = $1,000.00'], ['$3,000.00 × 5 years = $15,000.00'],
        ['= $16,000.00'], ['= $16,000.00', 'Growth = $16,000.00 − $16,000.00 = $0.00'], ['= $0'], ['Roth minus Traditional = +$0.00'],
      ]);
    });
    it('returns [] for blank / invalid input', () => {
      expect(steps(roth, blank(roth))).toEqual([]);
      expect(steps(roth, { ...base, retirementAge: '30' })).toEqual([]);
      expect(steps(roth, { ...base, annualReturn: '' })).toEqual([]);
      expect(steps(roth, { ...base, currentAge: 'abc' })).toEqual([]);
    });
  });

  describe('salary-calculator', () => {
    const base = { salaryAmount: '35', payFrequency: 'hourly', hoursPerWeek: '40', daysPerWeek: '5' };
    it('hourly pay, demo values', () => {
      expect(defaults(salaryCalc)).toMatchObject(base);
      expectSteps(salaryCalc, base, [
        ['$35.00 × 40 hours × 52 weeks = $72,800.00'],
        ['Hourly = $72,800.00 ÷ (40 hours × 52 weeks) = $35.00/hr', 'Daily = $72,800.00 ÷ (5 days × 52 weeks) = $280.00/day'],
        ['Weekly = $72,800.00 ÷ 52 = $1,400/wk', 'Bi-weekly = $72,800.00 ÷ 26 = $2,800/paycheck', 'Monthly = $72,800.00 ÷ 12 = $6,067/mo'],
        ['max(0, $72,800.00 − $16,100.00) = $56,700.00 taxable income'],
        ['10% × $12,400.00 = $1,240.00 + 12% × $38,000.00 = $4,560.00 + 22% × $6,300.00 = $1,386.00 = $7,186.00 (top bracket 22%)'],
        ['min($72,800.00, $184,500.00) × 6.2% = $4,513.60', 'Medicare: $72,800.00 × 1.45% = $1,055.60', '= $0.00 → $5,569.20'],
        ['$72,800.00 − $7,186.00 federal − $5,569.20 FICA = $60,044.80', '~$60,045/year', '~$2,309/paycheck'],
      ]);
      expect(steps(salaryCalc, base).at(-1)!.expr).toContain(resultValue(salaryCalc, base, 'netAnnual'));
    });
    it('monthly pay', () => {
      const v = { ...base, salaryAmount: '5000', payFrequency: 'monthly' };
      expectSteps(salaryCalc, v, [
        ['$5,000.00 × 12 months = $60,000.00'],
        ['Hourly = $60,000.00 ÷ (40 hours × 52 weeks) = $28.85/hr'],
        ['Monthly = $60,000.00 ÷ 12 = $5,000/mo'],
        ['= $43,900.00 taxable income'],
        ['10% × $12,400.00 = $1,240.00 + 12% × $31,500.00 = $3,780.00 = $5,020.00 (top bracket 12%)'],
        ['→ $4,590.00'],
        ['= $50,390.00', '~$1,938/paycheck'],
      ]);
    });
    it('semi-monthly and daily conversions', () => {
      expect(steps(salaryCalc, { ...base, salaryAmount: '2500', payFrequency: 'semimonthly' })[0].expr).toContain('$2,500.00 × 24 pay periods = $60,000.00');
      expect(steps(salaryCalc, { ...base, salaryAmount: '280', payFrequency: 'daily' })[0].expr).toContain('$280.00 × 5 days × 52 weeks = $72,800.00');
    });
    it('high salary reaches the Social Security cap, Additional Medicare and higher brackets', () => {
      const v = { ...base, salaryAmount: '250000', payFrequency: 'annually' };
      expectSteps(salaryCalc, v, [
        ['$250,000.00 is already a yearly figure = $250,000.00'],
        ['Hourly = $250,000.00 ÷ (40 hours × 52 weeks) = $120.19/hr'],
        ['Weekly = $250,000.00 ÷ 52 = $4,808/wk'],
        ['max(0, $250,000.00 − $16,100.00) = $233,900.00'],
        ['22% × $55,300.00 = $12,166.00 + 24% × $96,075.00 = $23,058.00 + 32% × $32,125.00 = $10,280.00 = $51,304.00 (top bracket 32%)'],
        ['min($250,000.00, $184,500.00) × 6.2% = $11,439.00', 'Medicare: $250,000.00 × 1.45% = $3,625.00', '× 0.9% = $450.00', '→ $15,514.00'],
        ['= $183,182.00'],
      ]);
    });
    it('income under the standard deduction owes no federal tax', () => {
      const v = { ...base, salaryAmount: '1000', payFrequency: 'monthly' };
      const out = steps(salaryCalc, v);
      expect(out[3].expr).toContain('= $0.00 taxable income');
      expect(out[4].expr).toContain('No taxable income, federal tax = $0.00');
      expect(out[5].expr).toContain('→ $918.00');
      expect(out[6].expr).toContain('= $11,082.00');
    });
    it('returns [] for blank / invalid input', () => {
      expect(steps(salaryCalc, blank(salaryCalc))).toEqual([]);
      expect(steps(salaryCalc, { ...base, salaryAmount: '0' })).toEqual([]);
      expect(steps(salaryCalc, { ...base, salaryAmount: 'abc' })).toEqual([]);
      expect(steps(salaryCalc, { ...base, salaryAmount: '-5' })).toEqual([]);
    });
  });

  describe('salary-hourly', () => {
    const base = { annualSalary: '80000', hoursPerWeek: '40', trueHourlyToggle: 'no' };
    it('standard conversion, demo values', () => {
      expect(defaults(salaryHourly)).toMatchObject(base);
      expectSteps(salaryHourly, base, [
        ['40 hours a week × 52 weeks = 2080 hours'],
        ['$80,000.00 ÷ 2080 = $38.46 per hour'],
        ['Weekly = $80,000.00 ÷ 52 = $1,538.46', 'Bi-weekly = $80,000.00 ÷ 26 = $3,076.92', 'Monthly = $80,000.00 ÷ 12 = $6,666.67'],
      ]);
    });
    it('true hourly rate with commute, overtime and PTO', () => {
      const v = { ...base, trueHourlyToggle: 'yes', commuteHoursPerDay: '1', commuteCostPerDay: '10', unpaidOvertimeHours: '2', paidTimeOff: '15' };
      expectSteps(salaryHourly, v, [
        ['2080 hours'], ['$38.46 per hour'], ['$6,666.67'],
        ['52 − 15 PTO days ÷ 5 = 49 working weeks'],
        ['40 work + 1 commute × 5 days + 2 unpaid overtime = 47 hours', '× 49 weeks = 2303 hrs'],
        ['$10.00 × 5 days × 49 weeks = $2,450.00 a year'],
        ['($80,000.00 − $2,450.00) ÷ 2303 hours = $33.67 per hour'],
      ]);
      expect(steps(salaryHourly, v).at(-1)!.expr).toContain(resultValue(salaryHourly, v, 'trueHourly'));
    });
    it('keeps only the standard steps when the true rate cannot be computed', () => {
      const v = { ...base, trueHourlyToggle: 'yes', commuteHoursPerDay: '1', commuteCostPerDay: '10', unpaidOvertimeHours: '0', paidTimeOff: '260' };
      expect(steps(salaryHourly, v)).toHaveLength(3);
    });
    it('returns [] for blank / invalid input', () => {
      expect(steps(salaryHourly, blank(salaryHourly))).toEqual([]);
      expect(steps(salaryHourly, { ...base, annualSalary: '0' })).toEqual([]);
      expect(steps(salaryHourly, { ...base, hoursPerWeek: '0' })).toEqual([]);
      expect(steps(salaryHourly, { ...base, hoursPerWeek: 'abc' })).toEqual([]);
    });
  });

  describe('salary-to-hourly', () => {
    const base = { salary: '65000', hoursPerWeek: '40', weeksPerYear: '52' };
    it('full year, demo values', () => {
      expect(defaults(salaryToHourly)).toMatchObject(base);
      expectSteps(salaryToHourly, base, [
        ['40 hours a week × 52 weeks = 2080 hours'],
        ['$65,000.00 ÷ 2080 = $31.25 per hour'],
        ['$31.25 × 40 hours ÷ 5 days = $250.00'],
        ['Weekly = $65,000.00 ÷ 52 weeks = $1,250.00', 'Monthly = $65,000.00 ÷ 12 = $5,416.67'],
      ]);
    });
    it('unpaid weeks raise the rate', () => {
      expectSteps(salaryToHourly, { ...base, weeksPerYear: '50' }, [
        ['× 50 weeks = 2000 hours'], ['= $32.50 per hour'], ['= $260.00'], ['= $1,300.00', '= $5,416.67'],
      ]);
    });
    it('fractional hours', () => {
      expectSteps(salaryToHourly, { salary: '90000', hoursPerWeek: '37.5', weeksPerYear: '48' }, [
        ['37.5 hours a week × 48 weeks = 1800 hours'], ['$90,000.00 ÷ 1800 = $50.00 per hour'], ['$50.00 × 37.5 hours ÷ 5 days = $375.00'],
        ['= $1,875.00', '= $7,500.00'],
      ]);
    });
    it('returns [] for blank / invalid input', () => {
      expect(steps(salaryToHourly, blank(salaryToHourly))).toEqual([]);
      expect(steps(salaryToHourly, { ...base, salary: '0' })).toEqual([]);
      expect(steps(salaryToHourly, { ...base, hoursPerWeek: '0' })).toEqual([]);
      expect(steps(salaryToHourly, { ...base, weeksPerYear: '0' })).toEqual([]);
      expect(steps(salaryToHourly, { ...base, salary: 'abc' })).toEqual([]);
    });
  });

  describe('salary-take-home', () => {
    const base = { annualSalary: '75000', filingStatus: 'single', state: 'none', payFrequency: 'monthly', preTaxDeductions: '10' };
    it('single filer, 10% pre-tax, no state tax (demo values)', () => {
      expect(defaults(salaryTakeHome)).toMatchObject(base);
      expectSteps(salaryTakeHome, base, [
        ['$75,000.00 salary × 10% pre-tax = $7,500.00', 'Income-tax wages = $75,000.00 − $7,500.00 = $67,500.00'],
        ['max(0, $67,500.00 − $16,100.00) = $51,400.00 federal taxable income'],
        ['10% × $12,400.00 = $1,240.00 + 12% × $38,000.00 = $4,560.00 + 22% × $1,000.00 = $220.00 = $6,020.00 (top bracket 22%)'],
        ['min($75,000.00, $184,500.00) × 6.2% = $4,650.00', 'Medicare: $75,000.00 × 1.45% = $1,087.50', '→ $5,737.50'],
        ['No state wage tax applied'],
        ['$75,000.00 − $6,020.00 federal − $5,737.50 FICA − $0.00 state − $7,500.00 pre-tax savings = $55,742.50 a year'],
        ['$55,742.50 ÷ 12 = $4,645.21'],
      ]);
      expect(steps(salaryTakeHome, base).at(-1)!.expr).toContain(resultValue(salaryTakeHome, base, 'perPaycheck'));
      expect(steps(salaryTakeHome, base)[5].note).toContain('15.7%');
    });
    it('married filing jointly, no pre-tax, bi-weekly', () => {
      const v = { annualSalary: '150000', filingStatus: 'mfj', state: 'none', payFrequency: 'bi-weekly', preTaxDeductions: '0' };
      const out = steps(salaryTakeHome, v);
      expect(out).toHaveLength(7);
      expect(out[0].expr).toContain('No pre-tax deductions, so income-tax wages = $150,000.00');
      expect(out[1].label).toContain('married filing jointly');
      expect(out[1].expr).toContain('max(0, $150,000.00 − $32,200.00) = $117,800.00');
      expect(out[2].expr).toContain('10% × $24,800.00 = $2,480.00 + 12% × $76,000.00 = $9,120.00 + 22% × $17,000.00 = $3,740.00 = $15,340.00 (top bracket 22%)');
      expect(out[3].expr).toContain('min($150,000.00, $184,500.00) × 6.2% = $9,300.00');
      expect(out[3].expr).toContain('Medicare: $150,000.00 × 1.45% = $2,175.00');
      expect(out[3].expr).toContain('→ $11,475.00');
      expect(out[5].expr).toContain('= $123,185.00 a year');
      expect(out[6].expr).toContain('$123,185.00 ÷ 26 = $4,737.88');
    });
    it('state tax step quotes the calculator row and states the method only', () => {
      const v = { ...base, state: 'CA', preTaxDeductions: '0' };
      const out = steps(salaryTakeHome, v);
      expect(out[4].label).toContain('California');
      expect(out[4].expr).toContain(resultValue(salaryTakeHome, v, 'totalStateTax'));
      expect(out[4].expr).toContain('rate schedule and standard deduction applied to $75,000.00 of wages');
      expect(out[5].expr).toContain(resultValue(salaryTakeHome, v, 'netAnnual'));
    });
    it('returns [] for blank / invalid input', () => {
      expect(steps(salaryTakeHome, blank(salaryTakeHome))).toEqual([]);
      expect(steps(salaryTakeHome, { ...base, annualSalary: '0' })).toEqual([]);
      expect(steps(salaryTakeHome, { ...base, annualSalary: 'abc' })).toEqual([]);
      expect(steps(salaryTakeHome, { ...base, annualSalary: '-100' })).toEqual([]);
    });
  });

  describe('tax-calculator', () => {
    const base = { annualIncome: '75000', filingStatus: 'Single', preTaxDeductions: '0', withholding: '0' };
    it('single filer, demo values, balance due', () => {
      expect(defaults(taxCalc)).toMatchObject(base);
      expectSteps(taxCalc, base, [
        ['max(0, $75,000.00 − $16,100.00 standard deduction (single) − $0.00 pre-tax) = $58,900.00 taxable income'],
        ['10% × $12,400.00 = $1,240.00 + 12% × $38,000.00 = $4,560.00 + 22% × $8,500.00 = $1,870.00 = $7,670.00'],
        ['Effective = $7,670.00 ÷ $75,000.00 × 100 = 10.23%', 'Marginal = rate of the top bracket reached = 22.00%'],
        ['$7,670.00 − $0.00 withheld = $7,670.00'],
      ]);
      expect(steps(taxCalc, base)[3].label).toContain('balance due');
    });
    it('refund when more was withheld', () => {
      const v = { ...base, withholding: '9000' };
      const out = steps(taxCalc, v);
      expect(out[3].label).toContain('refund');
      expect(out[3].expr).toContain('$7,670.00 − $9,000.00 withheld = −$1,330.00');
    });
    it('married filing jointly with pre-tax deductions', () => {
      const v = { annualIncome: '150000', filingStatus: 'Married Filing Jointly', preTaxDeductions: '10000', withholding: '20000' };
      expectSteps(taxCalc, v, [
        ['max(0, $150,000.00 − $32,200.00 standard deduction (married filing jointly) − $10,000.00 pre-tax) = $107,800.00'],
        ['10% × $24,800.00 = $2,480.00 + 12% × $76,000.00 = $9,120.00 + 22% × $7,000.00 = $1,540.00 = $13,140.00'],
        ['= 8.76%', '= 22.00%'],
        ['$13,140.00 − $20,000.00 withheld = −$6,860.00'],
      ]);
    });
    it('income under the deduction has no taxable income', () => {
      const out = steps(taxCalc, { ...base, annualIncome: '10000' });
      expect(out[0].expr).toContain('= $0.00 taxable income');
      expect(out[1].expr).toContain('No taxable income, tax = $0.00');
    });
    it('returns [] for blank / invalid input', () => {
      expect(steps(taxCalc, blank(taxCalc))).toEqual([]);
      expect(steps(taxCalc, { ...base, annualIncome: '-5' })).toEqual([]);
      expect(steps(taxCalc, { ...base, annualIncome: 'abc' })).toEqual([]);
    });
  });

  describe('self-employment-tax', () => {
    const base = { netProfit: '100000', w2Income: '0', filingStatus: 'single', qbiDeduction: 'yes' };
    it('demo values, pinned', () => {
      expect(defaults(seTax)).toMatchObject(base);
      expectSteps(seTax, base, [
        ['$100,000.00 × 92.35% = $92,350.00'],
        ['Wage base left = $184,500.00 − $0.00 W-2 wages = $184,500.00', 'min($92,350.00, $184,500.00) × 12.4% = $11,451.40'],
        ['$92,350.00 × 2.9% = $2,678.15'],
        ['$11,451.40 + $2,678.15 = $14,129.55', '= 14.13%'],
        ['max(0, $92,350.00 − max(0, $200,000.00 − $0.00)) × 0.9% = $0.00'],
        ['$14,129.55 ÷ 2 = $7,064.78'],
        ['($100,000.00 − $7,064.78) × 20% = $18,587.05 deduction', '× 22% assumed bracket = $4,089.15'],
      ]);
      expect(steps(seTax, base)[3].expr).toContain(resultValue(seTax, base, 'secaTax'));
    });
    it('W-2 wages use up the wage base; QBI off drops the last step', () => {
      const v = { ...base, w2Income: '150000', qbiDeduction: 'no' };
      const out = steps(seTax, v);
      expect(out).toHaveLength(6);
      expect(out[1].expr).toContain('Wage base left = $184,500.00 − $150,000.00 W-2 wages = $34,500.00');
      expect(out[1].expr).toContain('min($92,350.00, $34,500.00) × 12.4% = $4,278.00');
      expect(out[2].expr).toContain('= $2,678.15');
      expect(out[3].expr).toContain('$4,278.00 + $2,678.15 = $6,956.15');
      expect(out[4].expr).toContain('max(0, $92,350.00 − max(0, $200,000.00 − $150,000.00)) × 0.9% = $381.15');
    });
    it('earnings above the wage base and the Additional Medicare threshold', () => {
      const v = { ...base, netProfit: '250000' };
      const out = steps(seTax, v);
      expect(out[0].expr).toContain('= $230,875.00');
      expect(out[1].expr).toContain('min($230,875.00, $184,500.00) × 12.4% = $22,878.00');
      expect(out[2].expr).toContain('= $6,695.38');
      expect(out[3].expr).toContain('= $29,573.38');
      expect(out[4].expr).toContain('× 0.9% = $277.88');
      expect(out[5].expr).toContain('$29,573.38 ÷ 2 = $14,786.69');
      expect(out[6].expr).toContain('= $47,042.66 deduction');
      expect(out[6].expr).toContain('= $10,349.39');
    });
    it('married filing separately uses the $125,000 threshold', () => {
      const v = { netProfit: '300000', w2Income: '100000', filingStatus: 'mfs', qbiDeduction: 'no' };
      const out = steps(seTax, v);
      expect(out[1].expr).toContain('Wage base left = $184,500.00 − $100,000.00 W-2 wages = $84,500.00');
      expect(out[1].expr).toContain('= $10,478.00');
      expect(out[2].expr).toContain('= $8,034.45');
      expect(out[3].expr).toContain('$18,512.45');
      expect(out[4].expr).toContain('max(0, $277,050.00 − max(0, $125,000.00 − $100,000.00)) × 0.9% = $2,268.45');
    });
    it('under $400 of earnings owes nothing', () => {
      const out = steps(seTax, { ...base, netProfit: '400' });
      expect(out).toHaveLength(2);
      expect(out[0].expr).toContain('$400.00 × 92.35% = $369.40');
      expect(out[1].expr).toContain('$369.40 is under $400.00');
    });
    it('returns [] for blank / invalid input', () => {
      expect(steps(seTax, blank(seTax))).toEqual([]);
      expect(steps(seTax, { ...base, netProfit: '0' })).toEqual([]);
      expect(steps(seTax, { ...base, netProfit: '-1000' })).toEqual([]);
      expect(steps(seTax, { ...base, netProfit: 'abc' })).toEqual([]);
    });
  });

  describe('social-security', () => {
    const base = { birthYear: '1965', annualIncome: '85000', maritalStatus: 'single', retirementAge: '67', spouseIncome: '60000' };
    const pia = ['90% × $1,286.00 + 32% × $5,797.33 + 15% × $0.00 = $1,157.40 + $1,855.15 + $0.00 = $3,012.55 → $3,012.50'];
    it('claiming at full retirement age (demo values)', () => {
      expect(defaults(socialSecurity)).toMatchObject(base);
      expectSteps(socialSecurity, base, [
        ['min($85,000.00, $184,500.00 taxable maximum) ÷ 12 = $7,083.33 a month'],
        pia,
        ['full retirement age 67'],
        ['No reduction and no credit'],
        ['$3,012.50 × 1 = $3,012.50 → rounded down to $3,012/mo', '$36,144 a year'],
        ['At 62: $2,108/mo (70% of FRA benefit)', 'At 70: $3,735/mo (124% of FRA benefit)'],
        ['Age 79'],
      ]);
      expect(steps(socialSecurity, base)[4].expr).toContain(resultValue(socialSecurity, base, 'chosen'));
    });
    it('claiming at 62 cuts 30%', () => {
      const v = { ...base, retirementAge: '62' };
      expectSteps(socialSecurity, v, [
        ['$7,083.33 a month'],
        pia,
        ['full retirement age 67'],
        ['36 months × 5/9% + 24 months × 5/12% = 30% less → factor 70% of the PIA'],
        ['$3,012.50 × 0.7 = $2,108.75 → rounded down to $2,108/mo', '$25,296 a year'],
        ['At 62: $2,108/mo'],
      ]);
      expect(steps(socialSecurity, v)[3].label).toContain('60 months early');
    });
    it('claiming at 64 and 70', () => {
      const v64 = steps(socialSecurity, { ...base, retirementAge: '64' });
      expect(v64[3].expr).toContain('36 months × 5/9% = 20% less → factor 80% of the PIA');
      expect(v64[4].expr).toContain('$3,012.50 × 0.8 = $2,410.00 → rounded down to $2,410/mo');
      expect(v64.at(-1)!.expr).toContain('Age 78');
      const v70 = steps(socialSecurity, { ...base, retirementAge: '70' });
      expect(v70[3].label).toContain('Waiting 36 months past full retirement age');
      expect(v70[3].expr).toContain('36 months × 8% ÷ 12 = +24% → factor 124% of the PIA');
      expect(v70[4].expr).toContain('$3,012.50 × 1.24 = $3,735.50 → rounded down to $3,735/mo');
      expect(v70.at(-1)!.expr).toContain('Age 80');
    });
    it('fractional full retirement age (born 1955)', () => {
      const v = { ...base, birthYear: '1955', retirementAge: '66' };
      const out = steps(socialSecurity, v);
      expect(out[2].expr).toContain('full retirement age 66 and 2 months');
      expect(out[3].label).toContain('2 months early');
      expect(out[3].expr).toContain('2 months × 5/9% = 1.1111% less → factor 98.8889% of the PIA');
      expect(out[4].expr).toContain('$3,012.50 × 0.988889 = $2,979.03 → rounded down to $2,979/mo');
    });
    it('income above the taxable maximum caps the PIA', () => {
      const out = steps(socialSecurity, { ...base, annualIncome: '400000' });
      expect(out[0].expr).toContain('min($400,000.00, $184,500.00 taxable maximum) ÷ 12 = $15,375.00 a month');
      expect(out[1].expr).toContain('90% × $1,286.00 + 32% × $6,463.00 + 15% × $7,626.00 = $1,157.40 + $2,068.16 + $1,143.90 = $4,369.46 → $4,152.00');
      expect(out[1].note).toContain('capped at the maximum of $4,152.00');
    });
    it('married adds the spousal benefit step', () => {
      const out = steps(socialSecurity, { ...base, maritalStatus: 'married' });
      expect(out.at(-1)!.label).toBe('Spousal benefit');
      expect(out.at(-1)!.expr).toContain('50% × $3,012.50 = $1,506.25 → Up to $1,506/mo');
    });
    it('returns [] for blank / invalid input', () => {
      expect(steps(socialSecurity, blank(socialSecurity))).toEqual([]);
      expect(steps(socialSecurity, { ...base, birthYear: '1920' })).toEqual([]);
      expect(steps(socialSecurity, { ...base, retirementAge: 'abc' })).toEqual([]);
      expect(steps(socialSecurity, { ...base, annualIncome: '-1' })).toEqual([]);
    });
  });

  describe('student-loan', () => {
    const base = { loanBalance: '35000', interestRate: '6.52', repaymentTerm: '10', inSchool: 'no', monthsUntilGraduation: '', loanType: 'unsubsidized', gracePeriodMonths: '6' };
    it('already in repayment (demo values)', () => {
      expect(defaults(studentLoan)).toMatchObject({ loanBalance: '35000', interestRate: '6.52', repaymentTerm: '10', inSchool: 'no' });
      expectSteps(studentLoan, base, [
        ['r = 6.52% ÷ 12 = 0.5433% per month = 0.005433', 'n = 10 years × 12 = 120 payments'],
        ['(1 + r)ⁿ = 1.9160', '= $397.77/mo'],
        ['$397.77/mo (unrounded) × 120 = $47,732.90', '$47,732.90 − $35,000.00 = $12,732.90 (shown as $12,733)'],
        ['$35,000.00 + $0.00 capitalized + $12,732.90 repayment interest = $47,733'],
      ]);
    });
    it('in school with an unsubsidized loan capitalizes interest', () => {
      const v = { ...base, inSchool: 'yes', monthsUntilGraduation: '24' };
      expectSteps(studentLoan, v, [
        ['$35,000.00 × (6.52% ÷ 12) × (24 months in school + 6 grace) = $5,705.00'],
        ['$35,000.00 + $5,705.00 = $40,705.00 (shown as $40,705)'],
        ['0.005433', '120 payments'],
        ['M = $40,705.00', '= $462.61/mo'],
        ['× 120 = $55,513.36', '$55,513.36 − $40,705.00 = $14,808.36 (shown as $14,808)'],
        ['$35,000.00 + $5,705.00 capitalized + $14,808.36 repayment interest = $55,513'],
      ]);
      expect(steps(studentLoan, v)[3].expr).toContain(resultValue(studentLoan, v, 'monthlyPayment'));
    });
    it('in school with a subsidized loan: the government pays the interest', () => {
      const v = { ...base, inSchool: 'yes', monthsUntilGraduation: '24', loanType: 'subsidized' };
      const out = steps(studentLoan, v);
      expect(out).toHaveLength(6);
      expect(out[0].expr).toContain('= $5,705.00');
      expect(out[1].label).toContain('government pays that interest');
      expect(out[1].expr).toContain('$5,705.00 is covered, so repayment starts from $35,000.00');
      expect(out[3].expr).toContain('= $397.77/mo');
      expect(out[4].expr).toContain('$12,732.90');
    });
    it('no grace period, 20-year term', () => {
      const v = { loanBalance: '60000', interestRate: '8.07', repaymentTerm: '20', inSchool: 'yes', monthsUntilGraduation: '12', loanType: 'unsubsidized', gracePeriodMonths: '0' };
      const out = steps(studentLoan, v);
      expect(out[0].expr).toContain('(12 months in school + 0 grace) = $4,842.00');
      expect(out[1].expr).toContain('$64,842.00');
      expect(out[2].expr).toContain('r = 8.07% ÷ 12 = 0.6725% per month = 0.006725');
      expect(out[3].expr).toContain('(1 + r)ⁿ = 4.9958');
      expect(out[3].expr).toContain('= $545.19/mo');
      expect(out[4].expr).toContain('$66,004.25');
    });
    it('0% interest divides evenly', () => {
      const out = steps(studentLoan, { ...base, loanBalance: '12000', interestRate: '0' });
      expect(out[1].label).toContain('No interest');
      expect(out[1].expr).toContain('M = $12,000.00 ÷ 120 = $100.00/mo');
    });
    it('returns [] for blank / invalid input', () => {
      expect(steps(studentLoan, blank(studentLoan))).toEqual([]);
      expect(steps(studentLoan, { ...base, loanBalance: '0' })).toEqual([]);
      expect(steps(studentLoan, { ...base, interestRate: 'abc' })).toEqual([]);
      expect(steps(studentLoan, { ...base, loanBalance: '-100' })).toEqual([]);
    });
  });

  describe('swp-calculator', () => {
    const base = { corpus: '10000000', expectedReturn: '8', monthlyWithdrawal: '50000', withdrawalPeriod: '30' };
    it('corpus survives (demo values)', () => {
      expect(defaults(swp)).toMatchObject(base);
      expectSteps(swp, base, [
        ['i = 8% ÷ 12 = 0.6667% per month', '30 years × 12 = 360 months'],
        ['₹1,00,00,000.00 × (1 + 0.006667) = ₹1,00,66,666.67', '− ₹50,000.00 withdrawal = ₹1,00,16,666.67'],
        ['₹66,666.67 growth in month 1 ≥ ₹50,000.00 withdrawal'],
        ['₹50,000.00 × 360 months = ₹1.80Cr'],
        ['× 10.9357 − ₹50,000.00 × 1490.3594 = ₹3,48,39,324.14 (shown as ₹3.48Cr)'],
      ]);
      expect(steps(swp, base).at(-1)!.expr).toContain(resultValue(swp, base, 'finalValue'));
    });
    it('corpus runs out', () => {
      const v = { ...base, monthlyWithdrawal: '120000', withdrawalPeriod: '20' };
      expectSteps(swp, v, [
        ['240 months'],
        ['− ₹1,20,000.00 withdrawal = ₹99,46,666.67'],
        ['₹66,666.67 growth in month 1 < ₹1,20,000.00 withdrawal'],
        ['= 122.04 months'],
        ['₹1,20,000.00 × 122 full months + a final payment of ₹5,362.81 (all that was left) = ₹1.46Cr'],
      ]);
      expect(steps(swp, v).at(-1)!.note).toContain('123 months');
    });
    it('0% return: exact depletion and a leftover corpus', () => {
      const dep = steps(swp, { corpus: '1000000', expectedReturn: '0', monthlyWithdrawal: '25000', withdrawalPeriod: '5' });
      expect(dep[3].expr).toContain('n = ₹10,00,000.00 ÷ ₹25,000.00 = 40.00 months');
      expect(dep[4].expr).toContain('₹25,000.00 × 40 months = ₹10.00L');
      const left = steps(swp, { corpus: '1000000', expectedReturn: '0', monthlyWithdrawal: '10000', withdrawalPeriod: '5' });
      expect(left[4].expr).toContain('₹10,00,000.00 − ₹10,000.00 × 60 = ₹4,00,000.00 (shown as ₹4.00L)');
    });
    it('returns [] for blank / invalid input', () => {
      expect(steps(swp, blank(swp))).toEqual([]);
      expect(steps(swp, { ...base, corpus: '0' })).toEqual([]);
      expect(steps(swp, { ...base, monthlyWithdrawal: '0' })).toEqual([]);
      expect(steps(swp, { ...base, withdrawalPeriod: '0' })).toEqual([]);
      expect(steps(swp, { ...base, expectedReturn: 'abc' })).toEqual([]);
    });
  });

  describe('texas-mortgage-calculator', () => {
    const base = { homePrice: '350000', downPayment: '70000', interestRate: '6.8', loanTerm: '30', propertyTaxRate: '1.8', homesteadType: 'none', homeInsurance: '' };
    it('demo values run without error and quote the calculator row', () => {
      const d = defaults(texas);
      expect(d).toMatchObject({ homePrice: '350000', downPayment: '70000', interestRate: '6.8', propertyTaxRate: '1.8', homesteadType: 'none' });
      const out = steps(texas, d);
      expect(out.length).toBeGreaterThan(5);
      expect(out.at(-2)!.expr).toContain(resultValue(texas, d, 'totalMonthly'));
    });
    it('20% down, no homestead, no insurance', () => {
      expectSteps(texas, base, [
        ['$350,000.00 − $70,000.00 = $280,000.00', '20.0% down'],
        ['r = 6.8% ÷ 12 = 0.5667% per month', 'n = 30 years × 12 = 360 payments'],
        ['(1 + r)ⁿ = 7.6465', '= $1,825.39'],
        ['$350,000.00 × 1.8% = $6,300.00 a year'],
        ['$6,300.00 ÷ 12 = $525.00 a month'],
        ['$1,825.39 + $525.00 tax = $2,350.39'],
        ['$1,825.39 × 360 − $280,000.00 = $377,140.59', '= $657,141'],
      ]);
    });
    it('general homestead, PMI and insurance', () => {
      const v = { ...base, downPayment: '35000', loanTerm: '15', homesteadType: 'general', homeInsurance: '2400' };
      expectSteps(texas, v, [
        ['$350,000.00 − $35,000.00 = $315,000.00', '10.0% down'],
        ['n = 15 years × 12 = 180 payments'],
        ['(1 + r)ⁿ = 2.7652', '= $2,796.20'],
        ['= $6,300.00 a year'],
        ['1.8% × 55% school share = 0.99% school tax rate'],
        ['min($140,000.00, $350,000.00) = $140,000.00 exempt × 0.99% = $1,386.00 saved → $6,300.00 − $1,386.00 = $4,914.00 a year · ÷ 12 = $409.50 a month'],
        ['$315,000.00 × 0.5% ÷ 12 = $131.25 a month'],
        ['$2,400.00 ÷ 12 = $200.00 a month'],
        ['$2,796.20 + $409.50 tax + $131.25 PMI + $200.00 insurance = $3,536.95'],
        ['$2,796.20 × 180 − $315,000.00 = $188,316.78', '= $503,317'],
      ]);
      expect(steps(texas, v).at(-2)!.expr).toContain(resultValue(texas, v, 'totalMonthly'));
    });
    it('senior exemption', () => {
      const v = { homePrice: '300000', downPayment: '60000', interestRate: '7', loanTerm: '30', propertyTaxRate: '2', homesteadType: 'senior', homeInsurance: '' };
      expectSteps(texas, v, [
        ['= $240,000.00', '20.0% down'],
        ['360 payments'],
        ['(1 + r)ⁿ = 8.1165', '= $1,596.73'],
        ['$300,000.00 × 2% = $6,000.00 a year'],
        ['2% × 55% school share = 1.1% school tax rate'],
        ['min($200,000.00, $300,000.00) = $200,000.00 exempt × 1.1% = $2,200.00 saved → $6,000.00 − $2,200.00 = $3,800.00 a year · ÷ 12 = $316.67 a month'],
        ['$1,596.73 + $316.67 tax = $1,913.39'],
        ['$1,596.73 × 360 − $240,000.00 = $334,821.36', '= $574,821'],
      ]);
    });
    it('exemption cannot exceed the home value', () => {
      const v = { homePrice: '100000', downPayment: '20000', interestRate: '6', loanTerm: '30', propertyTaxRate: '2', homesteadType: 'general', homeInsurance: '' };
      const out = steps(texas, v);
      expect(out[5].expr).toContain('min($140,000.00, $100,000.00) = $100,000.00 exempt × 1.1% = $1,100.00 saved → $2,000.00 − $1,100.00 = $900.00 a year · ÷ 12 = $75.00 a month');
      expect(out[2].expr).toContain('= $479.64');
    });
    it('0% interest', () => {
      const out = steps(texas, { homePrice: '100000', downPayment: '20000', interestRate: '0', loanTerm: '15', propertyTaxRate: '0', homesteadType: 'none', homeInsurance: '' });
      expect(out[2].label).toContain('No interest');
      expect(out[2].expr).toContain('M = $80,000.00 ÷ 180 = $444.44');
      expect(out[3].expr).toContain('$100,000.00 × 0% = $0.00 a year');
    });
    it('returns [] for blank / invalid input', () => {
      expect(steps(texas, blank(texas))).toEqual([]);
      expect(steps(texas, { ...base, downPayment: '350000' })).toEqual([]);
      expect(steps(texas, { ...base, downPayment: '' })).toEqual([]);
      expect(steps(texas, { ...base, homePrice: '0' })).toEqual([]);
      expect(steps(texas, { ...base, interestRate: 'abc' })).toEqual([]);
    });
  });

  describe('tvm-calculator', () => {
    const fvCase = { solveFor: 'FV', n: '60', rate: '0.5', pv: '-250000', pmt: '1498.88', fv: '0', timing: 'end' };
    it('future value (demo values)', () => {
      expect(defaults(tvm)).toMatchObject(fvCase);
      expectSteps(tvm, fvCase, [
        ['k = 1 (payments at the end of each period)'],
        ['r = 0.5% ÷ 100 = 0.00500000', 'N = 60'],
        ['(1 + r)ᴺ = (1 + 0.00500000)^60 = 1.348850'],
        ['((1 + r)ᴺ − 1) ÷ r = 69.770031'],
        ['= $232,635.63', 'Total of payments = $1,498.88 × 60 = $89,932.80', 'Interest = FV + PV + PMT × N = $72,568.43'],
      ]);
      expect(steps(tvm, fvCase).at(-1)!.expr).toContain(resultValue(tvm, fvCase, 'result'));
    });
    it('future value, annuity due', () => {
      const v = { solveFor: 'FV', n: '24', rate: '0.75', pv: '-1000', pmt: '-200', fv: '', timing: 'begin' };
      const out = steps(tvm, v);
      expect(out[0].expr).toContain('k = 1 + r');
      expect(out[2].expr).toContain('= 1.196414');
      expect(out[3].expr).toContain('× (1 + r) = 26.384884');
      expect(out[4].expr).toContain('= $6,473.39');
      expect(out[4].expr).toContain('-$200.00 × 24 = -$4,800.00');
      expect(out[4].expr).toContain('$673.39');
    });
    it('present value, annuity due and ordinary', () => {
      const due = steps(tvm, { solveFor: 'PV', n: '60', rate: '0.5', pv: '', pmt: '-500', fv: '100000', timing: 'begin' });
      expect(due).toHaveLength(5);
      expect(due[3].expr).toContain('× (1 + r) = 51.984189');
      expect(due[4].expr).toContain('= -$48,145.13');
      const end = steps(tvm, { solveFor: 'PV', n: '36', rate: '1', pv: '', pmt: '', fv: '50000', timing: 'end' });
      expect(end[2].expr).toContain('= 1.430769');
      expect(end[3].expr).toContain('= 30.107505');
      expect(end[4].expr).toContain('= -$34,946.25');
    });
    it('payment, ordinary and due', () => {
      const v = { solveFor: 'PMT', n: '360', rate: '0.5', pv: '250000', pmt: '', fv: '0', timing: 'end' };
      expectSteps(tvm, v, [
        ['k = 1'], ['N = 360'], ['= 6.022575'], ['= 1004.515042'],
        ['= -$1,498.88', 'Total of payments = $539,595.47', 'Interest = $289,595.47'],
      ]);
      const due = steps(tvm, { solveFor: 'PMT', n: '48', rate: '0.6', pv: '20000', pmt: '', fv: '5000', timing: 'begin' });
      expect(due[2].expr).toContain('= 1.332610');
      expect(due[3].expr).toContain('= 55.435003');
      expect(due[4].expr).toContain('÷ (1 + r)');
      expect(due[4].expr).toContain('= -$567.57');
      expect(due[4].expr).toContain('Total of payments = $27,243.51');
      expect(due[4].expr).toContain('Interest = $2,243.51');
    });
    it('number of periods', () => {
      const v = { solveFor: 'N', n: '', rate: '1', pv: '-10000', pmt: '0', fv: '20000', timing: 'end' };
      expectSteps(tvm, v, [
        ['k = 1'],
        ['Top = −FV × r + PMT × k = -200.0000', 'Bottom = PV × r + PMT × k = -100.0000', 'ratio = 2.000000'],
        ['N = ln(2.000000) ÷ ln(1 + 0.010000) = 69.6607 periods', '5 yrs 10 mo'],
      ]);
      const due = steps(tvm, { solveFor: 'N', n: '', rate: '0.8', pv: '5000', pmt: '-200', fv: '0', timing: 'begin' });
      expect(due[1].expr).toContain('Top = −FV × r + PMT × k = -201.6000');
      expect(due[1].expr).toContain('Bottom = PV × r + PMT × k = -161.6000');
      expect(due[2].expr).toContain('= 27.7556 periods');
    });
    it('interest rate', () => {
      const v = { solveFor: 'RATE', n: '60', rate: '', pv: '-10000', pmt: '0', fv: '20000', timing: 'end' };
      expectSteps(tvm, v, [
        ['k = 1'],
        ['N = 60', 'PV = -$10,000.00', 'FV = $20,000.00'],
        ['r = 1.161944% per period', 'FV = $20,000.00 (target $20,000.00)'],
        ['1.1619% per period', '13.943328% nominal per year', '14.869835% effective per year'],
      ]);
      const p = steps(tvm, { solveFor: 'RATE', n: '60', rate: '', pv: '-1000', pmt: '-50', fv: '5000', timing: 'end' });
      expect(p[2].expr).toContain('r = 0.584727% per period');
      expect(p[3].expr).toContain('7.016728% nominal');
      expect(p[3].expr).toContain('7.246843% effective');
    });
    it('0% rate: nothing compounds', () => {
      const out = steps(tvm, { solveFor: 'FV', n: '12', rate: '0', pv: '-1000', pmt: '-100', fv: '', timing: 'end' });
      expect(out).toHaveLength(2);
      expect(out[1].expr).toContain('FV = −(PV + PMT × N) = −(-$1,000.00 + -$100.00 × 12) = $2,200.00');
    });
    it('returns [] for blank input and for an unsolvable problem', () => {
      expect(steps(tvm, blank(tvm))).toEqual([]);
      expect(steps(tvm, { solveFor: 'FV', n: '', rate: '1', pv: '-1', pmt: '0', fv: '', timing: 'end' })).toEqual([]);
      expect(steps(tvm, { solveFor: 'N', n: '', rate: '1', pv: '10000', pmt: '0', fv: '20000', timing: 'end' })).toEqual([]);
      expect(steps(tvm, { solveFor: 'PMT', n: '60', rate: 'abc', pv: '1000', pmt: '', fv: '0', timing: 'end' })).toEqual([]);
    });
  });

  describe('va-mortgage', () => {
    const base = {
      homePrice: '400000', downPaymentType: 'dollar', downPaymentValue: '0', loanTerm: '30', interestRate: '6.75', vaUseType: 'first',
      fundingFeeExempt: 'no', fundingFeePaidUpfront: 'rolled', annualPropertyTax: '4800', annualInsurance: '1800', monthlyHOA: '0',
    };
    it('0% down, first use, fee rolled in (demo values)', () => {
      expect(defaults(va)).toMatchObject({ homePrice: '400000', downPaymentValue: '0', interestRate: '6.75', annualPropertyTax: '4800', annualInsurance: '1800' });
      expectSteps(va, base, [
        ['Down payment = $0.00 (0% of the price)', 'Base loan = $400,000.00 − $0.00 = $400,000.00'],
        ['under 5% down, first use → fee rate 2.15%', '$400,000.00 × 2.15% = $8,600.00'],
        ['$400,000.00 + $8,600.00 = $408,600.00 total loan'],
        ['r = 6.75% ÷ 12 = 0.005625', 'n = 30 × 12 = 360', '(1 + r)ⁿ = 7.5332', '= $2,650.17'],
        ['Tax $4,800.00 ÷ 12 = $400.00', 'Insurance $1,800.00 ÷ 12 = $150.00', 'HOA = $0.00'],
        ['$2,650.17 + $400.00 + $150.00 + $0.00 = $3,200.17'],
      ]);
      expect(steps(va, base).at(-1)!.expr).toContain(resultValue(va, base, 'totalMonthlyPayment'));
    });
    it('10% down entered as a percentage', () => {
      const v = { ...base, downPaymentType: 'percent', downPaymentValue: '10' };
      expectSteps(va, v, [
        ['$400,000.00 × 10% = $40,000.00 down (10% of the price)', 'Base loan = $400,000.00 − $40,000.00 = $360,000.00'],
        ['10% or more down, first use → fee rate 1.25%', '= $4,500.00'],
        ['$360,000.00 + $4,500.00 = $364,500.00 total loan'],
        ['= $2,364.14'],
        ['$400.00', '$150.00'],
        ['= $2,914.14'],
      ]);
    });
    it('subsequent use, fee paid in cash, HOA', () => {
      const v = { ...base, loanTerm: '15', vaUseType: 'subsequent', fundingFeePaidUpfront: 'upfront', monthlyHOA: '100' };
      const out = steps(va, v);
      expect(out[1].expr).toContain('under 5% down, subsequent use → fee rate 3.3%');
      expect(out[1].expr).toContain('= $13,200.00');
      expect(out[2].label).toBe('Pay the fee in cash at closing');
      expect(out[2].expr).toContain('The loan stays at $400,000.00; the $13,200.00 fee is paid up front instead');
      expect(out[3].expr).toContain('n = 15 × 12 = 180');
      expect(out[3].expr).toContain('(1 + r)ⁿ = 2.7447');
      expect(out[3].expr).toContain('= $3,539.64');
      expect(out[5].expr).toContain('$3,539.64 + $400.00 + $150.00 + $100.00 = $4,189.64');
    });
    it('funding fee exemption', () => {
      const out = steps(va, { ...base, fundingFeeExempt: 'yes' });
      expect(out[1].label).toBe('VA funding fee: exempt');
      expect(out[1].expr).toContain('$0.00');
      expect(out[2].expr).toContain('$400,000.00 + $0.00 = $400,000.00 total loan');
      expect(out[3].expr).toContain('= $2,594.39');
      expect(out[5].expr).toContain('= $3,144.39');
    });
    it('exactly 5% down moves to the middle fee tier', () => {
      const v = { ...base, homePrice: '500000', downPaymentValue: '25000', interestRate: '6', annualPropertyTax: '6000', annualInsurance: '1200', monthlyHOA: '50' };
      expectSteps(va, v, [
        ['Down payment = $25,000.00 (5% of the price)', '= $475,000.00'],
        ['5% to under 10% down, first use → fee rate 1.5%', '= $7,125.00'],
        ['= $482,125.00 total loan'],
        ['(1 + r)ⁿ = 6.0226', '= $2,890.58'],
        ['$500.00', '$100.00', 'HOA = $50.00'],
        ['= $3,540.58'],
      ]);
    });
    it('0% interest', () => {
      const out = steps(va, { ...base, homePrice: '300000', interestRate: '0', fundingFeeExempt: 'yes' });
      expect(out[3].expr).toContain('$300,000.00 ÷ 360 payments (no interest) = $833.33');
    });
    it('returns [] for blank / invalid input', () => {
      expect(steps(va, blank(va))).toEqual([]);
      expect(steps(va, { ...base, homePrice: '0' })).toEqual([]);
      expect(steps(va, { ...base, downPaymentValue: '400000' })).toEqual([]);
      expect(steps(va, { ...base, interestRate: '-1' })).toEqual([]);
      expect(steps(va, { ...base, interestRate: 'abc' })).toEqual([]);
    });
  });

  describe('sales-tax', () => {
    const base = { mode: 'add', amount: '80', taxRate: '8.25' };
    it('add tax (demo values)', () => {
      expect(defaults(salesTax)).toMatchObject({ ...base, amount: '80.00' });
      expectSteps(salesTax, base, [
        ['8.25% ÷ 100 = 0.0825'],
        ['$80.00 × 0.0825 = $6.6000 → rounded to the cent = $6.60'],
        ['$80.00 + $6.60 = $86.60 total'],
      ]);
      expect(steps(salesTax, base).at(-1)!.expr).toContain(resultValue(salesTax, base, 'grossPrice'));
    });
    it('rounds the tax to the cent', () => {
      expectSteps(salesTax, { mode: 'add', amount: '19.99', taxRate: '7' }, [
        ['7% ÷ 100 = 0.07'], ['$19.99 × 0.07 = $1.3993 → rounded to the cent = $1.40'], ['$19.99 + $1.40 = $21.39 total'],
      ]);
    });
    it('extract tax from a total', () => {
      const v = { mode: 'extract', amount: '108.25', taxRate: '8.25' };
      expectSteps(salesTax, v, [
        ['8.25% ÷ 100 = 0.0825'],
        ['$108.25 ÷ (1 + 0.0825) = $100.0000 → rounded to the cent = $100.00'],
        ['$108.25 − $100.00 = $8.25 tax to remit'],
        ['$8.25 ÷ $108.25 × 100 = 7.621% of the total'],
      ]);
      const w = { mode: 'extract', amount: '59.99', taxRate: '6.5' };
      const out = steps(salesTax, w);
      expect(out[1].expr).toContain('$59.99 ÷ (1 + 0.065) = $56.3286 → rounded to the cent = $56.33');
      expect(out[2].expr).toContain('$59.99 − $56.33 = $3.66 tax to remit');
      expect(out[3].expr).toContain('= 6.101%');
    });
    it('0% rate', () => {
      expect(steps(salesTax, { mode: 'add', amount: '100', taxRate: '0' })[1].expr).toContain('= $0.0000 → rounded to the cent = $0.00');
    });
    it('returns [] for blank / invalid input', () => {
      expect(steps(salesTax, blank(salesTax))).toEqual([]);
      expect(steps(salesTax, { ...base, amount: '0' })).toEqual([]);
      expect(steps(salesTax, { ...base, taxRate: '' })).toEqual([]);
      expect(steps(salesTax, { ...base, amount: '-5' })).toEqual([]);
    });
  });

  describe('vat-calculator', () => {
    const base = { calcMode: 'add', amount: '100', country: '', vatRate: '20' };
    it('add VAT with a typed rate (demo values)', () => {
      expect(defaults(vat)).toMatchObject({ ...base, amount: '100.00' });
      expectSteps(vat, base, [
        ['Rate typed in = 20% → 0.2 as a decimal'],
        ['$100.00 × 0.2 = $20.0000 → rounded to the cent = $20.00'],
        ['$100.00 + $20.00 = $120.00'],
        ['$20.00 ÷ $120.00 × 100 = 16.7%'],
      ]);
      expect(steps(vat, base)[2].expr).toContain(resultValue(vat, base, 'grossAmount'));
    });
    it("uses the selected country's standard rate from the calculator's table", () => {
      const v = { calcMode: 'add', amount: '100', country: 'DE', vatRate: '' };
      expectSteps(vat, v, [
        ["Germany standard rate in the calculator's table = 19% → 0.19 as a decimal"],
        ['$100.00 × 0.19 = $19.0000 → rounded to the cent = $19.00'],
        ['$100.00 + $19.00 = $119.00'],
        ['$19.00 ÷ $119.00 × 100 = 16.0%'],
      ]);
    });
    it('remove VAT from a gross total', () => {
      expectSteps(vat, { calcMode: 'remove', amount: '1190', country: 'DE', vatRate: '' }, [
        ['19%'],
        ['$1,190.00 ÷ (1 + 0.19) = $1000.0000 → rounded to the cent = $1,000.00 net'],
        ['$1,190.00 − $1,000.00 = $190.00'],
        ['$190.00 ÷ $1,190.00 × 100 = 16.0%'],
      ]);
      const out = steps(vat, { calcMode: 'remove', amount: '120', country: '', vatRate: '5' });
      expect(out[1].expr).toContain('$120.00 ÷ (1 + 0.05) = $114.2857 → rounded to the cent = $114.29 net');
      expect(out[2].expr).toContain('$120.00 − $114.29 = $5.71');
      expect(out[3].expr).toContain('$5.71 ÷ $120.00 × 100 = 4.8%');
    });
    it('a typed rate overrides the country', () => {
      const out = steps(vat, { calcMode: 'add', amount: '100', country: 'UK', vatRate: '5' });
      expect(out[0].expr).toContain('Rate typed in = 5%');
      expect(out[1].expr).toContain('= $5.0000 → rounded to the cent = $5.00');
    });
    it('returns [] for blank / invalid input', () => {
      expect(steps(vat, blank(vat))).toEqual([]);
      expect(steps(vat, { ...base, amount: '0' })).toEqual([]);
      expect(steps(vat, { calcMode: 'add', amount: '100', country: '', vatRate: '' })).toEqual([]);
      expect(steps(vat, { ...base, amount: 'abc' })).toEqual([]);
    });
  });
});
