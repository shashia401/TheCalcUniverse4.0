import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/texas-mortgage-calculator/index';
import { getValue, parseMoney as pm, near } from '../../helpers';

const parseMoney = (s: string) => pm(s.replace('/yr', ''));

const garcia = { homePrice: '300000', downPayment: '60000', interestRate: '6.8', loanTerm: '30', propertyTaxRate: '2.1', homesteadType: 'general' };

describe('texas-mortgage audit (homestead $140K / $200K since Nov 2025; school share, PMI, insurance are estimates)', () => {
  it('worked example Garcias: P&I 1,564.62; tax 6,300 -> 4,683 after the $140K exemption; total 1,954.87', () => {
    // P&I = 240,000 x i / (1 - (1+i)^-360), i = 0.068/12 ; exemption saving = 140,000 x 2.1% x 55% = 1,617
    const r = config.calculate(garcia);
    near(parseMoney(getValue(r, 'monthlyPayment')), 1564.62, 0.01);
    near(parseMoney(getValue(r, 'propertyTaxBefore')), 6300, 0.01);
    near(parseMoney(getValue(r, 'propertyTaxAfter')), 4683, 0.01);
    near(parseMoney(getValue(r, 'homesteadSavings')), 1617, 0.01);
    near(parseMoney(getValue(r, 'totalMonthly')), 1564.62 + 4683 / 12, 0.01); // 20% down: no PMI
  });

  it('worked example Robert: senior exemption saves 200,000 x 1.8% x 55% = 1,980; tax 4,500 -> 2,520; P&I 1,602.56', () => {
    const r = config.calculate({ homePrice: '250000', downPayment: '62500', interestRate: '6.2', loanTerm: '15', propertyTaxRate: '1.8', homesteadType: 'senior' });
    near(parseMoney(getValue(r, 'monthlyPayment')), 1602.56, 0.01);
    near(parseMoney(getValue(r, 'propertyTaxAfter')), 2520, 0.01);
  });

  it('exemption cannot exceed the home value (regression: a 100K home produced negative tax)', () => {
    const r = config.calculate({ ...garcia, homePrice: '100000', downPayment: '20000' });
    // exempt value capped at 100,000: tax 2,100 - 100,000 x 2.1% x 55% = 945
    near(parseMoney(getValue(r, 'propertyTaxAfter')), 945, 0.01);
  });

  it('PMI estimate (0.5%/yr of the loan) only under 20% down; optional insurance is added to the monthly total', () => {
    const noPmi = config.calculate({ ...garcia, homesteadType: 'none' });
    const pmi = config.calculate({ ...garcia, homesteadType: 'none', downPayment: '30000' });
    const base = parseMoney(getValue(pmi, 'monthlyPayment')) + 6300 / 12 + (270000 * 0.005) / 12;
    near(parseMoney(getValue(pmi, 'totalMonthly')), base, 0.01);
    near(parseMoney(getValue(noPmi, 'totalMonthly')), parseMoney(getValue(noPmi, 'monthlyPayment')) + 525, 0.01);
    const ins = config.calculate({ ...garcia, homesteadType: 'none', homeInsurance: '3600' });
    near(parseMoney(getValue(ins, 'totalMonthly')) - parseMoney(getValue(noPmi, 'totalMonthly')), 300, 0.01);
  });

  it('publishes its own numbers for the panel and no longer invents an income-tax saving', () => {
    const r = config.calculate(garcia);
    const d = JSON.parse(getValue(r, '_texasData'));
    near(d.monthlyPI, 1564.62, 0.01);
    near(d.totalMonthly, 1564.62 + 4683 / 12, 0.01);
    expect(getValue(r, 'incomeTaxNote')).not.toMatch(/\$\d/);
  });
});
