import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/tvm-calculator/index';
import { tvmFV, tvmN, tvmPMT, tvmRate } from '../../../src/calculators/finance/tvm-calculator/tvmMath';
import { getValue, parseMoney, near } from '../../helpers';

// Excel/HP-12C convention. Expected values derived by hand from the closed forms (see comments).
describe('tvm audit', () => {
  it('mortgage: 300,000 at 7%/12 for 360 months -> -1,995.91 ; at 6% -> -1,798.65 (150,000 x ... closed form)', () => {
    near(tvmPMT(300000, 0, 0.07 / 12, 360, false), -1995.91, 0.01);
    near(tvmPMT(300000, 0, 0.06 / 12, 360, false), -1798.65, 0.01);
    const r = config.calculate({ solveFor: 'PMT', n: '360', rate: String(7 / 12), pv: '300000', pmt: '0', fv: '0', timing: 'end' });
    expect(getValue(r, 'result')).toBe('-$1,995.91');
  });

  it('annuity due FAQ: 250,000 at 0.5% x 360 -> ordinary -1,498.88, due -1,491.42 (= ordinary / 1.005)', () => {
    near(tvmPMT(250000, 0, 0.005, 360, false), -1498.88, 0.01);
    near(tvmPMT(250000, 0, 0.005, 360, true), -1491.42, 0.01);
  });

  it('retirement example: PV -50,000, FV 500,000, 8%/12 x 300 -> PMT -139.84 and 50,000 grows to 367,009', () => {
    // D = (1+0.08/12)^300 = 7.3401 ; (500,000 - 50,000 x D) x r / (D - 1) = 139.84
    near(tvmFV(-50000, 0, 0.08 / 12, 300, false), 367008.8, 0.5);
    near(tvmPMT(-50000, 500000, 0.08 / 12, 300, false), -139.84, 0.01);
  });

  it('loan payoff N: 10,000 at 0.5% paying 200 -> 57.68 months', () => {
    // ln(200 / (200 - 10,000 x 0.005)) / ln(1.005)
    near(tvmN(10000, 0, -200, 0.005, false), Math.log(200 / 150) / Math.log(1.005), 1e-9);
    near(tvmN(10000, 0, -200, 0.005, false), 57.68, 0.005);
  });

  it('rate example: 10,000 + 200/month for 96 months reaching 38,500 -> about 0.418% per month (5.0% nominal)', () => {
    const r = tvmRate(-10000, 38500, -200, 96, false);
    // forward check: FV of the solved rate reproduces 38,500
    near(tvmFV(-10000, -200, r, 96, false), 38500, 0.01);
    near(r * 100, 0.4183, 0.0005);
    near(r * 1200, 5.02, 0.01);
  });

  it('impossible rate (loan and payment both outflows) reports an error instead of a made-up number', () => {
    const r = config.calculate({ solveFor: 'RATE', n: '60', rate: '0', pv: '-250000', pmt: '-1498.88', fv: '0', timing: 'end' });
    expect(r[0].id).toBe('error');
  });

  it('FV mode: payment may be left blank, and interest = FV + PV + PMT x n for investors (regression: sign of PMT)', () => {
    // 10,000 invested, 200/month x 96 at 0.4183%/month: cash put in 29,200
    const rate = '0.4183';
    const r = config.calculate({ solveFor: 'FV', n: '96', rate, pv: '-10000', pmt: '-200', fv: '', timing: 'end' });
    const fv = parseMoney(getValue(r, 'result'));
    near(parseMoney(getValue(r, 'totalInterest')), fv - 29200, 0.01);
    const lump = config.calculate({ solveFor: 'FV', n: '12', rate: '1', pv: '-1000', pmt: '', fv: '', timing: 'end' });
    near(parseMoney(getValue(lump, 'result')), 1000 * Math.pow(1.01, 12), 0.01);
  });

  it('publishes the solved scenario for the panel (PMT mode carries the solved payment, not the blank field)', () => {
    const r = config.calculate({ solveFor: 'PMT', n: '360', rate: String(7 / 12), pv: '300000', pmt: '', fv: '0', timing: 'end' });
    const sc = JSON.parse(getValue(r, '_tvm'));
    near(sc.pmt, -1995.91, 0.01);
    expect(sc.n).toBe(360);
  });

  it('zero rate and bounds', () => {
    near(tvmPMT(1200, 0, 0, 12, false), -100, 1e-9);
    near(tvmFV(-1000, -100, 0, 10, false), 2000, 1e-9);
    expect(config.inputs.find((i) => i.id === 'n')!.max).toBe(12000);
  });
});
