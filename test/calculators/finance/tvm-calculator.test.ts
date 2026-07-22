import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/tvm-calculator';
import { getValue, parseMoney, parsePercent, near } from '../../helpers';

/**
 * TVM uses HP-12C / Excel sign convention:
 *   PV positive = money you receive (cash inflow at t0)
 *   PMT negative = payment you make (outflow)
 *   FV positive = money returned to you
 */

describe('tvm-calculator', () => {
  // ── FV ──────────────────────────────────────────────────
  it('FV: PV=-1000, rate=10%/yr, n=10 → ~$2,593.74', () => {
    const r = config.calculate({
      solveFor: 'FV',
      n: '10',
      rate: '10',
      pv: '-1000',
      pmt: '0',
      fv: '0',
      timing: 'end',
    });
    near(parseMoney(getValue(r, 'result')), 1000 * Math.pow(1.1, 10), 0.5);
  });

  it('FV: zero-rate with payments → simple linear addition', () => {
    const r = config.calculate({
      solveFor: 'FV',
      n: '12',
      rate: '0',
      pv: '-1000',
      pmt: '-100',
      fv: '0',
      timing: 'end',
    });
    near(parseMoney(getValue(r, 'result')), 2200);
  });

  it('FV: with annuity due (beginning-of-period)', () => {
    const r = config.calculate({
      solveFor: 'FV',
      n: '10',
      rate: '10',
      pv: '-1000',
      pmt: '-100',
      fv: '0',
      timing: 'begin',
    });
    const ordinaryFV = 1000 * Math.pow(1.1, 10);
    const annuityFV = 100 * ((Math.pow(1.1, 10) - 1) / 0.1) * 1.1;
    const expected = ordinaryFV + annuityFV;
    near(parseMoney(getValue(r, 'result')), expected, 1);
  });

  // ── PV ──────────────────────────────────────────────────
  it('PV: solving for PV given FV=10000, n=10, rate=8% → ~-$4,631.93', () => {
    const r = config.calculate({
      solveFor: 'PV',
      n: '10',
      rate: '8',
      pv: '0',
      pmt: '0',
      fv: '10000',
      timing: 'end',
    });
    near(parseMoney(getValue(r, 'result')), -10000 / Math.pow(1.08, 10), 0.5);
  });

  it('PV: with annuity payments', () => {
    const r = config.calculate({
      solveFor: 'PV',
      n: '120',
      rate: '0.5',
      pmt: '-1000',
      fv: '0',
      timing: 'end',
    });
    const factor = Math.pow(1.005, 120);
    const expected = -1000 * ((1 - 1 / factor) / 0.005);
    near(Math.abs(parseMoney(getValue(r, 'result'))), Math.abs(expected), 1);
  });

  // ── PMT ─────────────────────────────────────────────────
  it('PMT: $250k loan, 30yr, 0.5%/mo (6% annual) → ~$1,498.88', () => {
    const r = config.calculate({
      solveFor: 'PMT',
      n: '360',
      rate: '0.5',
      pv: '-250000',
      pmt: '0',
      fv: '0',
      timing: 'end',
    });
    const pmt = parseMoney(getValue(r, 'result'));
    near(Math.abs(pmt), 1498.88, 0.05);
  });

  it('PMT: car loan $25,000 at 5%/yr for 5 years', () => {
    const r = config.calculate({
      solveFor: 'PMT',
      n: '60',
      rate: (5 / 12).toFixed(4),
      pv: '-25000',
      pmt: '0',
      fv: '0',
      timing: 'end',
    });
    const pmt = parseMoney(getValue(r, 'result'));
    near(Math.abs(pmt), 471.78, 0.5);
  });

  // ── N ────────────────────────────────────────────────────
  it('N: how many months to pay off $10k loan at 0.5%/mo with $200/mo payments', () => {
    const r = config.calculate({
      solveFor: 'N',
      n: '0',
      rate: '0.5',
      pv: '-10000',
      pmt: '200',
      fv: '0',
      timing: 'end',
    });
    const expected = Math.log(4 / 3) / Math.log(1.005);
    const n = parseFloat(getValue(r, 'result').replace(/,/g, ''));
    near(n, expected, 0.05);
  });

  it('N: zero-rate payoff calculation', () => {
    const r = config.calculate({
      solveFor: 'N',
      n: '0',
      rate: '0',
      pv: '-5000',
      pmt: '500',
      fv: '0',
      timing: 'end',
    });
    const n = parseFloat(getValue(r, 'result').replace(/,/g, ''));
    near(n, 10, 0.01);
  });

  // ── RATE ─────────────────────────────────────────────────
  it('RATE: invest $1000 today, get $2000 in 10 years → ~7.18%', () => {
    const r = config.calculate({
      solveFor: 'RATE',
      n: '10',
      rate: '0',
      pv: '-1000',
      pmt: '0',
      fv: '2000',
      timing: 'end',
    });
    const ratePct = parsePercent(getValue(r, 'result'));
    near(ratePct, 7.177, 0.02);
  });

  it('RATE: solve for return on monthly savings plan', () => {
    const r = config.calculate({
      solveFor: 'RATE',
      n: '120',
      rate: '0',
      pv: '-10000',
      pmt: '-500',
      fv: '120000',
      timing: 'end',
    });
    const ratePct = parsePercent(getValue(r, 'result'));
    expect(ratePct).toBeGreaterThan(0);
    expect(ratePct).toBeLessThan(1.5);
  });

  // ── Edge cases / guards ──────────────────────────────────
  it('returns empty array when required inputs are missing (solveFor=FV with no PV)', () => {
    const r = config.calculate({
      solveFor: 'FV',
      n: '10',
      rate: '10',
      pv: '',
      pmt: '0',
      fv: '0',
      timing: 'end',
    });
    expect(r).toHaveLength(0);
  });

  it('N=0 with FV solve returns valid result (no time elapsed, FV = -PV)', () => {
    const r = config.calculate({
      solveFor: 'FV',
      n: '0',
      rate: '10',
      pv: '-1000',
      pmt: '0',
      fv: '0',
      timing: 'end',
    });
    expect(r.length).toBeGreaterThan(0);
    // With n=0, no compounding: FV = -PV = -(-1000) = 1000
    expect(r[0].id).toBe('result');
    const result = parseMoney(getValue(r, 'result'));
    near(result, 1000);
  });

  it('returns error for NaN on required fields (PMT with empty pv)', () => {
    const r = config.calculate({
      solveFor: 'PMT',
      n: '10',
      rate: '10',
      pv: '',
      pmt: '0',
      fv: '0',
      timing: 'end',
    });
    expect(r).toHaveLength(0);
  });

  it('handles undefined values gracefully (returns empty)', () => {
    const r = config.calculate({
      solveFor: 'FV',
      n: undefined as any,
      rate: '10',
      pv: '-1000',
      pmt: '0',
      fv: '0',
      timing: 'end',
    });
    expect(r).toHaveLength(0);
  });

  it('FV: extra results are present with lump sum growth info', () => {
    const r = config.calculate({
      solveFor: 'FV',
      n: '10',
      rate: '10',
      pv: '-1000',
      pmt: '0',
      fv: '0',
      timing: 'end',
    });
    const ids = r.map((x: any) => x.id);
    expect(ids).toContain('totalPayments');
    expect(ids).toContain('totalInterest');
    expect(ids).toContain('lumpSumGrowth');
  });

  it('produces valid results for all solve modes with reasonable inputs', () => {
    const baseInputs = { n: '60', rate: '0.5', pv: '-250000', pmt: '-1498.88', fv: '0', timing: 'end' as const };

    for (const mode of ['FV', 'PV', 'PMT', 'N', 'RATE'] as const) {
      const inputs = { ...baseInputs, solveFor: mode };
      const r = config.calculate(inputs);
      expect(r.length).toBeGreaterThan(0);
      expect(r[0].id).not.toBe('error');
      const result = r.find((x: any) => x.id === 'result');
      expect(result).toBeDefined();
    }
  });

  it('RATE with zero inputs returns valid result', () => {
    const r = config.calculate({
      solveFor: 'RATE',
      n: '10',
      rate: '0',
      pv: '0',
      pmt: '0',
      fv: '0',
      timing: 'end',
    });
    expect(r.length).toBeGreaterThan(0);
  });

  it('Annuity due produces different result from ordinary annuity for same inputs', () => {
    const rEnd = config.calculate({
      solveFor: 'FV',
      n: '10',
      rate: '10',
      pv: '-1000',
      pmt: '-100',
      fv: '0',
      timing: 'end',
    });
    const rBegin = config.calculate({
      solveFor: 'FV',
      n: '10',
      rate: '10',
      pv: '-1000',
      pmt: '-100',
      fv: '0',
      timing: 'begin',
    });
    const fvEnd = parseMoney(getValue(rEnd, 'result'));
    const fvBegin = parseMoney(getValue(rBegin, 'result'));
    expect(Math.abs(fvBegin)).toBeGreaterThan(Math.abs(fvEnd));
  });
});
