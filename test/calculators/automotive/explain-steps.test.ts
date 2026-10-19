import { describe, it, expect } from 'vitest';
import type { CalculatorConfig, ExplainStep } from '../../../src/types/calculator';
import { rangeErrors, seedDefaults } from '../../../src/lib/initialForm';
import autoLoan from '../../../src/calculators/automotive/auto-loan';
import mpg from '../../../src/calculators/automotive/mpg-calculator';
import tripFuel from '../../../src/calculators/automotive/trip-fuel-cost';
import depreciation from '../../../src/calculators/automotive/depreciation';
import profitMargin from '../../../src/calculators/ecommerce/profit-margin';
import marginCalc from '../../../src/calculators/ecommerce/margin-calculator';
import roas from '../../../src/calculators/ecommerce/roas';
import breakEven from '../../../src/calculators/ecommerce/break-even';
import cpmCpc from '../../../src/calculators/ecommerce/cpm-cpc';
import paymentFees from '../../../src/calculators/ecommerce/payment-fees';
import etsyFees from '../../../src/calculators/ecommerce/etsy-fees';
import concreteSlab from '../../../src/calculators/diy/concrete-slab';
import paint from '../../../src/calculators/diy/paint-coverage';
import drywall from '../../../src/calculators/diy/drywall';

// Oracle: every pinned number below was computed independently in Python's decimal module (60-digit precision,
// ROUND_HALF_UP, `python -I`), not by running the calculators. Fractional-year depreciation uses Decimal powers;
// the reverse payment-fee invoice is a whole-cent search; bag and sheet counts use an exact ceiling.

type V = Record<string, string>;
const defaults = (c: CalculatorConfig) => seedDefaults(c.inputs);
const blank = (c: CalculatorConfig) => Object.fromEntries(c.inputs.map((i) => [i.id, '']));
const steps = (c: CalculatorConfig, v: V): ExplainStep[] => c.explainSteps!(v);
const val = (c: CalculatorConfig, v: V, id: string) => c.calculate(v).find((r) => r.id === id)!.value;
// Strip thousands separators so the pinned strings do not depend on the runner's locale.
const exprs = (c: CalculatorConfig, v: V) => steps(c, v).map((s) => s.expr.replace(/(\d),(?=\d{3})/g, '$1'));
const strip = (s: string) => s.replace(/(\d),(?=\d{3})/g, '$1');

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

describe('explainSteps - the worked solution agrees with the displayed result (default values)', () => {
  // [name, config, ids whose value must appear in the LAST step, ids whose value must appear somewhere]
  const cases: [string, CalculatorConfig, string[], string[]][] = [
    ['auto-loan', autoLoan, ['totalInterest'], ['monthlyPayment', 'outTheDoor', 'totalFinanced', 'salesTaxLine']],
    ['mpg-calculator', mpg, ['mpg', 'l100km', 'kpl'], []],
    ['trip-fuel-cost', tripFuel, ['perPerson'], ['totalCost']],
    ['depreciation', depreciation, ['annualDepreciation', 'monthlyDepreciation'], ['futureValue']],
    ['profit-margin', profitMargin, ['primary'], ['profit', 'markup']],
    ['margin-calculator', marginCalc, ['solvedValue', 'grossProfit'], []],
    ['roas', roas, ['profitAfterAds'], ['roas', 'cpa', 'profitFromAds']],
    ['break-even', breakEven, ['breakEvenUnits'], ['breakEvenRevenue']],
    ['cpm-cpc', cpmCpc, ['cpm', 'cpc', 'ctr', 'totalSpend'], []],
    ['payment-fees', paymentFees, ['netAmount'], ['fee']],
    ['etsy-fees', etsyFees, ['netProfit', 'profitMargin'], ['totalFees', 'totalSale', 'listingFee']],
    ['concrete-slab', concreteSlab, ['cubicYards'], ['cubicFeet', 'bags60', 'bags80']],
    ['paint-coverage', paint, ['gallons', 'containers'], ['paintableArea', 'totalWallArea']],
    ['drywall', drywall, ['sheets', 'screws', 'jointCompound'], ['wallArea']],
  ];
  for (const [name, config, lastIds, anyIds] of cases) {
    it(name, () => {
      const v = defaults(config);
      expect(config.calculate(v).length).toBeGreaterThan(0);
      const s = steps(config, v);
      expect(s.length).toBeGreaterThanOrEqual(3);
      expect(s.length).toBeLessThanOrEqual(6);
      const last = strip(s[s.length - 1].expr);
      const all = strip(s.map((x) => x.expr).join(' | '));
      for (const id of lastIds) {
        // the page prints e.g. "$4,589/year"; the worked step carries the same text
        const shown = strip(val(config, v, id)).replace(/ \(.*\)$/, '');
        expect(last, `last step should carry ${id} = ${shown}`).toContain(shown);
      }
      for (const id of anyIds) {
        const shown = strip(val(config, v, id));
        const head = shown.split(' (')[0].split(' — ')[0].replace(/^Sales Tax.*/, '');
        if (head) expect(all, `some step should carry ${id} = ${head}`).toContain(head);
      }
    });
  }
});

describe('explainSteps - blank, invalid and runaway input never print NaN/Infinity', () => {
  const all: [string, CalculatorConfig][] = [
    ['auto-loan', autoLoan], ['mpg-calculator', mpg], ['trip-fuel-cost', tripFuel], ['depreciation', depreciation],
    ['profit-margin', profitMargin], ['margin-calculator', marginCalc], ['roas', roas], ['break-even', breakEven],
    ['cpm-cpc', cpmCpc], ['payment-fees', paymentFees], ['etsy-fees', etsyFees], ['concrete-slab', concreteSlab],
    ['paint-coverage', paint], ['drywall', drywall],
  ];
  for (const [name, config] of all) {
    it(`${name}: empty and blank values -> []`, () => {
      expect(steps(config, {})).toEqual([]);
      expect(steps(config, blank(config))).toEqual([]);
    });
    it(`${name}: junk in every number field is either clean or empty`, () => {
      for (const junk of ['abc', '-1', '0', '1e999', '1e308']) {
        const v = defaults(config);
        for (const i of config.inputs) if (i.type === 'number') v[i.id] = junk;
        // the form never calls into a calculator while a field is out of its declared range
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
          const v = defaults(config);
          v[i.id] = junk;
          if (Object.keys(rangeErrors(config.inputs, v)).length) continue;
          for (const st of steps(config, v)) expect(`${st.label} ${st.expr} ${st.note ?? ''}`, `${i.id}=${junk}`).not.toMatch(/NaN|Infinity|undefined/);
        }
      }
    });
  }
});

describe('auto-loan explainSteps', () => {
  const marcus = { vehiclePrice: '28000', loanTerm: '60', interestRate: '6.9', downPayment: '5000', tradeInValue: '8000', tradeInOwed: '0', salesTaxPct: '7', tradeInTaxCredit: 'yes', titleRegFees: '400' };
  it('paid-off trade-in', () => {
    expectSteps(autoLoan, marcus, [
      ['Taxable = $28000.00 − $8000.00 trade-in value = $20000.00', 'tax = $20000.00 × 7% = $1400.00'],
      ['$28000.00 + $1400.00 + $400.00 = $29800.00'],
      ['$29800.00 − $8000.00 (trade-in value $8000.00 − owed $0.00) − $5000.00 down = $16800.00 financed'],
      ['r = 6.9% ÷ 12 = 0.5750% = 0.005750', '(1 + r)^60 = 1.4106'],
      ['M = $16800.00 ×', '= $331.87/month'],
      ['$331.87 × 60 payments ≈ $19912.08', 'minus $16800.00 financed = $3112.08 interest'],
    ]);
  });
  it('underwater trade-in rolls negative equity into the loan', () => {
    const v = { vehiclePrice: '42000', loanTerm: '72', interestRate: '8.5', downPayment: '2000', tradeInValue: '15000', tradeInOwed: '18000', salesTaxPct: '6', tradeInTaxCredit: 'yes', titleRegFees: '600' };
    const e = exprs(autoLoan, v);
    expect(e[0]).toContain('tax = $27000.00 × 6% = $1620.00');
    expect(e[1]).toBe('$42000.00 + $1620.00 + $600.00 = $44220.00');
    expect(e[2]).toBe('$44220.00 + $3000.00 negative equity (owed $18000.00 − value $15000.00) − $2000.00 down = $45220.00 financed');
    expect(e[3]).toContain('0.007083');
    expect(e[3]).toContain('(1 + r)^72 = 1.6623');
    expect(e[4]).toContain('= $803.94/month');
    expect(e[5]).toContain('= $12663.58 interest');
    expect(steps(autoLoan, v)[2].note).toContain('shortfall');
  });
  it('no trade-in tax credit taxes the full price', () => {
    const v = { ...marcus, vehiclePrice: '35000', loanTerm: '36', downPayment: '5000', tradeInOwed: '5000', salesTaxPct: '8', titleRegFees: '500', tradeInTaxCredit: 'no' };
    expectSteps(autoLoan, v, [
      ['Taxable = $35000.00 (no trade-in credit)', 'tax = $35000.00 × 8% = $2800.00'],
      ['= $38300.00'],
      ['= $30300.00 financed'],
      ['(1 + r)^36 = 1.2293'],
      ['= $934.19/month'],
      ['= $3330.89 interest'],
    ]);
  });
  it('0% APR just divides the loan evenly', () => {
    const v = { ...marcus, vehiclePrice: '24000', loanTerm: '48', interestRate: '0', downPayment: '0', tradeInValue: '0', salesTaxPct: '0', titleRegFees: '0' };
    expectSteps(autoLoan, v, [
      ['tax = $24000.00 × 0% = $0.00'],
      ['= $24000.00'],
      ['= $24000.00 financed'],
      ['M = $24000.00 ÷ 48 months = $500.00/month'],
      ['≈ $24000.00', '= $0.00 interest'],
    ]);
  });
  it('returns [] when there is no loan or no price', () => {
    expect(steps(autoLoan, { ...marcus, downPayment: '99999' })).toEqual([]);
    expect(steps(autoLoan, { ...marcus, vehiclePrice: '' })).toEqual([]);
    expect(steps(autoLoan, { ...marcus, interestRate: '' })).toEqual([]);
    expect(steps(autoLoan, { ...marcus, loanTerm: '0' })).toEqual([]);
  });
});

describe('mpg-calculator explainSteps', () => {
  it('mpg from miles and gallons', () => {
    expectSteps(mpg, defaults(mpg), [
      ['MPG = 350 miles ÷ 12.5 gallons = 28.00 MPG'],
      ['235.2146 ÷ 28.00 = 8.40 L/100km'],
      ['28.00 × 1.609344 ÷ 3.785411784 = 11.90 km/L'],
      ['28.00 MPG = 8.40 L/100km = 11.90 km/L'],
    ]);
  });
  it('fractional mpg', () => {
    const e = exprs(mpg, { mode: 'mpg', milesDriven: '275', gallonsUsed: '10' });
    expect(e[0]).toBe('MPG = 275 miles ÷ 10 gallons = 27.50 MPG');
    expect(e[1]).toBe('L/100km = 235.2146 ÷ 27.50 = 8.55 L/100km');
    expect(e[3]).toBe('27.50 MPG = 8.55 L/100km = 11.69 km/L');
  });
  it('trip cost', () => {
    const v = { mode: 'tripcost', milesDriven: '350', mpg: '30', fuelPrice: '3.50' };
    expectSteps(mpg, v, [
      ['350 miles ÷ 30 MPG = 11.667 gallons'],
      ['11.667 gallons × $3.50/gallon = $40.83'],
      ['$40.83 trip cost ÷ 350 miles = $0.12/mile'],
    ]);
    expect(val(mpg, v, 'tripCost')).toBe('$40.83');
    expect(val(mpg, v, 'costPerMile')).toBe('$0.12/mile');
  });
  it('range keeps a 10% reserve', () => {
    const v = { mode: 'range', tankSize: '15', mpg: '30' };
    expectSteps(mpg, v, [
      ['15 gallons × 30 MPG = 450.00 miles on a full tank'],
      ['15 × 0.9 = 13.50 gallons usable'],
      ['13.50 gallons × 30 MPG = 405.00 miles (full tank: 450.00 miles)'],
    ]);
    expect(val(mpg, v, 'usable')).toBe('405.00 miles');
  });
  it('MPG to L/100km conversion', () => {
    const v = { mode: 'convert', mpg: '30' };
    expectSteps(mpg, v, [
      ['100 × 3.785411784 L ÷ 1.609344 km = 235.2146'],
      ['235.2146 ÷ 30 = 7.84 L/100km'],
      ['30 × 1.609344 ÷ 3.785411784 = 12.75 km/L'],
      ['30.00 MPG = 7.84 L/100km = 12.75 km/L'],
    ]);
    expect(val(mpg, v, 'l100km')).toBe('7.84 L/100km');
  });
  it('returns [] for zero gallons, zero miles or zero mpg', () => {
    expect(steps(mpg, { mode: 'mpg', milesDriven: '350', gallonsUsed: '0' })).toEqual([]);
    expect(steps(mpg, { mode: 'mpg', milesDriven: '0', gallonsUsed: '10' })).toEqual([]);
    expect(steps(mpg, { mode: 'tripcost', milesDriven: '350', mpg: '0', fuelPrice: '3.5' })).toEqual([]);
    expect(steps(mpg, { mode: 'convert', mpg: '0' })).toEqual([]);
    expect(steps(mpg, { mode: 'range', tankSize: '', mpg: '30' })).toEqual([]);
  });
});

describe('trip-fuel-cost explainSteps', () => {
  const base = { distance: '500', distanceUnit: 'miles', fuelEfficiency: '28', efficiencyUnit: 'mpg', fuelPrice: '3.50', passengers: '1' };
  it('miles and MPG, one person', () => {
    expectSteps(tripFuel, base, [
      ['Distance = 500.00 miles'],
      ['500.00 miles ÷ 28 MPG = 17.857 gallons'],
      ['17.857 gallons × $3.50 per gallon = $62.50'],
      ['$62.50 ÷ 1 person = $62.50 each'],
    ]);
  });
  it('split between three people', () => {
    expect(exprs(tripFuel, { ...base, passengers: '3' })[3]).toBe('$62.50 ÷ 3 people = $20.83 each');
  });
  it('kilometers and L/100km', () => {
    const v = { distance: '800', distanceUnit: 'km', fuelEfficiency: '7.2', efficiencyUnit: 'l100km', fuelPrice: '1.65', passengers: '4' };
    expectSteps(tripFuel, v, [
      ['Distance = 800.00 km'],
      ['800.00 km × 7.2 L/100km ÷ 100 = 57.600 liters'],
      ['57.600 liters × $1.65 per liter = $95.04'],
      ['$95.04 ÷ 4 people = $23.76 each'],
    ]);
    expect(val(tripFuel, v, 'totalCost')).toBe('$95.04');
  });
  it('kilometers with MPG converts to miles first', () => {
    expectSteps(tripFuel, { ...base, distance: '300', distanceUnit: 'km', fuelEfficiency: '30', passengers: '2' }, [
      ['300.00 km ÷ 1.609344 = 186.41 miles'],
      ['186.41 miles ÷ 30 MPG = 6.214 gallons'],
      ['= $21.75'],
      ['$21.75 ÷ 2 people = $10.87 each'],
    ]);
  });
  it('miles with L/100km converts to kilometers first', () => {
    expectSteps(tripFuel, { distance: '250', distanceUnit: 'miles', fuelEfficiency: '8', efficiencyUnit: 'l100km', fuelPrice: '1.5', passengers: '1' }, [
      ['250.00 miles × 1.609344 = 402.34 km'],
      ['402.34 km × 8 L/100km ÷ 100 = 32.187 liters'],
      ['= $48.28'],
      ['$48.28 ÷ 1 person'],
    ]);
  });
  it('returns [] for negative distance, zero efficiency, blank price', () => {
    expect(steps(tripFuel, { ...base, distance: '-5' })).toEqual([]);
    expect(steps(tripFuel, { ...base, fuelEfficiency: '0' })).toEqual([]);
    expect(steps(tripFuel, { ...base, fuelPrice: '' })).toEqual([]);
  });
});

describe('depreciation explainSteps', () => {
  it('new average vehicle over five years', () => {
    expectSteps(depreciation, defaults(depreciation), [
      ['Year 1: 20% · Year 2: 15% · Year 3: 12% · Year 4: 10% · Year 5: 9%'],
      ['$45000 × 0.80 × 0.85 × 0.88 × 0.90 × 0.91 = $22054'],
      ['$45000 − $22054 = $22946; ÷ $45000 = 51.0%'],
      ['$22946 total ÷ 5 years = $4589/year, or $382/month'],
    ]);
    expect(steps(depreciation, defaults(depreciation))[0].note).toContain('illustrative');
  });
  it('used truck at a fractional age uses part-year powers', () => {
    const v = { purchasePrice: '40000', vehicleAge: '2.5', yearsOwned: '3', vehicleType: 'truck' };
    expectSteps(depreciation, v, [
      ['Year 1: 15% · Year 2: 12% · Year 3: 10% · Year 4: 8% · Year 5: 7% · Year 6: 6%'],
      ['$40000 × 0.85 × 0.88 × 0.90^0.5 = $28385'],
      ['$40000 × 0.85 × 0.88 × 0.90 × 0.92 × 0.93 × 0.94^0.5 = $22338'],
      ['$28385 − $22338 = $6047; ÷ $28385 = 21.3%'],
      ['$6047 total ÷ 3 years = $2016/year, or $168/month'],
    ]);
    expect(steps(depreciation, v)[1].label).toBe('Value today at 2.5 years old');
  });
  it('past year ten the rate stays at 5% and equal factors are grouped', () => {
    const v = { purchasePrice: '30000', vehicleAge: '0', yearsOwned: '15', vehicleType: 'average' };
    expectSteps(depreciation, v, [
      ['Year 10: 5% · then 5% a year'],
      ['$30000 × 0.80 × 0.85 × 0.88 × 0.90 × 0.91 × 0.92 × 0.93 × 0.94 × 0.95^7 = $8258'],
      ['$30000 − $8258 = $21742; ÷ $30000 = 72.5%'],
      ['$21742 total ÷ 15 years = $1449/year, or $121/month'],
    ]);
  });
  it('returns [] for blank price or zero years owned', () => {
    const v = { purchasePrice: '45000', vehicleAge: '0', yearsOwned: '5', vehicleType: 'average' };
    expect(steps(depreciation, { ...v, purchasePrice: '' })).toEqual([]);
    expect(steps(depreciation, { ...v, yearsOwned: '0' })).toEqual([]);
    expect(steps(depreciation, { ...v, purchasePrice: '-1' })).toEqual([]);
  });
});

describe('profit-margin explainSteps', () => {
  const base = { mode: 'margin', cost: '50', revenue: '80', targetPct: '40' };
  it('margin from cost and revenue', () => {
    expectSteps(profitMargin, base, [
      ['$80.00 − $50.00 = $30.00 profit'],
      ['$30.00 ÷ $50.00 × 100 = 60.00%'],
      ['$30.00 ÷ $80.00 × 100 = 37.50%'],
    ]);
    expect(val(profitMargin, base, 'primary')).toBe('37.50%');
  });
  it('markup from cost and revenue ends on the markup', () => {
    expectSteps(profitMargin, { ...base, mode: 'markup' }, [
      ['$30.00 profit'],
      ['$30.00 ÷ $80.00 × 100 = 37.50%'],
      ['$30.00 ÷ $50.00 × 100 = 60.00%'],
    ]);
  });
  it('selling price from a margin', () => {
    const v = { ...base, mode: 'price_from_margin' };
    expectSteps(profitMargin, v, [
      ['1 − 40/100 = 0.6'],
      ['$50.00 ÷ 0.6 = $83.33'],
      ['$83.33 − $50.00 = $33.33 profit, a 40.00% margin and 66.67% markup'],
    ]);
    expect(val(profitMargin, v, 'price')).toBe('$83.33');
  });
  it('selling price from a markup', () => {
    const v = { ...base, mode: 'price_from_markup', targetPct: '80' };
    expectSteps(profitMargin, v, [
      ['1 + 80/100 = 1.8'],
      ['$50.00 × 1.8 = $90.00'],
      ['$90.00 − $50.00 = $40.00 profit, a 44.44% margin and 80.00% markup'],
    ]);
  });
  it('a loss keeps its sign', () => {
    const e = exprs(profitMargin, { ...base, cost: '90', revenue: '40' });
    expect(e[0]).toBe('$40.00 − $90.00 = $-50.00 profit');
    expect(e[1]).toBe('$-50.00 ÷ $90.00 × 100 = -55.56%');
    expect(e[2]).toBe('$-50.00 ÷ $40.00 × 100 = -125.00%');
  });
  it('zero cost explains why there is no markup', () => {
    const e = exprs(profitMargin, { ...base, cost: '0' });
    expect(e[1]).toContain('is undefined');
    expect(e[2]).toBe('$80.00 ÷ $80.00 × 100 = 100.00%');
  });
  it('returns [] for impossible input', () => {
    expect(steps(profitMargin, { ...base, revenue: '0' })).toEqual([]);
    expect(steps(profitMargin, { ...base, mode: 'price_from_margin', targetPct: '100' })).toEqual([]);
    expect(steps(profitMargin, { ...base, mode: 'price_from_margin', targetPct: '' })).toEqual([]);
    expect(steps(profitMargin, { ...base, mode: 'price_from_markup', cost: '0', targetPct: '50' })).toEqual([]);
  });
});

describe('margin-calculator explainSteps', () => {
  const base = { solveFor: 'margin', costInput: '50', revenueInput: '90', marginInput: '', markupInput: '' };
  it('margin trims trailing zeros like the page does', () => {
    expectSteps(marginCalc, base, [
      ['$90.00 − $50.00 = $40.00 profit'],
      ['$40.00 ÷ $50.00 × 100 = 80%'],
      ['$40.00 ÷ $90.00 × 100 = 44.4444%'],
    ]);
    expect(val(marginCalc, base, 'solvedValue')).toBe('44.4444%');
  });
  it('markup', () => {
    expectSteps(marginCalc, { ...base, solveFor: 'markup' }, [
      ['$40.00 profit'],
      ['= 44.4444%'],
      ['$40.00 ÷ $50.00 × 100 = 80%'],
    ]);
  });
  it('revenue from a margin', () => {
    const v = { ...base, solveFor: 'revenue', revenueInput: '', marginInput: '40' };
    expectSteps(marginCalc, v, [
      ['1 − 40/100 = 0.6'],
      ['$50.00 ÷ 0.6 = $83.33'],
      ['$83.33 − $50.00 = $33.33 profit, a 40% margin and 66.6667% markup'],
    ]);
    expect(val(marginCalc, v, 'solvedValue')).toBe('$83.33');
  });
  it('revenue from a markup', () => {
    expectSteps(marginCalc, { ...base, solveFor: 'revenue', revenueInput: '', markupInput: '80' }, [
      ['1 + 80/100 = 1.8'],
      ['$50.00 × 1.8 = $90.00'],
      ['$90.00 − $50.00 = $40.00 profit, a 44.4444% margin and 80% markup'],
    ]);
  });
  it('cost from a margin', () => {
    const v = { ...base, solveFor: 'cost', costInput: '', marginInput: '40' };
    expectSteps(marginCalc, v, [
      ['1 − 40/100 = 0.6'],
      ['$90.00 × 0.6 = $54.00'],
      ['$90.00 − $54.00 = $36.00 profit, a 40% margin and 66.6667% markup'],
    ]);
    expect(val(marginCalc, v, 'solvedValue')).toBe('$54.00');
  });
  it('cost from a markup', () => {
    expectSteps(marginCalc, { ...base, solveFor: 'cost', costInput: '', markupInput: '80' }, [
      ['1 + 80/100 = 1.8'],
      ['$90.00 ÷ 1.8 = $50.00'],
      ['$90.00 − $50.00 = $40.00 profit, a 44.4444% margin and 80% markup'],
    ]);
  });
  it('returns [] when no usable target is given', () => {
    expect(steps(marginCalc, { ...base, solveFor: 'revenue', revenueInput: '', marginInput: '100' })).toEqual([]);
    expect(steps(marginCalc, { ...base, solveFor: 'cost', costInput: '', revenueInput: '0', marginInput: '40' })).toEqual([]);
    expect(steps(marginCalc, { ...base, costInput: '' })).toEqual([]);
  });
});

describe('roas explainSteps', () => {
  it('with orders and a margin', () => {
    const v = { adSpend: '5000', revenue: '20000', orders: '400', grossMargin: '60' };
    expectSteps(roas, v, [
      ['ROAS = $20000.00 ÷ $5000.00 = 4.00x'],
      ['4.00x means $4.00 of revenue for every $1.00 spent on ads'],
      ['$5000.00 ÷ 400 orders = $12.50'],
      ['$20000.00 − $5000.00 = $15000.00'],
      ['1 ÷ (60% ÷ 100) = 1.67x', 'is above break-even'],
      ['$20000.00 × 60% − $5000.00 = $7000.00'],
    ]);
    expect(val(roas, v, 'profitAfterAds')).toBe('$7,000.00');
  });
  it('without the optional fields', () => {
    expectSteps(roas, { adSpend: '2500', revenue: '6000', orders: '', grossMargin: '' }, [
      ['ROAS = $6000.00 ÷ $2500.00 = 2.40x'],
      ['$2.40 of revenue'],
      ['$6000.00 − $2500.00 = $3500.00'],
    ]);
  });
  it('below break-even shows a loss', () => {
    const v = { adSpend: '1000', revenue: '1500', orders: '', grossMargin: '40' };
    const e = exprs(roas, v);
    expect(e).toHaveLength(5);
    expect(e[3]).toBe('1 ÷ (40% ÷ 100) = 2.50x; your 1.50x is below break-even, so the ads do not cover their cost');
    expect(e[4]).toBe('$1500.00 × 40% − $1000.00 = $-400.00');
    expect(val(roas, v, 'profitAfterAds')).toBe('$-400.00');
  });
  it('returns [] for zero spend or negative revenue', () => {
    expect(steps(roas, { adSpend: '0', revenue: '100' })).toEqual([]);
    expect(steps(roas, { adSpend: '100', revenue: '-5' })).toEqual([]);
    expect(steps(roas, { adSpend: '100', revenue: '' })).toEqual([]);
  });
});

describe('break-even explainSteps', () => {
  it('rounds up to whole units', () => {
    const v = { fixedCosts: '10000', pricePerUnit: '49.99', variableCostPerUnit: '18' };
    expectSteps(breakEven, v, [
      ['$49.99 − $18.00 = $31.99'],
      ['$31.99 ÷ $49.99 = 64.0%'],
      ['$10000.00 ÷ $31.99 = 312.60 units'],
      ['$10000.00 ÷ $31.99 × $49.99 = $15626.76'],
      ['312.60 → 313 units'],
    ]);
    expect(val(breakEven, v, 'breakEvenRevenue')).toBe('$15,626.76');
    expect(val(breakEven, v, 'breakEvenUnits')).toBe('313 units');
  });
  it('another case', () => {
    expectSteps(breakEven, { fixedCosts: '5000', pricePerUnit: '25', variableCostPerUnit: '10' }, [
      ['= $15.00'], ['= 60.0%'], ['= 333.33 units'], ['= $8333.33'], ['333.33 → 334 units'],
    ]);
  });
  it('an exact answer is not rounded up', () => {
    expectSteps(breakEven, { fixedCosts: '1200', pricePerUnit: '12.5', variableCostPerUnit: '4.5' }, [
      ['= $8.00'], ['= 64.0%'], ['= 150.00 units'], ['= $1875.00'], ['150.00 → 150 units'],
    ]);
  });
  it('returns [] when price does not beat the variable cost', () => {
    expect(steps(breakEven, { fixedCosts: '1000', pricePerUnit: '10', variableCostPerUnit: '10' })).toEqual([]);
    expect(steps(breakEven, { fixedCosts: '1000', pricePerUnit: '10', variableCostPerUnit: '12' })).toEqual([]);
    expect(steps(breakEven, { fixedCosts: '-1', pricePerUnit: '10', variableCostPerUnit: '2' })).toEqual([]);
  });
});

describe('cpm-cpc explainSteps', () => {
  const base = { mode: 'cpm-from-spend', adSpend: '500', impressions: '50000', clicks: '1200', targetCpm: '', desiredImpressions: '' };
  it('CPM with clicks', () => {
    expectSteps(cpmCpc, base, [
      ['$500.00 ÷ 50000 impressions = $0.01'],
      ['$500.00 ÷ 50000 × 1000 = $10.00'],
      ['$500.00 ÷ 1200 clicks = $0.42'],
      ['1200 clicks ÷ 50000 impressions × 100 = 2.40%'],
      ['CPM $10.00 · CPC $0.42 · CTR 2.40% · total spend $500.00'],
    ]);
  });
  it('CPM without clicks', () => {
    expectSteps(cpmCpc, { ...base, adSpend: '1250', impressions: '320000', clicks: '' }, [
      ['$1250.00 ÷ 320000 impressions = $0.003906'],
      ['$1250.00 ÷ 320000 × 1000 = $3.91'],
      ['CPM $3.91 · total spend $1250.00'],
    ]);
  });
  it('CPC without impressions', () => {
    expectSteps(cpmCpc, { ...base, mode: 'cpc-from-spend', adSpend: '300', impressions: '', clicks: '750' }, [
      ['$300.00 ÷ 750 clicks = $0.40'],
      ['750 clicks × $0.40 ≈ $300.00'],
      ['CPC $0.40 · total spend $300.00'],
    ]);
  });
  it('CPC with impressions adds CPM and CTR', () => {
    expectSteps(cpmCpc, { ...base, mode: 'cpc-from-spend', adSpend: '300', impressions: '90000', clicks: '750' }, [
      ['$300.00 ÷ 750 clicks = $0.40'],
      ['750 clicks × $0.40 ≈ $300.00'],
      ['$300.00 ÷ 90000 × 1000 = $3.33'],
      ['750 clicks ÷ 90000 impressions × 100 = 0.83%'],
      ['CPM $3.33 · CPC $0.40 · CTR 0.83% · total spend $300.00'],
    ]);
  });
  it('reverse budget', () => {
    const v = { ...base, mode: 'reverse-budget', targetCpm: '12', desiredImpressions: '100000' };
    expectSteps(cpmCpc, v, [
      ['100000 ÷ 1000 = 100.00 thousand impressions'],
      ['$12.00 ÷ 1000 = $0.012 per impression'],
      ['100.00 × $12.00 = $1200.00'],
    ]);
    expect(val(cpmCpc, v, 'requiredBudget')).toBe('$1,200.00');
  });
  it('flags a click-through rate above 100%', () => {
    const s = steps(cpmCpc, { ...base, impressions: '50', clicks: '100', adSpend: '10' });
    expect(s[3].expr).toContain('= 200.00%');
    expect(s[3].note).toContain('over 100%');
  });
  it('returns [] for missing denominators and negative spend', () => {
    expect(steps(cpmCpc, { ...base, impressions: '0' })).toEqual([]);
    expect(steps(cpmCpc, { ...base, mode: 'cpc-from-spend', clicks: '0' })).toEqual([]);
    expect(steps(cpmCpc, { ...base, adSpend: '-5' })).toEqual([]);
    expect(steps(cpmCpc, { ...base, mode: 'reverse-budget', desiredImpressions: '0', targetCpm: '12' })).toEqual([]);
  });
});

describe('payment-fees explainSteps', () => {
  const base = { invoiceAmount: '100', platform: 'stripe-domestic', reverseMode: 'no' };
  it('Stripe domestic, $100', () => {
    const v = base;
    expectSteps(paymentFees, v, [
      ['$100.00 × 2.90% = $2.90'],
      ['$2.90 + $0.30 = $3.20 → $3.20'],
      ['$3.20 ÷ $100.00 = 3.20%'],
      ['$100.00 − $3.20 = $96.80 you receive'],
    ]);
    expect(steps(paymentFees, v)[0].note).toContain('Stripe (domestic card)');
    expect(val(paymentFees, v, 'netAmount')).toBe('$96.80');
  });
  it('shows the unrounded fee, then the cent', () => {
    expectSteps(paymentFees, { ...base, invoiceAmount: '33.33' }, [
      ['$33.33 × 2.90% = $0.9666'], ['$0.9666 + $0.30 = $1.2666 → $1.27'], ['$1.27 ÷ $33.33 = 3.81%'], ['$33.33 − $1.27 = $32.06 you receive'],
    ]);
  });
  it('PayPal domestic', () => {
    expectSteps(paymentFees, { ...base, invoiceAmount: '25', platform: 'paypal-domestic' }, [
      ['$25.00 × 3.49% = $0.8725'], ['$0.8725 + $0.49 = $1.3625 → $1.36'], ['= 5.44%'], ['$25.00 − $1.36 = $23.64 you receive'],
    ]);
  });
  it('Square in person', () => {
    expectSteps(paymentFees, { ...base, invoiceAmount: '9.99', platform: 'square' }, [
      ['$9.99 × 2.60% = $0.2597'], ['$0.2597 + $0.15 = $0.4097 → $0.41'], ['= 4.10%'], ['$9.99 − $0.41 = $9.58 you receive'],
    ]);
  });
  it('reverse: what to invoice to receive $100', () => {
    const v = { ...base, reverseMode: 'yes' };
    expectSteps(paymentFees, v, [
      ['($100.00 + $0.30) ÷ (1 − 0.029) = $103.2956'],
      ['Invoice $103.30'],
      ['$103.30 × 2.90% + $0.30 = $3.2957 → $3.30'],
      ['$3.30 ÷ $103.30 = 3.19%'],
      ['$103.30 − $3.30 = $100.00 you receive'],
    ]);
    expect(val(paymentFees, v, 'reverseAmount')).toBe('$103.30');
  });
  it('reverse on PayPal', () => {
    expectSteps(paymentFees, { invoiceAmount: '250', platform: 'paypal-domestic', reverseMode: 'yes' }, [
      ['($250.00 + $0.49) ÷ (1 − 0.0349) = $259.5482'],
      ['Invoice $259.55'],
      ['$259.55 × 3.49% + $0.49 = $9.5483 → $9.55'],
      ['= 3.68%'],
      ['$259.55 − $9.55 = $250.00 you receive'],
    ]);
  });
  it('returns [] for a missing amount or unknown platform', () => {
    expect(steps(paymentFees, { ...base, invoiceAmount: '0' })).toEqual([]);
    expect(steps(paymentFees, { ...base, platform: 'nope' })).toEqual([]);
  });
});

describe('etsy-fees explainSteps', () => {
  const base = { itemPrice: '50', shippingCharged: '5', materialCost: '20', shippingCost: '4.50', offsiteAds: 'no' };
  it('no offsite ads', () => {
    const v = base;
    expectSteps(etsyFees, v, [
      ['$50.00 + $5.00 = $55.00 total sale'],
      ['$50.00 × 6.5% = $3.25', '$5.00 × 6.5% = $0.33'],
      ['$55.00 × 3% + $0.25 = $1.90'],
      ['$0.20 + $3.25 + $0.33 + $1.90 = $5.68'],
      ['$55.00 − $20.00 materials − $4.50 postage − $5.68 fees = $24.83 (45.1% of the sale)'],
    ]);
    expect(val(etsyFees, v, 'netProfit')).toBe('$24.83');
    // the page rounds the fee lines for display, and the worked solution says so when it shows
    expect(steps(etsyFees, v)[4].note).toContain('a cent');
  });
  it('standard offsite ads', () => {
    const v = { itemPrice: '80', shippingCharged: '0', materialCost: '30', shippingCost: '6', offsiteAds: 'standard' };
    expectSteps(etsyFees, v, [
      ['$80.00 + $0.00 = $80.00 total sale'],
      ['$80.00 × 6.5% = $5.20', '$0.00 × 6.5% = $0.00'],
      ['$80.00 × 3% + $0.25 = $2.65'],
      ['$80.00 × 12% = $9.60'],
      ['$0.20 + $5.20 + $0.00 + $2.65 + $9.60 = $17.65'],
      ['$80.00 − $30.00 materials − $6.00 postage − $17.65 fees = $26.35 (32.9% of the sale)'],
    ]);
    expect(steps(etsyFees, v)[5].note).toBeUndefined();
  });
  it('qualified offsite ads with rounding noted', () => {
    const v = { itemPrice: '120', shippingCharged: '9.5', materialCost: '45', shippingCost: '8.25', offsiteAds: 'qualified' };
    const e = exprs(etsyFees, v);
    expect(e[0]).toBe('$120.00 + $9.50 = $129.50 total sale');
    expect(e[1]).toContain('$120.00 × 6.5% = $7.80');
    expect(e[1]).toContain('$9.50 × 6.5% = $0.62');
    expect(e[2]).toBe('$129.50 × 3% + $0.25 = $4.14');
    expect(e[3]).toBe('$129.50 × 15% = $19.43');
    expect(e[4]).toContain('= $32.18');
    expect(e[5]).toContain('= $44.07 (34.0% of the sale)');
    expect(steps(etsyFees, v)[4].note).toContain('rounded to the cent');
  });
  it('returns [] for no item price, a negative cost or an unknown ad option', () => {
    expect(steps(etsyFees, { ...base, itemPrice: '0' })).toEqual([]);
    expect(steps(etsyFees, { ...base, materialCost: '-1' })).toEqual([]);
    expect(steps(etsyFees, { ...base, offsiteAds: 'bogus' })).toEqual([]);
  });
});

describe('concrete-slab explainSteps', () => {
  it('20 x 15 ft, 4 in, 10% waste', () => {
    const v = { length: '20', width: '15', depth: '4', wastePct: '10' };
    expectSteps(concreteSlab, v, [
      ['20 ft × 15 ft × (4 in ÷ 12) = 100.00 cu ft'],
      ['100.00 × (1 + 10%) = 110.00 cu ft'],
      ['110.00 ÷ 0.6 = 184 bags (80 lb)', '110.00 ÷ 0.45 = 245 bags (60 lb)'],
      ['110.00 cu ft ÷ 27 = 4.07 cu yd'],
    ]);
    expect(val(concreteSlab, v, 'cubicYards')).toBe('4.07 cu yd');
    expect(val(concreteSlab, v, 'bags80')).toBe('184 bags');
    expect(val(concreteSlab, v, 'bags60')).toBe('245 bags');
  });
  it('6 inches with 15% waste', () => {
    expectSteps(concreteSlab, { length: '10', width: '10', depth: '6', wastePct: '15' }, [
      ['= 50.00 cu ft'], ['(1 + 15%) = 57.50 cu ft'], ['= 96 bags (80 lb)', '= 128 bags (60 lb)'], ['= 2.13 cu yd'],
    ]);
  });
  it('a bag count that lands exactly on a whole number is not bumped up', () => {
    expectSteps(concreteSlab, { length: '12', width: '8', depth: '3', wastePct: '5' }, [
      ['= 24.00 cu ft'], ['= 25.20 cu ft'], ['= 42 bags (80 lb)', '= 56 bags (60 lb)'], ['= 0.93 cu yd'],
    ]);
  });
  it('returns [] for zero length or thickness', () => {
    const v = { length: '20', width: '15', depth: '4', wastePct: '10' };
    expect(steps(concreteSlab, { ...v, length: '0' })).toEqual([]);
    expect(steps(concreteSlab, { ...v, depth: '0' })).toEqual([]);
    expect(steps(concreteSlab, { ...v, width: '' })).toEqual([]);
  });
});

describe('paint-coverage explainSteps', () => {
  it('14 x 12 ft room, 9 ft ceiling, two coats', () => {
    const v = { roomLength: '14', roomWidth: '12', ceilingHeight: '9', doors: '2', windows: '3', coats: '2' };
    expectSteps(paint, v, [
      ['2 × (14 + 12) × 9 = 468.0 sq ft'],
      ['468.0 − (2 × 21 + 3 × 15) = 468.0 − 87.0 = 381.0 sq ft'],
      ['381.0 × 2 coats = 762.0 sq ft to cover'],
      ['762.0 ÷ 350 sq ft per gallon = 2.18 gallons'],
      ['2.18 × 1.1 = 2.4 gallons'],
      ['2.4 gallons → 3 gallon(s)'],
    ]);
    expect(val(paint, v, 'gallons')).toBe('2.4 gallons');
    expect(val(paint, v, 'containers')).toBe('3 gallon(s)');
    expect(steps(paint, v)[1].note).toContain('21 sq ft per door');
  });
  it('20 x 15 ft room, one door, four windows', () => {
    expectSteps(paint, { roomLength: '20', roomWidth: '15', ceilingHeight: '8', doors: '1', windows: '4', coats: '2' }, [
      ['= 560.0 sq ft'], ['= 479.0 sq ft'], ['= 958.0 sq ft to cover'], ['= 2.74 gallons'], ['= 3.0 gallons'], ['3.0 gallons → 4 gallon(s)'],
    ]);
  });
  it('blank door and window counts count as none', () => {
    const e = exprs(paint, { roomLength: '10', roomWidth: '10', ceilingHeight: '8', doors: '', windows: '', coats: '1' });
    expect(e[1]).toBe('320.0 − (0 × 21 + 0 × 15) = 320.0 − 0.0 = 320.0 sq ft');
    expect(e[2]).toBe('320.0 × 1 coat = 320.0 sq ft to cover');
  });
  it('returns [] when the openings remove the whole wall', () => {
    expect(steps(paint, { roomLength: '10', roomWidth: '10', ceilingHeight: '8', doors: '100', windows: '0', coats: '2' })).toEqual([]);
    expect(steps(paint, { roomLength: '10', roomWidth: '', ceilingHeight: '8', doors: '0', windows: '0', coats: '2' })).toEqual([]);
  });
});

describe('drywall explainSteps', () => {
  it('walls and ceiling, 4x8 sheets', () => {
    const v = { length: '16', width: '12', height: '9', sheetSize: '32', ceiling: 'yes', doors: '1', windows: '2' };
    expectSteps(drywall, v, [
      ['2 × (16 + 12) × 9 = 504 sq ft'],
      ['504 + 16 × 12 ceiling − 1 × 20 − 2 × 15 = 646 sq ft net'],
      ['646 × 1.1 = 711 sq ft'],
      ['711 ÷ 32 sq ft per sheet = 22.2 → 23 sheets'],
      ['23 sheets · 736 screws · 6.5 gallons joint compound · 1 roll of tape (239 ft needed)'],
    ]);
    expect(val(drywall, v, 'sheets')).toBe('23 sheets');
    expect(val(drywall, v, 'screws')).toBe('736 screws');
    expect(val(drywall, v, 'jointCompound')).toBe('6.5 gallons');
    expect(steps(drywall, v)[1].note).toContain('20 sq ft per door');
  });
  it('walls only, 4x12 sheets', () => {
    const v = { length: '12', width: '10', height: '8', sheetSize: '48', ceiling: 'no', doors: '2', windows: '1' };
    const s = steps(drywall, v);
    expect(s[1].label).toBe('Subtract doors and windows (walls only)');
    expectSteps(drywall, v, [
      ['= 352 sq ft'],
      ['352 − 2 × 20 − 1 × 15 = 297 sq ft net'],
      ['297 × 1.1 = 327 sq ft'],
      ['327 ÷ 48 sq ft per sheet = 6.8 → 7 sheets'],
      ['7 sheets · 336 screws · 3.0 gallons joint compound · 1 roll of tape (110 ft needed)'],
    ]);
  });
  it('returns [] when nothing is left to board', () => {
    expect(steps(drywall, { length: '10', width: '10', height: '8', sheetSize: '32', ceiling: 'no', doors: '100', windows: '0' })).toEqual([]);
    expect(steps(drywall, { length: '', width: '10', height: '8', sheetSize: '32', ceiling: 'yes', doors: '0', windows: '0' })).toEqual([]);
  });
});
