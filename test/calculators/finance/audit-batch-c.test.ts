import { describe, it, expect } from 'vitest';
import rentalProperty from '../../../src/calculators/finance/rental-property';
import rentVsBuy from '../../../src/calculators/realestate/rent-vs-buy';
import repayment from '../../../src/calculators/finance/repayment';
import collegeCost from '../../../src/calculators/finance/college-cost';
import cd from '../../../src/calculators/finance/cd-calculator';
import averageReturn from '../../../src/calculators/finance/average-return';
import boatLoan from '../../../src/calculators/finance/boat-loan';
import mutualFund from '../../../src/calculators/finance/mutual-fund';
import paycheck from '../../../src/calculators/finance/paycheck-calculator';
import refinance from '../../../src/calculators/finance/refinance';
import paybackPeriod from '../../../src/calculators/finance/payback-period';
import arvFlipping from '../../../src/calculators/finance/arv-flipping';
import capitalGains from '../../../src/calculators/finance/capital-gains-tax';
import percentOff from '../../../src/calculators/finance/percent-off';

type Out = { id: string; value: string; label?: string }[];
const val = (r: unknown, id: string) => (r as Out).find((x) => x.id === id)?.value;
const label = (r: unknown, id: string) => (r as Out).find((x) => x.id === id)?.label;

// Every expected number below was computed independently in Python (plain floats / fractions,
// month-by-month loops where the calculator uses a closed form), never copied from calculator output.

describe('rental-property-calculator audit', () => {
  // Oracle: NOI = EGI - (tax + insurance + 12*HOA + maint% * gross + mgmt% * EGI); P&I by the annuity formula.
  const tn = { purchasePrice: '350000', downPayment: '70000', closingCosts: '10000', interestRate: '7.25', loanTerm: '30', monthlyRent: '2500', vacancyRate: '5', propertyTaxState: 'tn', insurance: '1800', hoaFees: '0', maintenancePct: '10', propertyMgmtPct: '0' };

  it('Tennessee 0.65% tax: P&I $1,910.09, cash flow -$124.68/mo, CoC -1.87%, cap 6.12%, NOI $21,425, DSCR 0.93x, GRM 11.7x', () => {
    const r = rentalProperty.calculate(tn);
    expect(val(r, 'monthlyMortgage')).toBe('$1,910.09');
    expect(val(r, 'monthlyCashFlow')).toBe('-$124.68');
    expect(val(r, 'annualCashFlow')).toBe('-$1,496');
    expect(val(r, 'cashOnCash')).toBe('-1.87%');
    expect(val(r, 'capRate')).toBe('6.12%');
    expect(val(r, 'noi')).toBe('$21,425/yr');
    expect(val(r, 'dscr')).toBe('0.93x');
    expect(val(r, 'grm')).toBe('11.7x');
    expect(val(r, 'propertyTaxRate')).toBe('0.65% (Tennessee)');
  });

  it('Illinois 1.95% tax, $350 HOA, 8% mgmt: P&I $1,048.82, cash flow -$516.30/mo, CoC -10.87%, cap 3.20%, DSCR 0.51x', () => {
    const r = rentalProperty.calculate({ purchasePrice: '200000', downPayment: '50000', closingCosts: '7000', interestRate: '7.5', loanTerm: '30', monthlyRent: '1800', vacancyRate: '8', propertyTaxState: 'il', insurance: '1200', hoaFees: '350', maintenancePct: '12', propertyMgmtPct: '8' });
    expect(val(r, 'monthlyMortgage')).toBe('$1,048.82');
    expect(val(r, 'monthlyCashFlow')).toBe('-$516.30');
    expect(val(r, 'annualCashFlow')).toBe('-$6,196');
    expect(val(r, 'cashOnCash')).toBe('-10.87%');
    expect(val(r, 'capRate')).toBe('3.20%');
    expect(val(r, 'noi')).toBe('$6,390/yr');
    expect(val(r, 'dscr')).toBe('0.51x');
    expect(val(r, 'grm')).toBe('9.3x');
  });

  it('zero-rate 15-year loan, custom tax, explicit 0% vacancy: P&I = 240,000/180 = $1,333.33, cash flow $184.67/mo', () => {
    const r = rentalProperty.calculate({ purchasePrice: '300000', downPayment: '60000', closingCosts: '5000', interestRate: '0', loanTerm: '15', monthlyRent: '2400', vacancyRate: '0', propertyTaxState: 'custom', propertyTax: '3600', insurance: '1200', hoaFees: '50', maintenancePct: '8', propertyMgmtPct: '10' });
    expect(val(r, 'monthlyMortgage')).toBe('$1,333.33');
    expect(val(r, 'monthlyCashFlow')).toBe('$184.67');
    expect(val(r, 'annualCashFlow')).toBe('$2,216');
    expect(val(r, 'cashOnCash')).toBe('3.41%');
    expect(val(r, 'capRate')).toBe('6.07%');
    expect(val(r, 'noi')).toBe('$18,216/yr');
    expect(val(r, 'dscr')).toBe('1.14x');
    expect(val(r, 'grm')).toBe('10.4x');
  });

  it('all-cash purchase: no debt service, so DSCR is N/A (not 0.00x); blank vacancy defaults to 5%', () => {
    const r = rentalProperty.calculate({ purchasePrice: '250000', downPayment: '250000', closingCosts: '5000', interestRate: '6', loanTerm: '30', monthlyRent: '2000', vacancyRate: '', propertyTaxState: 'custom', propertyTax: '2500', insurance: '1000', maintenancePct: '10', propertyMgmtPct: '8' });
    expect(val(r, 'monthlyMortgage')).toBe('$0.00');
    expect(val(r, 'monthlyCashFlow')).toBe('$1,256.33');
    expect(val(r, 'annualCashFlow')).toBe('$15,076');
    expect(val(r, 'noi')).toBe('$15,076/yr');
    expect(val(r, 'cashOnCash')).toBe('5.91%');
    expect(val(r, 'capRate')).toBe('6.03%');
    expect(val(r, 'dscr')).toBe('N/A (no loan)');
  });

  it('rejects a down payment above the price and zero rent', () => {
    expect(rentalProperty.calculate({ ...tn, downPayment: '400000' })).toEqual([]);
    expect(rentalProperty.calculate({ ...tn, monthlyRent: '0' })).toEqual([]);
  });
});

describe('home-rent-vs-buy-calculator (realestate/rent-vs-buy) audit', () => {
  // Oracle: independent month-by-month loan simulation (balance loop, PMI whenever balance > 80% of price),
  // annual rent/appreciation compounding, 7% opportunity cost on down payment + closing costs, 6% selling costs,
  // 0.5% homeowner's insurance on the start-of-year value, 0.7% PMI below 20% down.
  const base = { homePrice: '400000', downPaymentPct: '20', interestRate: '6.8', closingCostsPct: '', propertyTaxPct: '', maintenancePct: '', homeAppreciation: '3', monthlyRent: '2000', rentIncrease: '', rentersInsurance: '', years: '7' };

  it('20% down, 6.8%, 7 years: equity $201,196, home value $491,950, net buy $190,458 vs net rent $129,567, renting saves $60,891, break-even year 23', () => {
    const r = rentVsBuy.calculate(base);
    expect(val(r, 'futureHomeValue')).toBe('$491,950');
    expect(val(r, 'homeEquity')).toBe('$201,196');
    expect(val(r, 'netBuyCost')).toBe('$190,458');
    expect(val(r, 'netRentCost')).toBe('$129,567');
    expect(val(r, 'recommendation')).toBe('$60,891');
    expect(label(r, 'recommendation')).toBe('Over 7 years: Renting saves you');
    expect(val(r, 'closingCostsLine')).toBe('$12,000');
    expect(label(r, 'breakEven')).toBe('Break-even at year 23');
    // year-N result means buying already wins in year N, so the advice is "N years or more", not "more than N"
    expect(val(r, 'breakEven')).toBe('Buy if staying 23 years or more');
    // P&I 2,086.16 + (1.2% tax + 1.5% maintenance + 0.5% insurance) * 400,000 / 12 = 3,152.83; no PMI at 20% down
    expect(val(r, 'totalMonthlyBuy')).toBe('$3,153/mo');
  });

  it('10% down adds PMI to the monthly cost: 2,346.93 + 210.00 PMI + 1,066.67 = $3,624/mo; 7-year net buy $255,048 vs rent $199,773, break-even year 15', () => {
    const r = rentVsBuy.calculate({ ...base, downPaymentPct: '10', monthlyRent: '2500', homeAppreciation: '2' });
    expect(val(r, 'totalMonthlyBuy')).toBe('$3,624/mo');
    expect(val(r, 'futureHomeValue')).toBe('$459,474');
    expect(val(r, 'homeEquity')).toBe('$132,377');
    expect(val(r, 'netBuyCost')).toBe('$255,048');
    expect(val(r, 'netRentCost')).toBe('$199,773');
    expect(label(r, 'breakEven')).toBe('Break-even at year 15');
  });

  it('0% rate, falling prices, flat rent: renting never breaks even; 30-year net rent cost is negative and keeps its sign before the $', () => {
    const inputs = { ...base, homePrice: '500000', interestRate: '0', homeAppreciation: '-2', monthlyRent: '1500', rentIncrease: '0' };
    const r7 = rentVsBuy.calculate(inputs);
    expect(val(r7, 'netBuyCost')).toBe('$214,918');
    expect(val(r7, 'netRentCost')).toBe('$57,735');
    expect(val(r7, 'breakEven')).toBe('Renting is cheaper long-term at these inputs');
    const r30 = rentVsBuy.calculate({ ...inputs, years: '30' });
    expect(val(r30, 'netBuyCost')).toBe('$665,880');
    expect(val(r30, 'netRentCost')).toBe('-$214,409');
    expect(val(r30, 'futureHomeValue')).toBe('$272,742');
    // years beyond 30 are clamped to the model's 30-year horizon
    expect(val(rentVsBuy.calculate({ ...inputs, years: '45' }), 'netBuyCost')).toBe('$665,880');
  });

  it('all-cash purchase (100% down): no mortgage, $800/mo = (1.2% + 1.5% + 0.5%) of $300,000 / 12', () => {
    const r = rentVsBuy.calculate({ ...base, homePrice: '300000', downPaymentPct: '100', interestRate: '5', monthlyRent: '1800', years: '5' });
    expect(val(r, 'totalMonthlyBuy')).toBe('$800/mo');
    expect(val(r, 'netBuyCost')).toBe('$31,940');
    expect(val(r, 'netRentCost')).toBe('-$8,711');
  });

  it('blank price or rent returns nothing', () => {
    expect(rentVsBuy.calculate({ ...base, homePrice: '' })).toEqual([]);
    expect(rentVsBuy.calculate({ ...base, monthlyRent: '0' })).toEqual([]);
  });
});

describe('repayment-calculator audit', () => {
  // Oracle: M = P r / (1 - (1+r)^-n); extra-payment schedule simulated month by month with a smaller final payment.
  it('$25,000 at 7% for 5 years: $495.03/mo, interest $4,702, total $29,702, 15.8% interest share', () => {
    const r = repayment.calculate({ loanAmount: '25000', interestRate: '7', termUnit: 'years', loanTerm: '5', extraPayment: '' });
    expect(val(r, 'monthlyPayment')).toBe('$495.03');
    expect(val(r, 'totalInterest')).toBe('$4,702');
    expect(val(r, 'totalCost')).toBe('$29,702');
    expect(val(r, 'interestRatio')).toBe('15.8%');
    expect(val(r, 'termMonths')).toBe('5 years (60 payments)');
    // same loan entered as months
    expect(val(repayment.calculate({ loanAmount: '25000', interestRate: '7', termUnit: 'months', loanTerm: '60' }), 'monthlyPayment')).toBe('$495.03');
  });

  it('$25 extra a month: 57 payments, interest $4,425, saves $277 and 3 months (matches the text in the explanation)', () => {
    const r = repayment.calculate({ loanAmount: '25000', interestRate: '7', termUnit: 'years', loanTerm: '5', extraPayment: '25' });
    expect(val(r, 'monthlyWithExtra')).toBe('$520.03');
    expect(val(r, 'newPayoffTime')).toBe('4yr 9mo (57 payments)');
    expect(val(r, 'totalInterestWithExtra')).toBe('$4,425');
    expect(val(r, 'interestSaved')).toBe('$277');
    expect(val(r, 'timeSaved')).toBe('0yr 3mo');
  });

  it('$250,000 at 6.5% for 30 years + $200 extra: $1,580.17/mo, 265 payments, saves $97,618 and 7yr 11mo', () => {
    const r = repayment.calculate({ loanAmount: '250000', interestRate: '6.5', termUnit: 'years', loanTerm: '30', extraPayment: '200' });
    expect(val(r, 'monthlyPayment')).toBe('$1,580.17');
    expect(val(r, 'totalInterest')).toBe('$318,861');
    expect(val(r, 'newPayoffTime')).toBe('22yr 1mo (265 payments)');
    expect(val(r, 'totalInterestWithExtra')).toBe('$221,243');
    expect(val(r, 'interestSaved')).toBe('$97,618');
    expect(val(r, 'timeSaved')).toBe('7yr 11mo');
  });

  it('0% loan: payment = principal / months, no interest', () => {
    const r = repayment.calculate({ loanAmount: '10000', interestRate: '0', termUnit: 'months', loanTerm: '24' });
    expect(val(r, 'monthlyPayment')).toBe('$416.67');
    expect(val(r, 'totalInterest')).toBe('$0');
    expect(val(r, 'totalCost')).toBe('$10,000');
    expect(val(r, 'interestRatio')).toBe('0.0%');
  });

  it('rejects blank, zero-principal and over-50-year terms', () => {
    expect(repayment.calculate({ loanAmount: '', interestRate: '7', loanTerm: '5' })).toEqual([]);
    expect(repayment.calculate({ loanAmount: '0', interestRate: '7', loanTerm: '5' })).toEqual([]);
    expect(repayment.calculate({ loanAmount: '1000', interestRate: '7', termUnit: 'years', loanTerm: '60' })).toEqual([]);
  });
});

describe('college-cost-calculator audit', () => {
  // Oracle: cost_y = (tuition + room&board + extras - aid) * (1+g)^(yearsToCollege + y); savings = FV of lump sum + monthly annuity;
  // gap = max(0, total - savings); monthly needed = gap * i / ((1+i)^n - 1). College Board 2025-26 averages are the calculator's own data.
  const base = { childAge: '8', currentSavings: '10000', monthlyContribution: '200', institutionType: 'in-state', includeRoomBoard: 'yes', additionalCosts: '', financialAid: '', tuitionInflation: '5', growthRate: '6', collegeYears: '4' };

  it('age 8, in-state with room & board: 4-year cost $181,486, savings $50,970 (28%), gap $130,516, +$796/mo', () => {
    const r = collegeCost.calculate(base);
    expect(val(r, 'projectedCost')).toBe('$181,486');
    expect(val(r, 'currentAnnualCost')).toBe('$25,850');
    expect(val(r, 'costAtStart')).toBe('$42,107');
    expect(val(r, 'savingsAtCollege')).toBe('$50,970');
    expect(val(r, 'fundingGap')).toBe('$130,516');
    expect(val(r, 'pctFunded')).toBe('28%');
    expect(val(r, 'monthlyNeeded')).toBe('$796.42');
    expect(val(r, 'totalMonthly')).toBe('$996.42');
    expect(val(r, 'yearsUntilCollege')).toBe('10 years');
  });

  it('newborn, private, $5,000 and no contributions: $631,913 total, $1,593.45/mo needed', () => {
    const r = collegeCost.calculate({ ...base, childAge: '0', currentSavings: '5000', monthlyContribution: '0', institutionType: 'private' });
    expect(val(r, 'projectedCost')).toBe('$631,913');
    expect(val(r, 'savingsAtCollege')).toBe('$14,684');
    expect(val(r, 'monthlyNeeded')).toBe('$1,593.45');
  });

  it('out-of-state, tuition only, +$2,000 extras, -$5,000 aid, 4% inflation, 5% return: annual $28,880, total $181,534, gap $134,007, +$862.99/mo', () => {
    const r = collegeCost.calculate({ ...base, institutionType: 'out-state', includeRoomBoard: 'no', additionalCosts: '2000', financialAid: '5000', tuitionInflation: '4', growthRate: '5' });
    expect(val(r, 'currentBaseCost')).toBe('$31,880');
    expect(val(r, 'currentAnnualCost')).toBe('$28,880');
    expect(val(r, 'projectedCost')).toBe('$181,534');
    expect(val(r, 'savingsAtCollege')).toBe('$47,527');
    expect(val(r, 'fundingGap')).toBe('$134,007');
    expect(val(r, 'monthlyNeeded')).toBe('$862.99');
  });

  it('age 18 (college starts now): no inflation, no growth, gap with no monthly plan; zero return stays linear', () => {
    const r = collegeCost.calculate({ ...base, childAge: '18', currentSavings: '20000', monthlyContribution: '0' });
    expect(val(r, 'projectedCost')).toBe('$111,417');
    expect(val(r, 'costAtStart')).toBe('$25,850');
    expect(val(r, 'savingsAtCollege')).toBe('$20,000');
    expect(val(r, 'fundingGap')).toBe('$91,417');
    expect(val(r, 'monthlyNeeded')).toBeUndefined();
    const z = collegeCost.calculate({ ...base, childAge: '10', currentSavings: '0', tuitionInflation: '5', growthRate: '0' });
    expect(val(z, 'savingsAtCollege')).toBe('$19,200');
    expect(val(z, 'monthlyNeeded')).toBe('$1,514.72');
  });

  it('well-funded plan reports no gap and 100%', () => {
    const r = collegeCost.calculate({ ...base, childAge: '5', currentSavings: '200000', monthlyContribution: '500', includeRoomBoard: 'no', tuitionInflation: '3', growthRate: '7' });
    expect(val(r, 'fundingGap')).toBe('None — fully funded!');
    expect(val(r, 'pctFunded')).toBe('100%');
  });

  it('proTip/explanation figures: $200/mo from birth at 6% = ~$77,471; from age 10 = ~$24,566', () => {
    const fv = (months: number) => 200 * ((Math.pow(1.005, months) - 1) / 0.005);
    expect(Math.round(fv(216))).toBe(77471);
    expect(Math.round(fv(96))).toBe(24566);
  });
});

describe('cd-calculator audit', () => {
  // Oracle: A = P (1+APY)^t, add-on deposits as an end-of-month annuity at the monthly rate equivalent to the APY.
  const base = { initialDeposit: '10000', termUnit: 'months', termLength: '12', apy: '4.25', compounding: 'daily', additionalDeposit: '' };

  it('$10,000, 12 months, 4.25% APY = exactly $10,425 whatever the compounding choice', () => {
    for (const c of ['daily', 'weekly', 'monthly', 'quarterly', 'semiannually', 'annually']) {
      const r = cd.calculate({ ...base, compounding: c });
      expect(val(r, 'balance')).toBe('$10,425');
      expect(val(r, 'totalInterest')).toBe('$425');
      expect(val(r, 'effectiveAnnualRate')).toBe('4.25%');
    }
    const r = cd.calculate(base);
    expect(label(r, 'balance')).toBe('Balance at Maturity (12 months)');
    expect(val(r, 'interestPct')).toBe('4.1%');
  });

  it('3-month CD at 4.5% APY: 5,000 x 1.045^0.25 = $5,055.33 (interest $55)', () => {
    const r = cd.calculate({ ...base, initialDeposit: '5000', termLength: '3', apy: '4.5' });
    expect(val(r, 'balance')).toBe('$5,055');
    expect(val(r, 'totalInterest')).toBe('$55');
  });

  it('2-year (entered in years) $50,000 at 5.25%: $55,388, interest $5,388', () => {
    const r = cd.calculate({ ...base, initialDeposit: '50000', termUnit: 'years', termLength: '2', apy: '5.25' });
    expect(val(r, 'balance')).toBe('$55,388');
    expect(val(r, 'totalInterest')).toBe('$5,388');
  });

  it('add-on CD: $50,000 + $500/mo for 36 months at 4.85% = $76,937 on $68,000 deposited (interest $8,937)', () => {
    const r = cd.calculate({ ...base, initialDeposit: '50000', termLength: '36', apy: '4.85', additionalDeposit: '500' });
    expect(val(r, 'balance')).toBe('$76,937');
    expect(val(r, 'totalPrincipal')).toBe('$68,000');
    expect(val(r, 'totalInterest')).toBe('$8,937');
    const s = cd.calculate({ ...base, termLength: '18', apy: '3', additionalDeposit: '100' });
    expect(val(s, 'balance')).toBe('$12,292');
    expect(val(s, 'totalPrincipal')).toBe('$11,800');
    expect(val(s, 'totalInterest')).toBe('$492');
  });

  it('0% APY earns nothing (with or without deposits); 6-month term uses (1+APY)^0.5', () => {
    const z = cd.calculate({ ...base, termLength: '60', apy: '0' });
    expect(val(z, 'balance')).toBe('$10,000');
    expect(val(z, 'totalInterest')).toBe('$0');
    const zd = cd.calculate({ ...base, termLength: '10', apy: '0', additionalDeposit: '100' });
    expect(val(zd, 'balance')).toBe('$11,000');
    expect(val(cd.calculate({ ...base, termLength: '6', apy: '4' }), 'totalInterest')).toBe('$198');
  });

  it('blank APY or deposit returns nothing', () => {
    expect(cd.calculate({ ...base, apy: '' })).toEqual([]);
    expect(cd.calculate({ ...base, initialDeposit: '0' })).toEqual([]);
  });
});

describe('average-return-calculator audit', () => {
  // Oracle: CAGR = (end/start)^(1/n) - 1; series CAGR = (prod(1+r_i))^(1/n) - 1; arithmetic mean = sum/n.
  it('start/end mode $10,000 -> $18,000 in 5 years: CAGR 12.47%, simple average 16.00%, total 80.00%, 1.80x', () => {
    const r = averageReturn.calculate({ inputMode: 'simple', startingValue: '10000', endingValue: '18000', years: '5' });
    expect(val(r, 'cagr')).toBe('12.47%');
    expect(val(r, 'simpleAvg')).toBe('16.00%');
    expect(val(r, 'totalReturn')).toBe('80.00%');
    expect(val(r, 'growthMultiple')).toBe('1.80x');
    expect(val(r, 'difference')).toContain('3.53% difference');
  });

  it('$25,000 -> $42,500 in 7 years: CAGR 7.88%, simple 10.00%, total 70.00%', () => {
    const r = averageReturn.calculate({ inputMode: 'simple', startingValue: '25000', endingValue: '42500', years: '7' });
    expect(val(r, 'cagr')).toBe('7.88%');
    expect(val(r, 'simpleAvg')).toBe('10.00%');
    expect(val(r, 'totalReturn')).toBe('70.00%');
  });

  it('a loss: $10,000 -> $5,000 in 2 years is -29.29% CAGR (not -25%), total -50.00%; flat = 0.00%; fractional years 2.5', () => {
    const r = averageReturn.calculate({ inputMode: 'simple', startingValue: '10000', endingValue: '5000', years: '2' });
    expect(val(r, 'cagr')).toBe('-29.29%');
    expect(val(r, 'simpleAvg')).toBe('-25.00%');
    expect(val(r, 'totalReturn')).toBe('-50.00%');
    expect(val(averageReturn.calculate({ inputMode: 'simple', startingValue: '10000', endingValue: '10000', years: '3' }), 'cagr')).toBe('0.00%');
    expect(val(averageReturn.calculate({ inputMode: 'simple', startingValue: '1000', endingValue: '2000', years: '2.5' }), 'cagr')).toBe('31.95%');
  });

  it('annual list 22, -8, 15, 5, -3: CAGR 5.62%, mean 6.20%, cumulative 31.46%, 3 of 5 up', () => {
    const r = averageReturn.calculate({ inputMode: 'annual', returnsInput: '22, -8, 15, 5, -3' });
    expect(val(r, 'cagr')).toBe('5.62%');
    expect(val(r, 'simpleAvg')).toBe('6.20%');
    expect(val(r, 'totalReturn')).toBe('31.46%');
    expect(val(r, 'bestYear')).toBe('22.00%');
    expect(val(r, 'worstYear')).toBe('-8.00%');
    expect(val(r, 'positiveYears')).toBe('3 of 5 (60%)');
    expect(val(r, 'negativeYears')).toBe('2 of 5 (40%)');
  });

  it('+50%, -50%: arithmetic mean 0% but CAGR -13.40% and cumulative -25.00% (the 50/50 trap in the text)', () => {
    const r = averageReturn.calculate({ inputMode: 'annual', returnsInput: '50, -50' });
    expect(val(r, 'cagr')).toBe('-13.40%');
    expect(val(r, 'simpleAvg')).toBe('0.00%');
    expect(val(r, 'totalReturn')).toBe('-25.00%');
  });

  it('diagram series 50, -50, 35, 45, -10: CAGR 5.73% vs mean 14.00%', () => {
    const r = averageReturn.calculate({ inputMode: 'annual', returnsInput: '50, -50, 35, 45, -10' });
    expect(val(r, 'cagr')).toBe('5.73%');
    expect(val(r, 'simpleAvg')).toBe('14.00%');
    expect(val(r, 'totalReturn')).toBe('32.13%');
  });

  it('rejects a single return, a loss worse than -100%, and zero values', () => {
    expect(averageReturn.calculate({ inputMode: 'annual', returnsInput: '12' })).toEqual([]);
    expect(averageReturn.calculate({ inputMode: 'annual', returnsInput: '12, -120' })).toEqual([]);
    expect(averageReturn.calculate({ inputMode: 'simple', startingValue: '0', endingValue: '100', years: '3' })).toEqual([]);
  });
});

describe('boat-loan-calculator audit', () => {
  // Oracle: M = L r / (1 - (1+r)^-n) at r = APR/12; true total = down + M*n + maintenance*n.
  it('$50,000 boat, $10,000 down, 15 yrs at 8%, $300/mo upkeep: $382.26/mo, interest $28,806.95, true total $132,806.95', () => {
    const r = boatLoan.calculate({ boatPrice: '50000', downPayment: '10000', loanTerm: '180', interestRate: '8', monthlyMaintenance: '300' });
    expect(val(r, 'monthlyPayment')).toBe('$382.26');
    expect(val(r, 'trueMonthly')).toBe('$682.26');
    expect(val(r, 'totalInterest')).toBe('$28,806.95');
    expect(val(r, 'totalMaintenance')).toBe('$54,000.00');
    expect(val(r, 'trueTotal')).toBe('$132,806.95');
    expect(val(r, 'loanAmount')).toBe('$40,000.00');
    expect(val(r, 'downPct')).toBe('20%');
    expect(val(r, 'termYears')).toBe('15yr 0mo');
  });

  it('worked example: $45,000 / $9,000 down / 144 months at 8.5% / $400: $399.62, interest $21,545.28, true total $124,145.28', () => {
    const r = boatLoan.calculate({ boatPrice: '45000', downPayment: '9000', loanTerm: '144', interestRate: '8.5', monthlyMaintenance: '400' });
    expect(val(r, 'monthlyPayment')).toBe('$399.62');
    expect(val(r, 'totalInterest')).toBe('$21,545.28');
    expect(val(r, 'trueTotal')).toBe('$124,145.28');
  });

  it('$75,000 pontoon at 6.99%: 180 months = $606.33 / $41,639.72 interest; 120 months = $783.38 / $26,506.13', () => {
    const base = { boatPrice: '75000', downPayment: '7500', interestRate: '6.99', monthlyMaintenance: '350' };
    const long = boatLoan.calculate({ ...base, loanTerm: '180' });
    expect(val(long, 'monthlyPayment')).toBe('$606.33');
    expect(val(long, 'totalInterest')).toBe('$41,639.72');
    expect(val(long, 'trueMonthly')).toBe('$956.33');
    const short = boatLoan.calculate({ ...base, loanTerm: '120' });
    expect(val(short, 'monthlyPayment')).toBe('$783.38');
    expect(val(short, 'totalInterest')).toBe('$26,506.13');
    expect(val(short, 'trueMonthly')).toBe('$1,133.38');
  });

  it('0% APR and no upkeep: payment = loan / months; maintenance row shows N/A', () => {
    const r = boatLoan.calculate({ boatPrice: '20000', downPayment: '0', loanTerm: '60', interestRate: '0', monthlyMaintenance: '0' });
    expect(val(r, 'monthlyPayment')).toBe('$333.33');
    expect(val(r, 'totalInterest')).toBe('$0.00');
    expect(val(r, 'totalMaintenance')).toBe('N/A');
    expect(val(r, 'trueTotal')).toBe('$20,000.00');
  });

  it('down payment covering the price returns nothing', () => {
    expect(boatLoan.calculate({ boatPrice: '50000', downPayment: '50000', loanTerm: '180', interestRate: '8' })).toEqual([]);
  });
});

describe('mutual-fund-calculator audit', () => {
  // Oracle: monthly compounding at (return - expense ratio)/12, contributions at month end (ordinary annuity).
  // Headline balances are shown abbreviated ($691K, $1.15M) by the calculator; small balances print in full.
  it('$10,000 + $500/mo, 8% return, 1% fee, 30 years: $691,150 vs $854,537 without fees (fee drag $163,387 = 19.1%)', () => {
    const r = mutualFund.calculate({ initialInvestment: '10000', monthlyContribution: '500', expectedReturn: '8', expenseRatio: '1', investmentYears: '30' });
    expect(val(r, 'withFees')).toBe('$691K');
    expect(val(r, 'withoutFees')).toBe('$855K');
    expect(val(r, 'feeImpact')).toBe('$163K (19.1% of the no-fee balance)');
    expect(val(r, 'totalContributions')).toBe('$190K');
    expect(val(r, 'earningsWith')).toBe('$501K');
    expect(val(r, 'netReturn')).toBe('7.00%');
    expect(val(r, 'contributionPct')).toBe('27%');
  });

  it('lump sum $50,000, 9%, 1.25% fee, 35 years: $746,803 vs $1,153,169 (35.2% lost); 0.10% fee loses 3.4%', () => {
    const base = { initialInvestment: '50000', monthlyContribution: '0', expectedReturn: '9', investmentYears: '35' };
    const r = mutualFund.calculate({ ...base, expenseRatio: '1.25' });
    expect(val(r, 'withFees')).toBe('$747K');
    expect(val(r, 'withoutFees')).toBe('$1.15M');
    expect(val(r, 'feeImpact')).toBe('$406K (35.2% of the no-fee balance)');
    expect(val(r, 'netReturn')).toBe('7.75%');
    expect(val(mutualFund.calculate({ ...base, expenseRatio: '0.1' }), 'feeImpact')).toBe('$39K (3.4% of the no-fee balance)');
  });

  it('small balances print exactly: $100 + $5/mo, 8%, 0.5% fee, 2 years -> $245.16 vs $246.95 (drag $1.79)', () => {
    const r = mutualFund.calculate({ initialInvestment: '100', monthlyContribution: '5', expectedReturn: '8', expenseRatio: '0.5', investmentYears: '2' });
    expect(val(r, 'withFees')).toBe('$245.16');
    expect(val(r, 'withoutFees')).toBe('$246.95');
    expect(val(r, 'feeImpact')).toBe('$1.79 (0.7% of the no-fee balance)');
    expect(val(r, 'totalContributions')).toBe('$220.00');
    expect(val(r, 'earningsWith')).toBe('$25.16');
    const s = mutualFund.calculate({ initialInvestment: '200', monthlyContribution: '10', expectedReturn: '6', expenseRatio: '1', investmentYears: '5' });
    expect(val(s, 'withFees')).toBe('$936.73');
    expect(val(s, 'withoutFees')).toBe('$967.47');
  });

  it('a fee larger than the return makes the fund shrink: $50, 10% return, 12% fee, 3 years -> $47.09 (net -2.00%)', () => {
    const r = mutualFund.calculate({ initialInvestment: '50', monthlyContribution: '0', expectedReturn: '10', expenseRatio: '12', investmentYears: '3' });
    expect(val(r, 'withFees')).toBe('$47.09');
    expect(val(r, 'withoutFees')).toBe('$67.41');
    expect(val(r, 'netReturn')).toBe('-2.00%');
  });

  it('0% return and 0% fee: balance = contributions', () => {
    const r = mutualFund.calculate({ initialInvestment: '100', monthlyContribution: '10', expectedReturn: '0', expenseRatio: '0', investmentYears: '5' });
    expect(val(r, 'withFees')).toBe('$700.00');
    expect(val(r, 'feeImpact')).toBe('$0.00 (0.0% of the no-fee balance)');
  });

  it('zero or blank timeframe returns nothing', () => {
    expect(mutualFund.calculate({ initialInvestment: '1000', monthlyContribution: '0', expectedReturn: '8', expenseRatio: '1', investmentYears: '0' })).toEqual([]);
  });
});

describe('paycheck-calculator audit (2026 federal rules)', () => {
  // Oracle: IRS Rev. Proc. 2025-32 (2026 brackets + standard deduction $16,100 / $32,200 / $24,150) and SSA wage base $184,500, verified from the
  // published documents; taxable = wages - pre-tax deductions - standard deduction; FICA 6.2% (capped) + 1.45% + 0.9% above $200k/$250k.
  // Method: annual liability divided by pay periods (an estimate; Pub 15-T per-period withholding is not reproduced).
  it('$75,000 single, TX, bi-weekly, $5,000 401(k): fed $6,570, FICA $5,737.50, net $57,692.50 = $2,218.94 per check', () => {
    const r = paycheck.calculate({ payMode: 'salary', annualSalary: '75000', payFrequency: 'biweekly', filingStatus: 'single', state: 'TX', retirementContributions: '5000', preTaxDeductions: '' });
    expect(val(r, 'netPaycheck')).toBe('$2,218.94');
    expect(val(r, 'netAnnual')).toBe('$57,692.50');
    expect(val(r, 'fedPerPaycheck')).toBe('$252.69');
    expect(val(r, 'ficaPerPaycheck')).toBe('$220.67');
    expect(val(r, 'statePerPaycheck')).toBe('$0.00 (No state income tax on wages)');
    expect(val(r, 'marginalRate')).toBe('22%');
    expect(val(r, 'effectiveRate')).toBe('8.76%');
    expect(val(r, 'deductions')).toBe('$192.31');
    expect(val(r, 'grossAnnual')).toBe('$75,000.00');
  });

  it('$25/h x 40h weekly single, TX: gross $52,000, fed $4,060 ($78.08/wk), FICA $76.50/wk, net $845.42/wk', () => {
    const r = paycheck.calculate({ payMode: 'hourly', hourlyWage: '25', hoursPerWeek: '40', payFrequency: 'weekly', filingStatus: 'single', state: 'TX' });
    expect(val(r, 'grossAnnual')).toBe('$52,000.00');
    expect(val(r, 'fedPerPaycheck')).toBe('$78.08');
    expect(val(r, 'ficaPerPaycheck')).toBe('$76.50');
    expect(val(r, 'netPaycheck')).toBe('$845.42');
  });

  it('head of household, $30/h x 40h, $3,100 Section 125 benefits (cut FICA wages too): fed $3,864, FICA $4,536.45, net $4,241.63/mo, marginal 12%', () => {
    const r = paycheck.calculate({ payMode: 'hourly', hourlyWage: '30', hoursPerWeek: '40', payFrequency: 'monthly', filingStatus: 'hoh', state: 'TX', preTaxDeductions: '3100' });
    expect(val(r, 'fedPerPaycheck')).toBe('$322.00');
    expect(val(r, 'ficaPerPaycheck')).toBe('$378.04');
    expect(val(r, 'netPaycheck')).toBe('$4,241.63');
    expect(val(r, 'marginalRate')).toBe('12%');
    expect(val(r, 'deductions')).toBe('$258.33');
  });

  it('$250,000 single, $23,500 401(k): fed $43,784 (32% marginal), FICA $15,514 incl. SS cap + 0.9% Medicare surtax, net $6,430.85 bi-weekly', () => {
    const r = paycheck.calculate({ payMode: 'salary', annualSalary: '250000', payFrequency: 'biweekly', filingStatus: 'single', state: 'TX', retirementContributions: '23500' });
    expect(val(r, 'fedPerPaycheck')).toBe('$1,684.00');
    expect(val(r, 'ficaPerPaycheck')).toBe('$596.69');
    expect(val(r, 'netPaycheck')).toBe('$6,430.85');
    expect(val(r, 'marginalRate')).toBe('32%');
  });

  it('$120,000 MFJ in flat-3.07% Pennsylvania, semi-monthly: fed $10,040, FICA $9,180, PA $3,684 ($153.50), net $4,045.67', () => {
    const r = paycheck.calculate({ payMode: 'salary', annualSalary: '120000', payFrequency: 'semimonthly', filingStatus: 'mfj', state: 'PA' });
    expect(val(r, 'fedPerPaycheck')).toBe('$418.33');
    expect(val(r, 'ficaPerPaycheck')).toBe('$382.50');
    expect(val(r, 'statePerPaycheck')).toBe('$153.50');
    expect(label(r, 'statePerPaycheck')).toBe('Pennsylvania Tax / semimonthly');
    expect(val(r, 'netPaycheck')).toBe('$4,045.67');
    expect(val(r, 'marginalRate')).toBe('12%');
  });

  it('missing pay returns nothing', () => {
    expect(paycheck.calculate({ payMode: 'salary', annualSalary: '', payFrequency: 'biweekly', filingStatus: 'single', state: 'TX' })).toEqual([]);
    expect(paycheck.calculate({ payMode: 'hourly', hourlyWage: '20', hoursPerWeek: '', payFrequency: 'weekly', filingStatus: 'single', state: 'TX' })).toEqual([]);
  });
});

describe('refinance-calculator audit', () => {
  // Oracle: payments from the annuity formula on the current balance; break-even = ceil(closing / (old - new));
  // lifetime interest = payment * term - balance for the remaining old loan and the new loan.
  const sarah = { currentBalance: '250000', currentRate: '7.5', currentTerm: '300', newRate: '6', newTerm: '360', closingCosts: '6000', plannedStay: '60' };

  it('$250k, 7.5%/25y -> 6%/30y, $6,000 costs: $1,847 -> $1,499, saves $349/mo, break-even 18 months, net $14,916 over 60 months, interest saved $14,648', () => {
    const r = refinance.calculate(sarah);
    expect(val(r, 'oldPayment')).toBe('$1,847');
    expect(val(r, 'newPayment')).toBe('$1,499');
    expect(val(r, 'monthlySavings')).toBe('$349');
    expect(val(r, 'breakEven')).toBe('18 months (1.5 years)');
    expect(val(r, 'netBenefit')).toBe('$14,916');
    expect(val(r, 'totalInterestSaved')).toBe('$14,648');
    expect(val(r, 'recommendation')).toBe('Yes — Refinance now');
  });

  it('planned stay shorter than the break-even says wait', () => {
    const r = refinance.calculate({ ...sarah, plannedStay: '12' });
    expect(val(r, 'recommendation')).toBe('Wait — break-even (18mo) exceeds your stay (12mo)');
    expect(val(r, 'netBenefit')).toBe('Not yet break-even');
  });

  it('shorter term (20y -> 15y at 5.75%): payment rises $255, lifetime interest falls $88,391 ($82,891 after the $5,500 costs)', () => {
    const r = refinance.calculate({ currentBalance: '300000', currentRate: '6.5', currentTerm: '240', newRate: '5.75', newTerm: '180', closingCosts: '5500', plannedStay: '120' });
    expect(val(r, 'oldPayment')).toBe('$2,237');
    expect(val(r, 'newPayment')).toBe('$2,491');
    expect(val(r, 'monthlySavings')).toBe('No savings');
    expect(val(r, 'breakEven')).toBe('Never');
    expect(val(r, 'totalInterestSaved')).toBe('$88,391');
    expect(val(r, 'recommendation')).toBe('Yes — shorter term saves $82,891 in interest after closing costs (payment rises $255/mo)');
  });

  it('same or higher rate on the same term is a wait', () => {
    const same = refinance.calculate({ currentBalance: '200000', currentRate: '6', currentTerm: '300', newRate: '6', newTerm: '300', closingCosts: '3000', plannedStay: '60' });
    expect(val(same, 'recommendation')).toBe('Wait — your new rate is not lower');
    expect(val(same, 'breakEven')).toBe('Never');
    const higher = refinance.calculate({ currentBalance: '200000', currentRate: '6', currentTerm: '300', newRate: '6.5', newTerm: '300', closingCosts: '3000', plannedStay: '60' });
    expect(val(higher, 'recommendation')).toBe('Wait — your new rate is not lower');
    expect(val(higher, 'newPayment')).toBe('$1,350');
  });

  it('rate-and-term on a 10-year loan: 6.5% -> 6%, $1,000 costs: saves $51/mo, break-even 20 months, net $2,033 over 60', () => {
    const r = refinance.calculate({ currentBalance: '200000', currentRate: '6.5', currentTerm: '120', newRate: '6', newTerm: '120', closingCosts: '1000', plannedStay: '60' });
    expect(val(r, 'monthlySavings')).toBe('$51');
    expect(val(r, 'breakEven')).toBe('20 months (1.7 years)');
    expect(val(r, 'netBenefit')).toBe('$2,033');
    expect(val(r, 'totalInterestSaved')).toBe('$6,066');
  });

  it('resetting to 30 years can cut the payment while raising lifetime interest: $200k 7%/20y -> 6.5%/30y saves $286/mo but costs $82,945 more interest', () => {
    const r = refinance.calculate({ currentBalance: '200000', currentRate: '7', currentTerm: '240', newRate: '6.5', newTerm: '360', closingCosts: '0', plannedStay: '24' });
    expect(val(r, 'monthlySavings')).toBe('$286');
    expect(val(r, 'totalInterestSaved')).toBe('No savings');
    expect(val(r, 'netBenefit')).toBe('$6,875');
  });

  it('rejects a zero balance and a sub-month term', () => {
    expect(refinance.calculate({ ...sarah, currentBalance: '0' })).toEqual([]);
    expect(refinance.calculate({ ...sarah, newTerm: '0' })).toEqual([]);
  });
});

describe('payback-period-calculator audit', () => {
  // Oracle: simple = I / CF; discounted payback accumulates CF / (1+r)^y year by year with linear interpolation in the recovery year;
  // NPV = -I + sum CF_y / (1+r)^y over the project life (a fractional last year is pro-rated); PI = PV of inflows / I.
  it('$50,000, $12,000/yr, 8%, 10-year life: simple 4.2, discounted 5.3, NPV $30,521, PI 1.61x', () => {
    const r = paybackPeriod.calculate({ initialInvestment: '50000', annualCashFlow: '12000', useDiscounted: 'discounted', discountRate: '8', projectLife: '10' });
    expect(val(r, 'simplePayback')).toBe('4.2 years');
    expect(val(r, 'discountedPayback')).toBe('5.3 years');
    expect(val(r, 'npv')).toBe('$30,521');
    expect(val(r, 'profitIndex')).toBe('1.61x');
    expect(val(r, 'totalReturn')).toBe('$120,000');
    expect(val(r, 'discountRateUsed')).toBe('8.0%');
    expect(label(r, 'profitIndex')).toBe('Profitability Index');
  });

  it('$75,000, $22,000/yr, 10%, 8-year life: simple 3.4, discounted 4.4, NPV $42,368, PI 1.56x', () => {
    const r = paybackPeriod.calculate({ initialInvestment: '75000', annualCashFlow: '22000', useDiscounted: 'discounted', discountRate: '10', projectLife: '8' });
    expect(val(r, 'simplePayback')).toBe('3.4 years');
    expect(val(r, 'discountedPayback')).toBe('4.4 years');
    expect(val(r, 'npv')).toBe('$42,368');
    expect(val(r, 'profitIndex')).toBe('1.56x');
    expect(val(r, 'totalReturn')).toBe('$176,000');
  });

  it('ongoing project: 10% -> discounted payback 5.7 yr (quick-reference), 20% -> 9.8 yr; yield 24.0%; no NPV shown', () => {
    const base = { initialInvestment: '50000', annualCashFlow: '12000', useDiscounted: 'discounted', projectLife: '' };
    const r10 = paybackPeriod.calculate({ ...base, discountRate: '10' });
    expect(val(r10, 'simplePayback')).toBe('4.2 years');
    expect(val(r10, 'discountedPayback')).toBe('5.7 years');
    expect(val(r10, 'totalReturn')).toBe('Ongoing');
    expect(val(r10, 'profitIndex')).toBe('24.0%');
    expect(val(r10, 'npv')).toBeUndefined();
    expect(val(paybackPeriod.calculate({ ...base, discountRate: '20' }), 'discountedPayback')).toBe('9.8 years');
  });

  it('fractional 2.5-year life that never recovers the cost: NPV -$835, PI 0.92x, discounted payback never', () => {
    const r = paybackPeriod.calculate({ initialInvestment: '10000', annualCashFlow: '4000', useDiscounted: 'discounted', discountRate: '5', projectLife: '2.5' });
    expect(val(r, 'simplePayback')).toBe('2.5 years');
    expect(val(r, 'discountedPayback')).toBe('Never within the project life (TVM-adjusted cash flows do not recoup the investment)');
    expect(val(r, 'npv')).toBe('-$835');
    expect(val(r, 'profitIndex')).toBe('0.92x');
    expect(val(r, 'totalReturn')).toBe('$10,000');
  });

  it('simple mode with a 3-year life: payback 4.2 exceeds life, undiscounted multiple 0.72x is not called a profitability index', () => {
    const r = paybackPeriod.calculate({ initialInvestment: '50000', annualCashFlow: '12000', useDiscounted: 'simple', projectLife: '3' });
    expect(val(r, 'simplePayback')).toBe('> 3.0 years (exceeds project life)');
    expect(val(r, 'totalReturn')).toBe('$36,000');
    expect(val(r, 'profitIndex')).toBe('0.72x');
    expect(label(r, 'profitIndex')).toBe('Return Multiple (undiscounted cash ÷ investment)');
    expect(val(r, 'discountedPayback')).toBeUndefined();
  });

  it('zero cash flow or investment returns nothing', () => {
    expect(paybackPeriod.calculate({ initialInvestment: '50000', annualCashFlow: '0', useDiscounted: 'simple' })).toEqual([]);
    expect(paybackPeriod.calculate({ initialInvestment: '0', annualCashFlow: '1000', useDiscounted: 'simple' })).toEqual([]);
  });
});

describe('arv-flipping-calculator audit', () => {
  // Oracle: MAO = ARV (1 - margin) - repairs - holding; profit at MAO = ARV - (MAO + repairs + holding); ROI = profit / total cost; 70% rule = 0.7 ARV - repairs.
  it('ARV $300,000, repairs $50,000, holding $15,000, 20% margin: MAO $175,000, profit $60,000, ROI 25.0%, 70% rule $160,000', () => {
    const r = arvFlipping.calculate({ afterRepairValue: '300000', repairCosts: '50000', holdingCosts: '15000', targetProfitMargin: '20' });
    expect(val(r, 'mao')).toBe('$175,000');
    expect(val(r, 'estimatedProfit')).toBe('$60,000');
    expect(val(r, 'roiPercent')).toBe('25.0%');
    expect(val(r, 'seventyPercentRule')).toBe('$160,000');
    expect(val(r, 'totalCosts')).toBe('$240,000');
  });

  it('ARV $200,000, repairs $30,000, holding $10,000, 15% margin: MAO $130,000, profit $30,000, ROI 17.6%', () => {
    const r = arvFlipping.calculate({ afterRepairValue: '200000', repairCosts: '30000', holdingCosts: '10000', targetProfitMargin: '15' });
    expect(val(r, 'mao')).toBe('$130,000');
    expect(val(r, 'estimatedProfit')).toBe('$30,000');
    expect(val(r, 'roiPercent')).toBe('17.6%');
    expect(val(r, 'seventyPercentRule')).toBe('$110,000');
    expect(val(r, 'totalCosts')).toBe('$170,000');
  });

  it('costs that swallow the margin give MAO $0 (not a negative offer) and a negative-flagged result', () => {
    const r = arvFlipping.calculate({ afterRepairValue: '300000', repairCosts: '200000', holdingCosts: '100000', targetProfitMargin: '20' });
    expect(val(r, 'mao')).toBe('$0');
    expect((r as { id: string; color?: string }[]).find((x) => x.id === 'mao')?.color).toBe('negative');
    expect(val(r, 'seventyPercentRule')).toBe('$10,000');
  });

  it('0% margin: MAO = ARV - costs = $235,000, zero profit; margin above 100% is rejected', () => {
    const r = arvFlipping.calculate({ afterRepairValue: '300000', repairCosts: '50000', holdingCosts: '15000', targetProfitMargin: '0' });
    expect(val(r, 'mao')).toBe('$235,000');
    expect(val(r, 'estimatedProfit')).toBe('$0');
    expect(arvFlipping.calculate({ afterRepairValue: '300000', repairCosts: '50000', holdingCosts: '15000', targetProfitMargin: '120' })).toEqual([]);
  });
});

describe('capital-gains-tax-calculator audit (2026 brackets)', () => {
  // Oracle: IRS Rev. Proc. 2025-32 section 3.03 (0%/15% ceilings: single $49,450/$545,500, MFJ $98,900/$613,700, HoH $66,200/$579,600)
  // and the 2026 ordinary tables, with the gain stacked on top of ordinary income bracket by bracket; NIIT = 3.8% x min(gain, MAGI - threshold).
  const lt = { assetType: 'Stocks', purchaseDate: '2020-01-10', saleDate: '2025-06-10', filingStatus: 'Single', stateTaxRate: '0' };

  it('Elena: $18,500 gain on $92,000 income, 1,160 days: all at 15% = $2,775, after-tax $28,225 (short-term would be $4,166)', () => {
    const base = { assetType: 'Stocks', purchaseDate: '2023-01-15', saleDate: '2026-03-20', costBasis: '12500', saleProceeds: '31000', annualIncome: '92000', filingStatus: 'Single', stateTaxRate: '0' };
    const r = capitalGains.calculate(base);
    expect(val(r, 'gainLoss')).toBe('$18,500.00');
    expect(val(r, 'holdingPeriod')).toBe('1160 days');
    expect(val(r, 'holdingPeriodType')).toBe('Long-Term (held more than one year)');
    expect(val(r, 'federalTax')).toBe('$2,775.00');
    expect(val(r, 'totalTax')).toBe('$2,775.00');
    expect(val(r, 'effectiveRate')).toBe('15.00%');
    expect(val(r, 'afterTaxProceeds')).toBe('$28,225.00');
    const st = capitalGains.calculate({ ...base, purchaseDate: '2025-12-01' });
    expect(val(st, 'federalTax')).toBe('$4,166.00');
  });

  it('the gain straddles the 0%/15% line: $40,000 income + $30,000 gain = 9,450 at 0% + 20,550 at 15% = $3,082.50', () => {
    const r = capitalGains.calculate({ ...lt, costBasis: '10000', saleProceeds: '40000', annualIncome: '40000' });
    expect(val(r, 'federalTax')).toBe('$3,082.50');
    expect(val(r, 'niitTax')).toBeUndefined();
  });

  it('straddles 15%/20% plus NIIT and 5% state: $540,000 income + $20,000 gain -> fed $3,725, NIIT $760, state $1,000, total $5,485', () => {
    const r = capitalGains.calculate({ ...lt, costBasis: '10000', saleProceeds: '30000', annualIncome: '540000', stateTaxRate: '5' });
    expect(val(r, 'federalTax')).toBe('$3,725.00');
    expect(val(r, 'niitTax')).toBe('$760.00');
    expect(val(r, 'stateTax')).toBe('$1,000.00');
    expect(val(r, 'totalTax')).toBe('$5,485.00');
  });

  it('Johnsons (MFJ, $175,000, short-term crypto $14,000 gain, 330 days, 9.9% state): fed $3,080, state $1,386, total $4,466, keep $17,534', () => {
    const r = capitalGains.calculate({ assetType: 'Crypto', purchaseDate: '2025-11-05', saleDate: '2026-10-01', costBasis: '8000', saleProceeds: '22000', annualIncome: '175000', filingStatus: 'Married Filing Jointly', stateTaxRate: '9.9' });
    expect(val(r, 'holdingPeriod')).toBe('330 days');
    expect(val(r, 'holdingPeriodType')).toBe('Short-Term (held one year or less)');
    expect(val(r, 'federalTax')).toBe('$3,080.00');
    expect(val(r, 'stateTax')).toBe('$1,386.00');
    expect(val(r, 'totalTax')).toBe('$4,466.00');
    expect(val(r, 'afterTaxProceeds')).toBe('$17,534.00');
    expect(val(r, 'effectiveRate')).toBe('31.90%');
    // had they waited until Nov 6, 2026 (long term): 15% x 14,000 = $2,100, i.e. $980 less federal tax
    const waited = capitalGains.calculate({ assetType: 'Crypto', purchaseDate: '2025-11-05', saleDate: '2026-11-06', costBasis: '8000', saleProceeds: '22000', annualIncome: '175000', filingStatus: 'Married Filing Jointly', stateTaxRate: '9.9' });
    expect(val(waited, 'federalTax')).toBe('$2,100.00');
  });

  it('short-term gain crossing the 24%/32% line with NIIT: $200,000 income + $50,000 gain -> fed $15,858, NIIT $1,900', () => {
    const r = capitalGains.calculate({ assetType: 'Stocks', purchaseDate: '2026-01-02', saleDate: '2026-06-02', costBasis: '10000', saleProceeds: '60000', annualIncome: '200000', filingStatus: 'Single', stateTaxRate: '0' });
    expect(val(r, 'federalTax')).toBe('$15,858.00');
    expect(val(r, 'niitTax')).toBe('$1,900.00');
    expect(val(r, 'totalTax')).toBe('$17,758.00');
    expect(val(r, 'effectiveRate')).toBe('35.52%');
  });

  it('long-term collectibles are taxed at ordinary rates capped at 28%: $100,000 income + $30,000 gain = $1,254 + $5,832 = $7,086', () => {
    const r = capitalGains.calculate({ ...lt, assetType: 'Collectibles', costBasis: '10000', saleProceeds: '40000', annualIncome: '100000' });
    expect(val(r, 'federalTax')).toBe('$7,086.00');
    expect(val(r, 'effectiveRate')).toBe('23.62%');
  });

  it('head of household uses the $66,200 zero-rate ceiling: $60,000 income + $20,000 gain = $2,070; MFJ high earner: $19,315 + NIIT $3,800', () => {
    const hoh = capitalGains.calculate({ ...lt, filingStatus: 'Head of Household', costBasis: '10000', saleProceeds: '30000', annualIncome: '60000' });
    expect(val(hoh, 'federalTax')).toBe('$2,070.00');
    const mfj = capitalGains.calculate({ ...lt, filingStatus: 'Married Filing Jointly', costBasis: '50000', saleProceeds: '150000', annualIncome: '600000' });
    expect(val(mfj, 'federalTax')).toBe('$19,315.00');
    expect(val(mfj, 'niitTax')).toBe('$3,800.00');
    expect(val(mfj, 'totalTax')).toBe('$23,115.00');
  });

  it('holding period is "more than one year" counted from the anniversary, including leap years', () => {
    const type = (purchaseDate: string, saleDate: string) =>
      val(capitalGains.calculate({ ...lt, purchaseDate, saleDate, costBasis: '1000', saleProceeds: '2000', annualIncome: '50000' }), 'holdingPeriodType')?.split(' ')[0];
    expect(type('2023-03-01', '2024-03-01')).toBe('Short-Term'); // 366 days but exactly one year
    expect(type('2023-03-01', '2024-03-02')).toBe('Long-Term');
    expect(type('2024-01-15', '2025-01-15')).toBe('Short-Term'); // 366 days across 29 Feb 2024
    expect(type('2024-01-15', '2025-01-16')).toBe('Long-Term');
    expect(type('2020-02-29', '2021-02-28')).toBe('Short-Term');
    expect(type('2020-02-29', '2021-03-01')).toBe('Long-Term');
  });

  it('a capital loss shows the minus sign before the dollar sign and no tax lines', () => {
    const r = capitalGains.calculate({ ...lt, costBasis: '20000', saleProceeds: '15000', annualIncome: '80000' });
    expect(val(r, 'gainLoss')).toBe('-$5,000');
    expect(val(r, 'totalTax')).toBeUndefined();
  });

  it('sale on or before purchase returns nothing', () => {
    expect(capitalGains.calculate({ ...lt, purchaseDate: '2025-06-10', saleDate: '2025-06-10', costBasis: '1000', saleProceeds: '2000', annualIncome: '50000' })).toEqual([]);
  });
});

describe('percent-off-calculator audit', () => {
  // Oracle: final = price (1 - d1)(1 - d2)(1 + tax); effective discount = (price - discounted) / price; stacking gap = (d1 + d2) - effective.
  it('single 25% off $80: $60.00, saves $20.00, effective 25.00%, no gap line', () => {
    const r = percentOff.calculate({ price: '80', discount1: '25', discount2: '', tax: '' });
    expect(val(r, 'final')).toBe('$60.00');
    expect(val(r, 'saved')).toBe('$20.00');
    expect(val(r, 'effective')).toBe('25.00%');
    expect(val(r, 'gap')).toBeUndefined();
  });

  it('$200 with 40% + 30% and 8.25% tax: $84.00 + $6.93 tax = $90.93; effective 58.00% (not 70%), gap 12.00 points', () => {
    const r = percentOff.calculate({ price: '200', discount1: '40', discount2: '30', tax: '8.25' });
    expect(val(r, 'firstDisc')).toBe('$120.00');
    expect(val(r, 'secondDisc')).toBe('$84.00');
    expect(val(r, 'tax')).toBe('+$6.93');
    expect(val(r, 'final')).toBe('$90.93');
    expect(val(r, 'saved')).toBe('$116.00');
    expect(val(r, 'effective')).toBe('58.00%');
    expect(val(r, 'gap')).toBe('58.00% (12.00 percentage points less)');
  });

  it('$100 with 20% + 10% = $72.00 (28%, 2 points below 30%)', () => {
    const r = percentOff.calculate({ price: '100', discount1: '20', discount2: '10', tax: '' });
    expect(val(r, 'final')).toBe('$72.00');
    expect(val(r, 'effective')).toBe('28.00%');
    expect(val(r, 'gap')).toBe('28.00% (2.00 percentage points less)');
  });

  it('$59.99 with 15% + 5% and 7.5% tax: $52.08 final, effective 19.25%, saved $11.55', () => {
    const r = percentOff.calculate({ price: '59.99', discount1: '15', discount2: '5', tax: '7.5' });
    expect(val(r, 'final')).toBe('$52.08');
    expect(val(r, 'saved')).toBe('$11.55');
    expect(val(r, 'effective')).toBe('19.25%');
  });

  it('100% off is free before tax; out-of-range percentages give an input error; blank price gives nothing', () => {
    const free = percentOff.calculate({ price: '120', discount1: '100', discount2: '', tax: '5' });
    expect(val(free, 'final')).toBe('$0.00');
    expect(val(free, 'effective')).toBe('100.00%');
    expect(val(percentOff.calculate({ price: '100', discount1: '120' }), 'err')).toBe('Discounts and tax must each be between 0% and 100%.');
    expect(percentOff.calculate({ price: '', discount1: '10' })).toEqual([]);
  });
});
