import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/irr-calculator/index';
import { findIRRs, npvAt, signChanges, paybackYears } from '../../../src/calculators/finance/irr-calculator/irrMath';
import { getValue } from '../../helpers';

describe('irr-calculator audit', () => {
  it('NPV(IRR) = 0 for the default example (-100k, 25k, 30k, 35k, 40k, 45k) and IRR matches an independent bisection (20.0 percent area)', () => {
    const cf = [-100000, 25000, 30000, 35000, 40000, 45000];
    const [irr] = findIRRs(cf);
    expect(Math.abs(npvAt(irr, cf))).toBeLessThan(1e-6);
    const r = config.calculate({ initialInvestment: '100000', discountRate: '10', year1: '25000', year2: '30000', year3: '35000', year4: '40000', year5: '45000' });
    expect(getValue(r, 'irrResult')).toBe('19.71%'); // independent bisection: 0.197111
    // NPV at 10% by hand: 22,727.27 + 24,793.39 + 26,296.02 + 27,320.54 + 27,941.46 - 100,000 = 29,078.68
    expect(getValue(r, 'npvResult')).toBe('$29,078.68');
  });

  it('closed forms: -100 then 150 = 50%; -1000, 0, 0, 1331 = 10%', () => {
    expect(findIRRs([-100, 150])[0]).toBeCloseTo(0.5, 10);
    expect(findIRRs([-1000, 0, 0, 1331])[0]).toBeCloseTo(0.1, 10);
  });

  it('multiple sign changes: -100, +230, -132 has two IRRs, 10% and 20% (classic example), and the calculator warns', () => {
    const roots = findIRRs([-100, 230, -132]);
    expect(roots).toHaveLength(2);
    expect(roots[0]).toBeCloseTo(0.1, 8);
    expect(roots[1]).toBeCloseTo(0.2, 8);
    expect(signChanges([-100, 230, -132])).toBe(2);
    const r = config.calculate({ initialInvestment: '100', year1: '230', year2: '-132' });
    const w = r.find((x) => x.id === 'irrWarning')!;
    expect(w.value).toContain('10.00%, 20.00%');
    expect(getValue(r, 'irrResult')).toBe('10.00%'); // the root closest to zero
  });

  it('no root: all-negative or all-positive flows, or a project that never gets paid back, say so', () => {
    expect(findIRRs([-100, -50])).toEqual([]);
    expect(findIRRs([100, 50])).toEqual([]);
    const r = config.calculate({ initialInvestment: '100', year1: '0', year2: '0' });
    expect(getValue(r, 'irrResult')).toContain('Cannot calculate');
  });

  it('negative IRR (loses money) is found: -100 then 60 = -40%', () => {
    expect(findIRRs([-100, 60])[0]).toBeCloseTo(-0.4, 10);
  });

  it('net return counts later outflows (regression: ignored them)', () => {
    const r = config.calculate({ initialInvestment: '100', year1: '150', year2: '-30', year3: '80' });
    expect(getValue(r, 'totalCashInflows')).toBe('$230');
    expect(getValue(r, 'totalReturn')).toBe('$100'); // -100 + 150 - 30 + 80
  });

  it('payback interpolates inside the year: -100, 60, 60 -> 1.67 years', () => {
    expect(paybackYears([-100, 60, 60])).toBeCloseTo(1 + 40 / 60, 10);
    expect(paybackYears([-100, 10])).toBeNull();
  });

  it('FAQ: doubling in 2 years is ~41% IRR, in 10 years ~7%', () => {
    expect(findIRRs([-1, 0, 2])[0]).toBeCloseTo(Math.SQRT2 - 1, 10);
    expect(findIRRs([-1, ...Array(9).fill(0), 2])[0]).toBeCloseTo(2 ** 0.1 - 1, 10);
  });
});
