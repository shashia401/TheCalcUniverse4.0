import { describe, it, expect } from 'vitest';
import caMortgage from '../../../src/calculators/finance/california-mortgage-calculator';
import retirement from '../../../src/calculators/finance/retirement';
import amortization from '../../../src/calculators/finance/amortization';
import currency from '../../../src/calculators/finance/currency';
import loan from '../../../src/calculators/finance/loan-calculator';
import personalLoan from '../../../src/calculators/finance/personal-loan';
import apr from '../../../src/calculators/finance/apr-calculator';
import rentVsBuy from '../../../src/calculators/finance/rent-vs-buy';
import presentValue from '../../../src/calculators/finance/present-value';
import compound from '../../../src/calculators/finance/compound-interest';
import creditCard from '../../../src/calculators/finance/credit-card-payoff';
import netWorth from '../../../src/calculators/finance/net-worth';

// Expected values below were computed OUTSIDE the calculators, in Python with the decimal module
// (60-digit precision), from the published definitions: the level-payment annuity formula, month-by-month
// amortization, APR as the root of PV(payments) = cash received (Regulation Z actuarial method, solved by
// bisection), closed-form compounding, and a month-by-month rent-vs-buy ledger built from the assumptions
// stated on the page. Nothing here is copied from calculator output.

type Out = { id: string; value: string }[];
const val = (r: unknown, id: string) => (r as Out).find((x) => x.id === id)?.value;
const all = (r: unknown, ids: string[]) => Object.fromEntries(ids.map((i) => [i, val(r, i)]));

describe('california-mortgage-calculator audit', () => {
  const run = (v: Record<string, string>) => caMortgage.calculate(v);
  // Oracle: P&I = L r (1+r)^n / ((1+r)^n - 1); tax = price * rate / 12; PMI = 0.5%/yr of loan when down < 20%.
  it('$650k, 20% down, 6.9%, 30y, 0.77% tax: $3,424.72 P&I, $3,841.80 with tax, no PMI', () => {
    const r = run({ homePrice: '650000', downPayment: '130000', interestRate: '6.9', loanTerm: '30', propertyTaxRate: '0.77' });
    expect(all(r, ['monthlyPayment', 'totalMonthly', 'loanAmount', 'downPercent', 'totalInterest', 'totalCost', 'propertyTaxNote'])).toEqual({
      monthlyPayment: '$3,424.72', totalMonthly: '$3,841.80', loanAmount: '$520,000', downPercent: '20.0% ($130,000)',
      totalInterest: '$712,899', totalCost: '$1,232,899', propertyTaxNote: '$5,005/yr',
    });
  });
  it('$750k, 5% down, 7.25%: $4,860.51 P&I + $531.25 tax + $296.88 PMI = $5,688.63', () => {
    const r = run({ homePrice: '750000', downPayment: '37500', interestRate: '7.25', loanTerm: '30', propertyTaxRate: '0.85' });
    expect(all(r, ['monthlyPayment', 'totalMonthly', 'loanAmount', 'downPercent', 'totalInterest', 'propertyTaxNote'])).toEqual({
      monthlyPayment: '$4,860.51', totalMonthly: '$5,688.63', loanAmount: '$712,500', downPercent: '5.0% ($37,500)',
      totalInterest: '$1,037,282', propertyTaxNote: '$6,375/yr',
    });
  });
  it('19.96% down still pays PMI even though it displays as 20.0% (exact ratio compared)', () => {
    const r = run({ homePrice: '500000', downPayment: '99800', interestRate: '6', loanTerm: '30', propertyTaxRate: '1.1' });
    // 2,399.40 + 458.33 + 400,200*0.005/12 (166.75) = 3,024.48
    expect(val(r, 'monthlyPayment')).toBe('$2,399.40');
    expect(val(r, 'totalMonthly')).toBe('$3,024.48');
  });
  it('0% rate, 15y, exactly 20% down: price/loan arithmetic only, no interest, no PMI', () => {
    const r = run({ homePrice: '500000', downPayment: '100000', interestRate: '0', loanTerm: '15', propertyTaxRate: '1.0' });
    expect(all(r, ['monthlyPayment', 'totalMonthly', 'totalInterest', 'totalCost'])).toEqual({
      monthlyPayment: '$2,222.22', totalMonthly: '$2,638.89', totalInterest: '$0', totalCost: '$400,000',
    });
  });
  it('rejects down payment >= price and blank price', () => {
    expect(run({ homePrice: '500000', downPayment: '500000', interestRate: '6', loanTerm: '30' })).toEqual([]);
    expect(run({ homePrice: '', downPayment: '', interestRate: '6', loanTerm: '30' })).toEqual([]);
  });

  it('diagram and text carry no unsourced Texas/Florida rates or medians', () => {
    const e = caMortgage.educational!;
    const text = JSON.stringify([e.diagram, e.faqs, e.workedExamples]);
    expect(text).not.toMatch(/1\.80%|0\.90%|\$350K|\$400K|1\.4-1\.8%|\$9,000-\$11,700|TX:|FL:/);
    expect(e.diagram!.svg).toContain('Base tax capped at 1% of assessed value');
    expect(e.diagram!.svg).toContain('see C.A.R.');
  });
});

describe('retirement audit', () => {
  const run = (v: Record<string, string>) => retirement.calculate(v);
  const ids = ['futureValue', 'inflationAdjusted', 'totalContributed', 'totalGrowth', 'growthMultiple', 'goalStatus', 'requiredContribution'];
  // Oracle: FV = PV g + PMT (g-1)/r, g=(1+r/12)^n; real = FV/(1+i)^y; need = income (1+i)^y / 0.04.
  it('Anna 30->65, $50k, $500/mo, 7%, 3% inflation, $60k goal: FV $1,475,835, need $4,220,794, $2,025/mo', () => {
    expect(all(run({ currentAge: '30', retirementAge: '65', currentSavings: '50000', monthlyContribution: '500', annualReturn: '7', inflationRate: '3', desiredIncome: '60000' }), ids)).toEqual({
      futureValue: '$1.48M', inflationAdjusted: '$524,487', totalContributed: '$260,000', totalGrowth: '$1.22M',
      growthMultiple: '5.7×', goalStatus: 'Gap: $2.74M', requiredContribution: '$2,025/month',
    });
  });
  it('Robert 45->67, $120k, $800/mo, 5%: FV $743,160, gap $2.61M, $6,245/mo needed', () => {
    expect(all(run({ currentAge: '45', retirementAge: '67', currentSavings: '120000', monthlyContribution: '800', annualReturn: '5', inflationRate: '3', desiredIncome: '70000' }), ids)).toEqual({
      futureValue: '$743,160', inflationAdjusted: '$387,850', totalContributed: '$331,200', totalGrowth: '$411,960',
      growthMultiple: '2.2×', goalStatus: 'Gap: $2.61M', requiredContribution: '$6,245/month',
    });
  });
  it('0% return and 0% inflation: balance is just savings + contributions; needs $6,167/mo for a $750k nest egg', () => {
    expect(all(run({ currentAge: '30', retirementAge: '40', currentSavings: '10000', monthlyContribution: '200', annualReturn: '0', inflationRate: '0', desiredIncome: '30000' }), ids)).toEqual({
      futureValue: '$34,000', inflationAdjusted: '$34,000', totalContributed: '$34,000', totalGrowth: '$0',
      growthMultiple: '1.0×', goalStatus: 'Gap: $716,000', requiredContribution: '$6,167/month',
    });
  });
  it('on track: $500k + $3,000/mo at 8% far exceeds the $3.52M need; no required-contribution line', () => {
    const r = run({ currentAge: '30', retirementAge: '65', currentSavings: '500000', monthlyContribution: '3000', annualReturn: '8', inflationRate: '3', desiredIncome: '50000' });
    expect(all(r, ids)).toEqual({
      futureValue: '$15.03M', inflationAdjusted: '$5.34M', totalContributed: '$1,760,000', totalGrowth: '$13.27M',
      growthMultiple: '8.5×', goalStatus: 'Surplus: $11.51M', requiredContribution: undefined,
    });
  });
  it('$500/mo from 35 at 7% (no savings) = $609,985; blank inflation falls back to 3% (same real value)', () => {
    const base = { currentAge: '35', retirementAge: '65', currentSavings: '0', monthlyContribution: '500', annualReturn: '7' };
    expect(all(run({ ...base, inflationRate: '3' }), ['futureValue', 'inflationAdjusted', 'totalGrowth'])).toEqual({ futureValue: '$609,985', inflationAdjusted: '$251,306', totalGrowth: '$429,985' });
    expect(val(run({ ...base, inflationRate: '' }), 'inflationAdjusted')).toBe('$251,306');
  });
  it('page quick-reference figures: $500/mo from 25 = $1.31M, from 35 = $610k', () => {
    expect(val(run({ currentAge: '25', retirementAge: '65', currentSavings: '0', monthlyContribution: '500', annualReturn: '7', inflationRate: '3' }), 'futureValue')).toBe('$1.31M');
  });
  it('retirement age not after current age returns nothing', () => {
    expect(run({ currentAge: '65', retirementAge: '65', currentSavings: '0', monthlyContribution: '500', annualReturn: '7' })).toEqual([]);
  });
});

describe('amortization-calculator audit', () => {
  const base = { loanAmount: '250000', interestRate: '6.5', termUnit: 'years', loanTerm: '30' };
  const ids = ['basePayment', 'totalInterestStandard', 'totalCostStandard', 'timeSaved', 'interestSaved', 'newTerm', 'newTotalInterest'];
  // Oracle: annuity payment, then a month-by-month Decimal ledger (extra annual lump applied after every 12th payment).
  it('$250k at 6.5% for 30y: $1,580.17, $318,861.22 interest', () => {
    expect(all(amortization.calculate(base), ids)).toEqual({
      basePayment: '$1,580.17', totalInterestStandard: '$318,861.22', totalCostStandard: '$568,861.22',
      timeSaved: undefined, interestSaved: undefined, newTerm: undefined, newTotalInterest: undefined,
    });
  });
  it('+$200/mo: pays off in 265 months (22 yrs 1 mo), saves $97,618.12', () => {
    expect(all(amortization.calculate({ ...base, extraMonthly: '200' }), ids)).toMatchObject({
      timeSaved: '7 years and 11 months', interestSaved: '$97,618.12', newTerm: '22 yrs 1 mo', newTotalInterest: '$221,243.10',
    });
  });
  it('+$1,000/yr lump: 313 months, saves $48,477.35; both extras: 241 months, saves $119,984.00', () => {
    expect(all(amortization.calculate({ ...base, extraAnnual: '1000' }), ids)).toMatchObject({
      timeSaved: '3 years and 11 months', interestSaved: '$48,477.35', newTerm: '26 yrs 1 mo', newTotalInterest: '$270,383.87',
    });
    expect(all(amortization.calculate({ ...base, extraMonthly: '200', extraAnnual: '1000' }), ids)).toMatchObject({
      timeSaved: '9 years and 11 months', interestSaved: '$119,984.00', newTerm: '20 yrs 1 mo', newTotalInterest: '$198,877.22',
    });
  });
  it('0% rate, 120 months, +$100: 108 payments, no interest (and no trailing space in the term text)', () => {
    const r = amortization.calculate({ loanAmount: '100000', interestRate: '0', termUnit: 'months', loanTerm: '120', extraMonthly: '100' });
    expect(all(r, ids)).toMatchObject({ basePayment: '$833.33', totalInterestStandard: '$0.00', timeSaved: '1 year', interestSaved: '$0.00', newTerm: '9 yrs' });
  });
  it('$18k, 5.25%, 60 months, +$150: 40 months, saves $845.58', () => {
    expect(all(amortization.calculate({ loanAmount: '18000', interestRate: '5.25', termUnit: 'months', loanTerm: '60', extraMonthly: '150' }), ids)).toEqual({
      basePayment: '$341.75', totalInterestStandard: '$2,504.86', totalCostStandard: '$20,504.86',
      timeSaved: '1 year and 8 months', interestSaved: '$845.58', newTerm: '3 yrs 4 mo', newTotalInterest: '$1,659.28',
    });
  });
  it('invalid input returns nothing', () => {
    expect(amortization.calculate({ loanAmount: '0', interestRate: '7', termUnit: 'years', loanTerm: '15' })).toEqual([]);
    expect(amortization.calculate({ loanAmount: '1000', interestRate: '7', termUnit: 'years', loanTerm: '0' })).toEqual([]);
  });
});

describe('currency-calculator audit (deterministic parts only)', () => {
  // The converted amount needs a live ECB/Frankfurter rate fetched in the browser panel; that cannot be pinned
  // here. What is deterministic: same-currency identity, the input guards, and the placeholder rows.
  it('same currency converts 1:1', () => {
    const r = currency.calculate({ amount: '1000', fromCurrency: 'USD', toCurrency: 'USD' });
    expect(val(r, 'result')).toBe('1,000.00');
    expect(val(r, 'rate')).toBe('1 USD = 1.0000 USD (same currency)');
  });
  it('different currencies show the pending-rate placeholder with the entered amount', () => {
    const r = currency.calculate({ amount: '1234.5', fromCurrency: 'EUR', toCurrency: 'JPY' });
    expect(all(r, ['loading', 'from', 'to'])).toEqual({ loading: 'Fetching live exchange rate...', from: '1,234.5 EUR', to: 'JPY' });
  });
  it('zero, negative and blank amounts return nothing; defaults are USD -> EUR', () => {
    for (const amount of ['0', '-5', '']) expect(currency.calculate({ amount, fromCurrency: 'EUR', toCurrency: 'JPY' })).toEqual([]);
    expect(val(currency.calculate({ amount: '1000' }), 'from')).toBe('1,000 USD');
  });
  it('page worked examples multiply correctly: 2000/1.0850, 5000*83.25, 8000*145.5', () => {
    // Oracle: plain arithmetic on the illustrative rates the page states.
    expect((2000 / 1.085).toFixed(2)).toBe('1843.32');
    expect(5000 * 83.25).toBe(416250);
    expect(8000 * 145.5).toBe(1164000);
  });
});

describe('loan-calculator audit', () => {
  const run = (v: Record<string, string>) => loan.calculate(v);
  const ids = ['monthlyPayment', 'totalInterest', 'totalCost', 'interestRatio', 'termMonths'];
  it('$25k, 6.5%, 5y: $489.15, $4,349.22 interest, 14.8% of cost', () => {
    expect(all(run({ loanAmount: '25000', interestRate: '6.5', termUnit: 'years', loanTerm: '5' }), ids)).toEqual({
      monthlyPayment: '$489.15', totalInterest: '$4,349.22', totalCost: '$29,349.22', interestRatio: '14.8%', termMonths: '5 years (60 payments)',
    });
  });
  it('0% rate divides evenly: $25k over 60 months = $416.67', () => {
    expect(all(run({ loanAmount: '25000', interestRate: '0', termUnit: 'years', loanTerm: '5' }), ids)).toMatchObject({ monthlyPayment: '$416.67', totalInterest: '$0.00', interestRatio: '0.0%' });
  });
  it('$10k, 12%, 24 months: $470.73, $1,297.63 interest', () => {
    expect(all(run({ loanAmount: '10000', interestRate: '12', termUnit: 'months', loanTerm: '24' }), ids)).toEqual({
      monthlyPayment: '$470.73', totalInterest: '$1,297.63', totalCost: '$11,297.63', interestRatio: '11.5%', termMonths: '24 months (2.0 years)',
    });
  });
  it('1.1 years is rounded UP to 14 payments (not 13)', () => {
    expect(all(run({ loanAmount: '25000', interestRate: '6.5', termUnit: 'years', loanTerm: '1.1' }), ids)).toMatchObject({
      monthlyPayment: '$1,859.11', totalInterest: '$1,027.51', termMonths: '1.1 years (14 payments)',
    });
  });
  it('$500k, 6.5%, 30y: $3,160.34, $637,722.44 interest, 56.1%', () => {
    expect(all(run({ loanAmount: '500000', interestRate: '6.5', termUnit: 'years', loanTerm: '30' }), ids)).toMatchObject({
      monthlyPayment: '$3,160.34', totalInterest: '$637,722.44', totalCost: '$1,137,722.44', interestRatio: '56.1%',
    });
  });
  it('page FAQ figures: $20k at 8% costs $2,562 interest over 3y and $4,332 over 5y', () => {
    expect(val(run({ loanAmount: '20000', interestRate: '8', termUnit: 'years', loanTerm: '3' }), 'totalInterest')).toBe('$2,562.18');
    expect(val(run({ loanAmount: '20000', interestRate: '8', termUnit: 'years', loanTerm: '5' }), 'totalInterest')).toBe('$4,331.67');
  });
  it('terms beyond 50 years and blank amounts return nothing', () => {
    expect(run({ loanAmount: '500000', interestRate: '6.5', termUnit: 'years', loanTerm: '51' })).toEqual([]);
    expect(run({ loanAmount: '', interestRate: '6.5', termUnit: 'months', loanTerm: '6' })).toEqual([]);
  });
});

describe('personal-loan-calculator audit', () => {
  const ids = ['monthlyPayment', 'actualCashReceived', 'totalInterest', 'originationFeeResult', 'totalCostIncFee', 'costOfBorrowing', 'effectiveApr'];
  const run = (v: Record<string, string>) => all(personalLoan.calculate(v), ids);
  // Oracle: effective APR = 12 x the monthly rate r solving PV(payment, r, n) = cash received (bisection, Decimal).
  it('$20k, 36m, 11.5%, 3% fee deducted: $659.52, cash $19,400, effective APR 13.63%', () => {
    expect(run({ loanAmount: '20000', loanTerm: '36', interestRate: '11.5', originationFeeType: 'percent', originationFeeValue: '3', feeHandling: 'deducted' })).toEqual({
      monthlyPayment: '$659.52', actualCashReceived: '$19,400.00', totalInterest: '$3,742.72', originationFeeResult: '$600.00',
      totalCostIncFee: '$23,742.72', costOfBorrowing: '$4,342.72', effectiveApr: '13.63%',
    });
  });
  it('same loan over 60m: $439.85, effective APR 12.84% (page FAQ says about 12.8%)', () => {
    expect(run({ loanAmount: '20000', loanTerm: '60', interestRate: '11.5', originationFeeType: 'percent', originationFeeValue: '3', feeHandling: 'deducted' })).toMatchObject({
      monthlyPayment: '$439.85', totalInterest: '$6,391.13', costOfBorrowing: '$6,991.13', effectiveApr: '12.84%',
    });
  });
  it('fee added to the balance: payment on $20,600 = $679.31, cash stays $20,000, effective APR 13.56%', () => {
    expect(run({ loanAmount: '20000', loanTerm: '36', interestRate: '11.5', originationFeeType: 'percent', originationFeeValue: '3', feeHandling: 'added' })).toEqual({
      monthlyPayment: '$679.31', actualCashReceived: '$20,000.00', totalInterest: '$3,855.01', originationFeeResult: '$600.00',
      totalCostIncFee: '$24,455.01', costOfBorrowing: '$4,455.01', effectiveApr: '13.56%',
    });
  });
  it('8% fee added: $712.28/mo, effective APR 16.92%', () => {
    expect(run({ loanAmount: '20000', loanTerm: '36', interestRate: '11.5', originationFeeType: 'percent', originationFeeValue: '8', feeHandling: 'added' })).toMatchObject({
      monthlyPayment: '$712.28', originationFeeResult: '$1,600.00', costOfBorrowing: '$5,642.14', effectiveApr: '16.92%',
    });
  });
  it('flat $500 fee on $15k, 48m, 9%: effective APR 10.79%; no fee gives back exactly 9.00%', () => {
    expect(run({ loanAmount: '15000', loanTerm: '48', interestRate: '9', originationFeeType: 'flat', originationFeeValue: '500', feeHandling: 'deducted' })).toMatchObject({
      monthlyPayment: '$373.28', actualCashReceived: '$14,500.00', costOfBorrowing: '$3,417.23', effectiveApr: '10.79%',
    });
    expect(run({ loanAmount: '15000', loanTerm: '48', interestRate: '9', originationFeeType: 'none', originationFeeValue: '', feeHandling: 'deducted' })).toMatchObject({
      originationFeeResult: 'None', costOfBorrowing: '$2,917.23', effectiveApr: '9.00%',
    });
  });
  it('0% loan with a 5% fee deducted: cost of borrowing is just the $500 fee, effective APR 4.97%', () => {
    expect(run({ loanAmount: '10000', loanTerm: '24', interestRate: '0', originationFeeType: 'percent', originationFeeValue: '5', feeHandling: 'deducted' })).toMatchObject({
      monthlyPayment: '$416.67', totalInterest: '$0.00', costOfBorrowing: '$500.00', effectiveApr: '4.97%',
    });
  });
  it('a fee larger than the loan returns nothing', () => {
    expect(personalLoan.calculate({ loanAmount: '20000', loanTerm: '36', interestRate: '11.5', originationFeeType: 'percent', originationFeeValue: '120', feeHandling: 'deducted' })).toEqual([]);
  });
});

describe('apr-calculator audit', () => {
  const ids = ['aprResult', 'aprDifferenceResult', 'monthlyPaymentResult', 'netCashReceivedResult', 'totalNominalInterest', 'totalCostWithFees'];
  const run = (v: Record<string, string>) => all(apr.calculate(v), ids);
  // Oracle: bisection on PV(payment at the nominal rate, r, n) = loan - fees; APR = 12 r.
  it('$200k, 6.5%, 30y, $4,000 fees: APR 6.695% (page diagram says 6.70%)', () => {
    expect(run({ loanAmount: '200000', nominalRate: '6.5', loanTermValue: '30', loanTermUnit: 'years', upfrontFees: '4000' })).toEqual({
      aprResult: '6.695%', aprDifferenceResult: '0.195 percentage points', monthlyPaymentResult: '$1,264.14',
      netCashReceivedResult: '$196,000.00', totalNominalInterest: '$255,088.98', totalCostWithFees: '$459,088.98',
    });
  });
  it('$300k, 6%, 30y, $6,000 fees: APR 6.189%', () => {
    expect(run({ loanAmount: '300000', nominalRate: '6', loanTermValue: '30', loanTermUnit: 'years', upfrontFees: '6000' })).toMatchObject({ aprResult: '6.189%', monthlyPaymentResult: '$1,798.65' });
  });
  it('$25k, 7.9%, 60 months, $500 fees: APR 8.759%', () => {
    expect(run({ loanAmount: '25000', nominalRate: '7.9', loanTermValue: '60', loanTermUnit: 'months', upfrontFees: '500' })).toMatchObject({ aprResult: '8.759%', monthlyPaymentResult: '$505.71', totalCostWithFees: '$30,842.85' });
  });
  it('$200k, 5%, 30y, $10,000 fees: APR 5.457%', () => {
    expect(run({ loanAmount: '200000', nominalRate: '5', loanTermValue: '30', loanTermUnit: 'years', upfrontFees: '10000' })).toMatchObject({ aprResult: '5.457%', monthlyPaymentResult: '$1,073.64' });
  });
  it('short, fee-heavy loans still solve: $10k, 5%, 6 months, $5,000 fee -> 299.061%; $5k, 18%, 12m, $250 -> 27.999%', () => {
    expect(run({ loanAmount: '10000', nominalRate: '5', loanTermValue: '6', loanTermUnit: 'months', upfrontFees: '5000' }).aprResult).toBe('299.061%');
    expect(run({ loanAmount: '5000', nominalRate: '18', loanTermValue: '12', loanTermUnit: 'months', upfrontFees: '250' }).aprResult).toBe('27.999%');
  });
  it('0% nominal with $600 fees on $10k over 24 months: APR 6.012%', () => {
    expect(run({ loanAmount: '10000', nominalRate: '0', loanTermValue: '24', loanTermUnit: 'months', upfrontFees: '600' })).toMatchObject({ aprResult: '6.012%', monthlyPaymentResult: '$416.67' });
  });
  it('no fees: APR equals the nominal rate exactly; fees >= loan returns nothing', () => {
    expect(run({ loanAmount: '200000', nominalRate: '6.5', loanTermValue: '30', loanTermUnit: 'years', upfrontFees: '' }).aprResult).toBe('6.500%');
    expect(apr.calculate({ loanAmount: '10000', nominalRate: '5', loanTermValue: '12', loanTermUnit: 'months', upfrontFees: '10000' })).toEqual([]);
  });
});

describe('rent-vs-buy-calculator audit', () => {
  // Oracle: independent month-by-month ledger of the model stated on the page (30-year fixed loan; renter invests
  // down payment + closing costs at 7%; PMI on the original loan while balance > 80% of price; tax at the purchase
  // price; insurance and upkeep on start-of-year value; sale proceeds net of selling costs and loan balance).
  const rb = {
    monthlyRent: '2200', annualRentIncrease: '3', rentersInsurance: '180', homePrice: '400000', downPaymentPct: '10',
    mortgageRate: '6.75', closingCostsPct: '3', propertyTaxRate: '1.2', maintenancePct: '1.5', homeInsurancePct: '0.5',
    homeAppreciationRate: '3', sellingCostsPct: '6', pmiRate: '0.7', yearsToStay: '7',
  };
  const ids = ['breakEvenResult', 'selectedYearVerdict', 'buyingTotalCost', 'rentingTotalCost', 'homeValueAtHorizon'];
  const run = (o: Record<string, string> = {}) => all(rentVsBuy.calculate({ ...rb, ...o }), ids);
  it('defaults, 7 years: buy $225,078 vs rent $172,048 (renting cheaper by $53,030), break-even year 15', () => {
    expect(run()).toEqual({
      breakEvenResult: '15 years', selectedYearVerdict: '$53,030', buyingTotalCost: '$225,078', rentingTotalCost: '$172,048', homeValueAtHorizon: '$491,950',
    });
  });
  it('1 year: buy $64,223 vs rent $22,940; 30 years: buy $525,116 vs rent $917,554 (buying cheaper by $392,438)', () => {
    expect(run({ yearsToStay: '1' })).toMatchObject({ buyingTotalCost: '$64,223', rentingTotalCost: '$22,940', homeValueAtHorizon: '$412,000' });
    expect(run({ yearsToStay: '30' })).toMatchObject({ buyingTotalCost: '$525,116', rentingTotalCost: '$917,554', selectedYearVerdict: '$392,438', homeValueAtHorizon: '$970,905' });
  });
  it('20% down (no PMI), 10 years: buy $248,423 vs rent $215,468, break-even year 16', () => {
    expect(run({ downPaymentPct: '20', yearsToStay: '10' })).toMatchObject({ breakEvenResult: '16 years', buyingTotalCost: '$248,423', rentingTotalCost: '$215,468' });
  });
  it('0% appreciation: never breaks even in 30 years; buy $411,858 vs rent $254,155 after 10', () => {
    expect(run({ homeAppreciationRate: '0', yearsToStay: '10' })).toMatchObject({
      breakEvenResult: 'No break-even within 30 years', buyingTotalCost: '$411,858', rentingTotalCost: '$254,155', homeValueAtHorizon: '$400,000',
    });
  });
  it('0% mortgage rate, 20% down, 5 years: buy $42,586 vs rent $104,026, break-even year 2', () => {
    expect(run({ mortgageRate: '0', downPaymentPct: '20', yearsToStay: '5' })).toMatchObject({ breakEvenResult: '2 years', buyingTotalCost: '$42,586', rentingTotalCost: '$104,026' });
  });
  it('$4,500 rent, $500k home, 20% down, 6%, 5 years: buy $169,342 vs rent $241,300, break-even year 3', () => {
    expect(run({ monthlyRent: '4500', homePrice: '500000', downPaymentPct: '20', mortgageRate: '6', yearsToStay: '5' })).toMatchObject({
      breakEvenResult: '3 years', buyingTotalCost: '$169,342', rentingTotalCost: '$241,300', selectedYearVerdict: '$71,958',
    });
  });
  it('$700k, 5% down, 7%, $1,500 rent: rent wins by $410,322 after 10 years, no break-even', () => {
    expect(run({ monthlyRent: '1500', homePrice: '700000', downPaymentPct: '5', mortgageRate: '7', yearsToStay: '10' })).toMatchObject({
      breakEvenResult: 'No break-even within 30 years', buyingTotalCost: '$564,311', rentingTotalCost: '$153,989', selectedYearVerdict: '$410,322',
    });
  });
  it('blank rent or zero price returns nothing', () => {
    expect(rentVsBuy.calculate({ ...rb, monthlyRent: '' })).toEqual([]);
    expect(rentVsBuy.calculate({ ...rb, homePrice: '0' })).toEqual([]);
  });
});

describe('present-value-calculator audit', () => {
  const ids = ['presentValueResult', 'discountAmountResult', 'discountFactorResult', 'effectiveAnnualRateResult'];
  const run = (fv: string, periods: string, rate: string, m: string) =>
    all(presentValue.calculate({ futureValue: fv, periods, discountRate: rate, compoundingFrequency: m }), ids);
  // Oracle: PV = FV / (1 + r/m)^(m n); effective annual rate = (1 + r/m)^m - 1 (Decimal).
  it('$100k in 15y at 7% annual: $36,244.60 (page example)', () => {
    expect(run('100000', '15', '7', '1')).toEqual({
      presentValueResult: '$36,244.60', discountAmountResult: '$63,755.40', discountFactorResult: '1 : 2.7590', effectiveAnnualRateResult: '7.0000%',
    });
  });
  it('$50k in 8y at 5% quarterly: $33,599.20, effective 5.0945%', () => {
    expect(run('50000', '8', '5', '4')).toEqual({
      presentValueResult: '$33,599.20', discountAmountResult: '$16,400.80', discountFactorResult: '1 : 1.4881', effectiveAnnualRateResult: '5.0945%',
    });
  });
  it('$500k in 20y at 6%: $155,902.36; at 4%: $228,193.47 (page pension example)', () => {
    expect(run('500000', '20', '6', '1').presentValueResult).toBe('$155,902.36');
    expect(run('500000', '20', '4', '1').presentValueResult).toBe('$228,193.47');
  });
  it('compounding frequency at 7% over 10y: annual $50,834.93, semi $50,256.59, monthly $49,759.63 (EAR 7.2290%), daily $49,661.86 (7.2501%)', () => {
    expect(run('100000', '10', '7', '1').presentValueResult).toBe('$50,834.93');
    expect(run('100000', '10', '7', '2')).toMatchObject({ presentValueResult: '$50,256.59', effectiveAnnualRateResult: '7.1225%' });
    expect(run('100000', '10', '7', '12')).toMatchObject({ presentValueResult: '$49,759.63', discountFactorResult: '1 : 2.0097', effectiveAnnualRateResult: '7.2290%' });
    expect(run('100000', '10', '7', '365')).toMatchObject({ presentValueResult: '$49,661.86', effectiveAnnualRateResult: '7.2501%' });
  });
  it('page quick-reference: $100k/20y/7% = $25,842 (25,841.90); $1M/30y/7% = $131,367.12', () => {
    expect(run('100000', '20', '7', '1').presentValueResult).toBe('$25,841.90');
    expect(run('1000000', '30', '7', '1').presentValueResult).toBe('$131,367.12');
  });
  it('fractional years: $25k, 2.5y, 6% monthly = $21,525.74; $20k, 0.5y, 8% annual = $19,245.01', () => {
    expect(run('25000', '2.5', '6', '12').presentValueResult).toBe('$21,525.74');
    expect(run('20000', '0.5', '8', '1').presentValueResult).toBe('$19,245.01');
  });
  it('0% rate: PV equals FV', () => {
    expect(run('10000', '5', '0', '12')).toMatchObject({ presentValueResult: '$10,000.00', discountAmountResult: '$0.00', effectiveAnnualRateResult: '0.0000%' });
  });
  it('diagram bars: $100k in 10y at 3/5/10/15% = $74,409 / $61,391 / $38,554 / $24,718', () => {
    expect(run('100000', '10', '3', '1').presentValueResult).toBe('$74,409.39');
    expect(run('100000', '10', '5', '1').presentValueResult).toBe('$61,391.33');
    expect(run('100000', '10', '10', '1').presentValueResult).toBe('$38,554.33');
    expect(run('100000', '10', '15', '1').presentValueResult).toBe('$24,718.47');
  });
  it('zero/negative inputs return nothing', () => {
    for (const [fv, p, r] of [['0', '5', '7'], ['1000', '0', '7'], ['1000', '5', '-1'], ['1000', '5', '']]) {
      expect(presentValue.calculate({ futureValue: fv, periods: p, discountRate: r, compoundingFrequency: '1' })).toEqual([]);
    }
  });
});

describe('loan-calculator audit: solve-for modes and payment cases (moved from the retired payment-calculator)', () => {
  const run = (v: Record<string, string>) => loan.calculate(v);
  // Oracle: M = P r g/(g-1); P = M (1 - (1+r)^-n)/r; n = -ln(1 - rP/M)/ln(1+r) rounded up, last payment smaller.
  it('payment: $25k at 7% for 5y = $495.03, $4,701.80 interest; 36 months = $771.93', () => {
    expect(all(run({ solveFor: 'payment', loanAmount: '25000', interestRate: '7', termUnit: 'years', loanTerm: '5' }), ['monthlyPayment', 'totalInterest', 'totalCost', 'termMonths', 'interestRatio'])).toEqual({
      monthlyPayment: '$495.03', totalInterest: '$4,701.80', totalCost: '$29,701.80', termMonths: '5 years (60 payments)', interestRatio: '15.8%',
    });
    expect(all(run({ solveFor: 'payment', loanAmount: '25000', interestRate: '7', termUnit: 'months', loanTerm: '36' }), ['monthlyPayment', 'totalInterest'])).toEqual({ monthlyPayment: '$771.93', totalInterest: '$2,789.39' });
  });
  it('payment: $250k at 6.5% for 15y = $2,177.77, $141,998.31 interest; 0% rate $12k/48m = $250', () => {
    expect(all(run({ solveFor: 'payment', loanAmount: '250000', interestRate: '6.5', termUnit: 'years', loanTerm: '15' }), ['monthlyPayment', 'totalInterest'])).toEqual({ monthlyPayment: '$2,177.77', totalInterest: '$141,998.31' });
    expect(val(run({ solveFor: 'payment', loanAmount: '12000', interestRate: '0', termUnit: 'months', loanTerm: '48' }), 'monthlyPayment')).toBe('$250.00');
  });
  it('loan amount: $600/mo at 7% for 5y borrows $30,301.20; +$50 adds $2,525.10', () => {
    const r = run({ solveFor: 'loanAmount', monthlyPayment: '600', interestRate: '7', termUnit: 'years', loanTerm: '5' });
    expect(all(r, ['loanAmount', 'totalInterest', 'totalCost', 'increaseBy50'])).toEqual({
      loanAmount: '$30,301.20', totalInterest: '$5,698.80', totalCost: '$36,000.00', increaseBy50: '$32,826.30 — $2,525.10 more',
    });
  });
  it('loan amount: $500/mo at 7% for 84 months borrows $33,128.64; 0% rate $250 x 48 = $12,000', () => {
    expect(val(run({ solveFor: 'loanAmount', monthlyPayment: '500', interestRate: '7', termUnit: 'months', loanTerm: '84' }), 'loanAmount')).toBe('$33,128.64');
    expect(val(run({ solveFor: 'loanAmount', monthlyPayment: '250', interestRate: '0', termUnit: 'months', loanTerm: '48' }), 'loanAmount')).toBe('$12,000.00');
  });
  it('term: $25k at 7% paying $545 takes 54 payments (4 years and 6 months), $4,179.46 interest', () => {
    expect(all(run({ solveFor: 'term', loanAmount: '25000', monthlyPayment: '545', interestRate: '7' }), ['term', 'totalPayments', 'totalInterest', 'totalCost', 'minPayment'])).toEqual({
      term: '4 years and 6 months', totalPayments: '54 payments (the last one may be smaller)', totalInterest: '$4,179.46',
      totalCost: '$29,179.46', minPayment: '$145.83/month (never pays off principal)',
    });
  });
  it('term: $495 (just under the true $495.03 payment) needs a 61st payment; interest $4,702.16', () => {
    expect(all(run({ solveFor: 'term', loanAmount: '25000', monthlyPayment: '495', interestRate: '7' }), ['term', 'totalInterest'])).toEqual({ term: '5 years and 1 month', totalInterest: '$4,702.16' });
  });
  it('term: $5,000 at 22% paying $100 takes 137 payments (11y 5m) and $8,678.06 interest; 0% rate $10k at $250 = 40 payments', () => {
    expect(all(run({ solveFor: 'term', loanAmount: '5000', monthlyPayment: '100', interestRate: '22' }), ['term', 'totalInterest', 'totalCost'])).toEqual({ term: '11 years and 5 months', totalInterest: '$8,678.06', totalCost: '$13,678.06' });
    expect(all(run({ solveFor: 'term', loanAmount: '10000', monthlyPayment: '250', interestRate: '0' }), ['term', 'totalInterest'])).toEqual({ term: '3 years and 4 months', totalInterest: '$0.00' });
  });
  it('term: a payment at or under the monthly interest ($91.67) never pays off; a single-payment loan reads "1 payment"', () => {
    expect(val(run({ solveFor: 'term', loanAmount: '5000', monthlyPayment: '91', interestRate: '22' }), 'error')).toBe('Monthly payment must exceed $91.67 to cover interest. Loan will never be paid off.');
    const r = run({ solveFor: 'term', loanAmount: '1000', monthlyPayment: '5000', interestRate: '10' });
    expect(all(r, ['term', 'totalPayments', 'totalInterest'])).toEqual({ term: '1 month', totalPayments: '1 payment (the last one may be smaller)', totalInterest: '$8.33' });
  });
  it('page figures: 15y vs 30y on $250k at 6.5% differ by $176,862.91 of interest; 36 vs 72 months on $35k at 7% by $2,733.81', () => {
    const i = (n: string, a: string, t: string) => run({ solveFor: 'payment', loanAmount: a, interestRate: n, termUnit: 'months', loanTerm: t });
    expect(val(i('6.5', '250000', '360'), 'totalInterest')).toBe('$318,861.22');
    expect(val(i('7', '35000', '48'), 'totalInterest')).toBe('$5,229.69');
    expect(val(i('7', '35000', '72'), 'totalInterest')).toBe('$7,963.50');
  });
  it('overlong terms return nothing in every mode; a sub-month loan term rounds to 0 payments in loan-amount mode', () => {
    expect(run({ solveFor: 'payment', loanAmount: '12000', interestRate: '5', termUnit: 'years', loanTerm: '51' })).toEqual([]);
    expect(run({ solveFor: 'loanAmount', monthlyPayment: '500', interestRate: '5', termUnit: 'years', loanTerm: '51' })).toEqual([]);
    expect(run({ solveFor: 'loanAmount', monthlyPayment: '500', interestRate: '7', termUnit: 'years', loanTerm: '0.0001' })).toEqual([]);
  });
  it('solve-for modes: missing rate or payment returns nothing, and no output carries NaN/Infinity', () => {
    expect(run({ solveFor: 'loanAmount', monthlyPayment: '500', interestRate: '', loanTerm: '5' })).toEqual([]);
    expect(run({ solveFor: 'term', loanAmount: '25000', monthlyPayment: '', interestRate: '7' })).toEqual([]);
    for (const v of [
      { solveFor: 'loanAmount', monthlyPayment: '500', interestRate: '7', termUnit: 'years', loanTerm: '5' },
      { solveFor: 'term', loanAmount: '25000', monthlyPayment: '500', interestRate: '7' },
    ]) expect(JSON.stringify(run(v))).not.toMatch(/NaN|Infinity|∞/);
  });
  it('the three solve-for results agree with each other: payment -> loan amount -> term round trip', () => {
    const p = parseFloat(String(val(run({ solveFor: 'payment', loanAmount: '25000', interestRate: '7', termUnit: 'years', loanTerm: '5' }), 'monthlyPayment')).replace(/[$,]/g, ''));
    expect(val(run({ solveFor: 'loanAmount', monthlyPayment: String(p), interestRate: '7', termUnit: 'years', loanTerm: '5' }), 'loanAmount')).toBe('$25,000.00');
    expect(val(run({ solveFor: 'term', loanAmount: '25000', monthlyPayment: String(p), interestRate: '7' }), 'term')).toBe('5 years');
  });
  it('the default (no solveFor) is the monthly-payment mode', () => {
    expect(val(run({ loanAmount: '25000', interestRate: '7', termUnit: 'years', loanTerm: '5' }), 'monthlyPayment')).toBe('$495.03');
  });
});

describe('compound-interest-calculator audit', () => {
  const ids = ['futureValue', 'totalPrincipal', 'totalInterest', 'totalGrowth'];
  const run = (v: Record<string, string>) => all(compound.calculate(v), ids);
  // Oracle: FV = P(1+r/n)^(nt) + PMT[((1+i)^(12t)-1)/i], i = (1+r/n)^(n/12) - 1 (Decimal).
  it('$10k at 7% for 20y: annual $38,696.84 (page FAQ ~$38,700), monthly $40,387.39', () => {
    expect(run({ principal: '10000', monthlyContribution: '0', rate: '7', years: '20', compoundFrequency: '1' })).toEqual({
      futureValue: '$38,696.84', totalPrincipal: '$10,000.00', totalInterest: '$28,696.84', totalGrowth: '+286.97%',
    });
    expect(run({ principal: '10000', rate: '7', years: '20', compoundFrequency: '12' }).futureValue).toBe('$40,387.39');
  });
  it('$500/mo for 30y at 7%: $609,985.50 on $180,000 contributed (page FAQ ~$610k)', () => {
    expect(run({ principal: '0', monthlyContribution: '500', rate: '7', years: '30', compoundFrequency: '12', shape: 'with-contributions' })).toEqual({
      futureValue: '$609,985.50', totalPrincipal: '$180,000.00', totalInterest: '$429,985.50', totalGrowth: '+238.88%',
    });
  });
  it('$10k + $500/mo for 30y at 7%: $691,150.47', () => {
    expect(run({ principal: '10000', monthlyContribution: '500', rate: '7', years: '30', compoundFrequency: '12' })).toMatchObject({
      futureValue: '$691,150.47', totalPrincipal: '$190,000.00', totalInterest: '$501,150.47',
    });
  });
  it('compounding frequency, $5k + $200/mo at 5% for 10y: annual $39,017.11, quarterly $39,240.20, daily $39,316.55', () => {
    const b = { principal: '5000', monthlyContribution: '200', rate: '5', years: '10' };
    expect(run({ ...b, compoundFrequency: '1' }).futureValue).toBe('$39,017.11');
    expect(run({ ...b, compoundFrequency: '4' })).toMatchObject({ futureValue: '$39,240.20', totalInterest: '$10,240.20' });
    expect(run({ ...b, compoundFrequency: '365' }).futureValue).toBe('$39,316.55');
  });
  it('$10k at 12% daily for 5y: $18,219.39', () => {
    expect(run({ principal: '10000', monthlyContribution: '', rate: '12', years: '5', compoundFrequency: '365' }).futureValue).toBe('$18,219.39');
  });
  it('0% rate: balance is principal + deposits', () => {
    expect(run({ principal: '1000', monthlyContribution: '100', rate: '0', years: '5', compoundFrequency: '12' })).toEqual({
      futureValue: '$7,000.00', totalPrincipal: '$7,000.00', totalInterest: '$0.00', totalGrowth: '+0.00%',
    });
  });
  it('a contribution left in the hidden field does not count on the Standard tab', () => {
    const v = { principal: '10000', monthlyContribution: '500', rate: '7', years: '20', compoundFrequency: '12' };
    expect(run({ ...v, shape: 'standard' }).futureValue).toBe('$40,387.39');
    expect(run({ ...v, shape: 'with-contributions' }).futureValue).not.toBe('$40,387.39');
  });
  it('zero years returns nothing', () => {
    expect(compound.calculate({ principal: '10000', rate: '7', years: '0', compoundFrequency: '12' })).toEqual([]);
  });
});

describe('credit-card-payoff-calculator audit', () => {
  // Oracle: month-by-month Decimal ledger (interest = balance x APR/12, final payment = what is owed).
  const fixed = (balance: string, apr: string, monthlyPayment: string) =>
    all(creditCard.calculate({ balance, apr, payoffMode: 'fixed', monthlyPayment }), ['payoffTime', 'totalInterest', 'interestRatio', 'totalPaid']);
  it('Tanya: $5,000 at 21.99%, $200/mo = 34 months, $1,748.69 interest, $6,748.69 paid', () => {
    expect(fixed('5000', '21.99', '200')).toEqual({ payoffTime: '2yr 10mo', totalInterest: '$1,748.69', interestRatio: '35.0%', totalPaid: '$6,748.69' });
  });
  it('+$50 (to $250): 26 months, $1,284.93 interest (saves $463.76, page says $464)', () => {
    expect(fixed('5000', '21.99', '250')).toEqual({ payoffTime: '2yr 2mo', totalInterest: '$1,284.93', interestRatio: '25.7%', totalPaid: '$6,284.93' });
  });
  it('$5,000 at 22% paying $100: 137 months (11yr 5mo), $8,678.06 interest', () => {
    expect(fixed('5000', '22', '100')).toEqual({ payoffTime: '11yr 5mo', totalInterest: '$8,678.06', interestRatio: '173.6%', totalPaid: '$13,678.06' });
  });
  it('0% APR: $3,000 at $250 = 12 months exactly, no interest; $1,200 at 18%, $400 = 4 months, $37.27 interest', () => {
    expect(fixed('3000', '0', '250')).toMatchObject({ payoffTime: '1yr 0mo', totalInterest: '$0.00', totalPaid: '$3,000.00' });
    expect(fixed('1200', '18', '400')).toMatchObject({ payoffTime: '0yr 4mo', totalInterest: '$37.27', totalPaid: '$1,237.27' });
  });
  it('payment below the first month interest ($91.62) triggers the never-paid-off warning', () => {
    const r = creditCard.calculate({ balance: '5000', apr: '21.99', payoffMode: 'fixed', monthlyPayment: '91' });
    expect(r).toHaveLength(1);
    expect(val(r, 'warning')).toContain('only covers the interest ($91.62/mo)');
  });
  const bydate = (balance: string, apr: string, targetMonths: string) =>
    all(creditCard.calculate({ balance, apr, payoffMode: 'bydate', targetMonths }), ['requiredPayment', 'totalInterest', 'totalPaid', 'interestRatio']);
  it('David: $8,200 at 24.99% in 36 months = $325.99/mo, $3,535.54 interest (page: $3,536, 43%)', () => {
    expect(bydate('8200', '24.99', '36')).toEqual({ requiredPayment: '$325.99/mo', totalInterest: '$3,535.54', totalPaid: '$11,735.54', interestRatio: '43.1%' });
  });
  it('$5,000 at 19.99% in 24 months = $254.45/mo; $10,000 at 29.99% in 12 months = $974.82/mo; 0% $4,000/16 = $250', () => {
    expect(bydate('5000', '19.99', '24')).toMatchObject({ requiredPayment: '$254.45/mo', totalInterest: '$1,106.91' });
    expect(bydate('10000', '29.99', '12')).toMatchObject({ requiredPayment: '$974.82/mo', totalInterest: '$1,697.86', totalPaid: '$11,697.86' });
    expect(bydate('4000', '0', '16')).toMatchObject({ requiredPayment: '$250.00/mo', totalInterest: '$0.00' });
  });
  it('zero balance, blank payment or zero target months return nothing', () => {
    expect(creditCard.calculate({ balance: '0', apr: '20', payoffMode: 'fixed', monthlyPayment: '100' })).toEqual([]);
    expect(creditCard.calculate({ balance: '5000', apr: '21.99', payoffMode: 'fixed', monthlyPayment: '' })).toEqual([]);
    expect(creditCard.calculate({ balance: '1000', apr: '20', payoffMode: 'bydate', targetMonths: '0' })).toEqual([]);
  });
});

describe('net-worth-calculator audit', () => {
  const ids = ['netWorth', 'totalAssets', 'totalLiabilities', 'debtToAsset'];
  // Oracle: assets - liabilities; ratio = liabilities / assets (exact arithmetic on the page's worked examples).
  it('Michael: assets $455,000, liabilities $235,000, net worth $220,000, ratio 51.6%', () => {
    const r = netWorth.calculate({ cash: '15000', investments: '50000', retirement: '80000', realEstate: '300000', otherAssets: '10000', mortgage: '220000', carLoans: '12000', creditCardDebt: '3000' });
    expect(all(r, ids)).toEqual({ netWorth: '$220,000.00', totalAssets: '$455,000.00', totalLiabilities: '$235,000.00', debtToAsset: '51.6%' });
  });
  it('Aisha: assets $41,000, liabilities $32,000, net worth $9,000, ratio 78.0%', () => {
    const r = netWorth.calculate({ cash: '8000', retirement: '15000', otherAssets: '18000', carLoans: '8000', studentLoans: '22000', creditCardDebt: '2000' });
    expect(all(r, ids)).toEqual({ netWorth: '$9,000.00', totalAssets: '$41,000.00', totalLiabilities: '$32,000.00', debtToAsset: '78.0%' });
  });
  it('debts above assets give a signed negative net worth and a ratio above 100%', () => {
    const r = netWorth.calculate({ cash: '1000', mortgage: '5000' });
    expect(all(r, ids)).toMatchObject({ netWorth: '-$4,000.00', totalAssets: '$1,000.00', totalLiabilities: '$5,000.00', debtToAsset: '500.0%' });
  });
  it('assets equal to debts give exactly $0.00 (never "-$0.00"), even with a sub-cent difference', () => {
    expect(val(netWorth.calculate({ cash: '1000', mortgage: '1000' }), 'netWorth')).toBe('$0.00');
    expect(val(netWorth.calculate({ cash: '1000', mortgage: '1000.004' }), 'netWorth')).toBe('$0.00');
  });
  it('blank and non-numeric fields return nothing', () => {
    expect(netWorth.calculate({ cash: '', mortgage: '' })).toEqual([]);
    expect(netWorth.calculate({ cash: 'abc', mortgage: '' })).toEqual([]);
  });

  it('no assets: debt-to-asset ratio is undefined and shows "N/A (no assets)" in a neutral colour (not 100.0%)', () => {
    const r = netWorth.calculate({ mortgage: '5000' }) as { id: string; value: string; color: string; interpretation?: string }[];
    const d = r.find((x) => x.id === 'debtToAsset')!;
    expect(d.value).toBe('N/A (no assets)');
    expect(d.color).toBe('neutral');
    expect(r.find((x) => x.id === 'netWorth')!.value).toBe('-$5,000.00');
    // a tiny asset base still gives a real ratio
    expect(val(netWorth.calculate({ cash: '1000', mortgage: '5000' }), 'debtToAsset')).toBe('500.0%');
  });
});

describe('california-mortgage-calculator: the worked examples print what the calculator computes (1.1% tax)', () => {
  // A new California buyer is assessed at the purchase price: the 1% Prop 13 base plus local levies, not the ~0.7% statewide
  // average (which reflects long-time owners). Oracle: python Decimal, P&I annuity; tax = price x 1.1% / 12; PMI 0.5% of loan / 12.
  const out = (v: Record<string, string>, id: string) => (caMortgage.calculate(v) as { id: string; value: string }[]).find((x) => x.id === id)?.value;
  const ex = caMortgage.educational!.workedExamples!;

  it('Garcia, $650k, 20% down, 6.9%: P&I $3,424.72 + tax $595.83 = $4,020.55 a month, $7,150 a year', () => {
    const v = { homePrice: '650000', downPayment: '130000', interestRate: '6.9', loanTerm: '30', propertyTaxRate: '1.1' };
    expect(out(v, 'monthlyPayment')).toBe('$3,424.72');
    expect(out(v, 'totalMonthly')).toBe('$4,020.55');
    expect(out(v, 'propertyTaxNote')).toBe('$7,150/yr');
    expect(ex[0].inputs).toEqual(v);
    for (const n of ['$3,425', '$596', '$4,021', '$7,150']) expect(ex[0].result).toContain(n);
  });

  it('Los Angeles condo, $750k, 5% down, 7.25%: tax $687.50 and PMI $296.88 on top of $4,860.51', () => {
    const v = { homePrice: '750000', downPayment: '37500', interestRate: '7.25', loanTerm: '30', propertyTaxRate: '1.1' };
    expect(out(v, 'monthlyPayment')).toBe('$4,860.51');
    expect(out(v, 'propertyTaxNote')).toBe('$8,250/yr');
    expect(out(v, 'totalMonthly')).toBe('$5,844.88');
    expect(ex[1].inputs).toEqual(v);
    for (const n of ['$4,861', '$688', '$297', '$5,845', '$70,139']) expect(ex[1].result).toContain(n);
  });

  it('the default tax rate is 1.1%, not the long-time-owner average', () => {
    const field = caMortgage.inputs.find((i) => i.id === 'propertyTaxRate')!;
    expect(field.placeholder).toBe('1.1');
    expect(field.helpText).toContain('1% Prop 13 base rate');
  });
});
