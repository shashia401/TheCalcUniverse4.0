import { describe, it, expect } from 'vitest';
import { STATE_INCOME_TAX, stateTaxBasis, stateIncomeTax, verifiedStateNames } from '../../../src/utils/stateTax';
import paycheck from '../../../src/calculators/finance/paycheck-calculator';
import salaryTakeHome from '../../../src/calculators/finance/salary-take-home';
import { getValue } from '../../helpers';

// The states checked against their own revenue department / legislature on 2026-10-22 (see the per-state notes in src/utils/stateTax.ts).
const VERIFIED = ['AZ', 'CA', 'GA', 'IL', 'MA', 'MI', 'NC', 'NJ', 'NY', 'OH', 'PA', 'VA'];

const payBase = { payMode: 'salary', annualSalary: '100000', payFrequency: 'biweekly', filingStatus: 'single', preTaxDeductions: '0', retirementContributions: '0' };
const stBase = { annualSalary: '100000', filingStatus: 'single', payFrequency: 'monthly', preTaxDeductions: '0' };

describe('verified marker on state tax data', () => {
  it('exactly the states that were checked carry a marker; the rest stay estimates', () => {
    const marked = Object.entries(STATE_INCOME_TAX).filter(([, r]) => r.verified).map(([c]) => c).sort();
    expect(marked).toEqual(VERIFIED);
    expect(verifiedStateNames()).toHaveLength(VERIFIED.length);
  });

  it('every marker names an official body, an https source, an ISO date and a note', () => {
    for (const code of VERIFIED) {
      const v = STATE_INCOME_TAX[code].verified!;
      expect(v.authority.length, code).toBeGreaterThan(5);
      expect(v.url, code).toMatch(/^https:\/\/(www\.)?[a-z0-9.-]+\.(gov|us)\//);
      expect(v.checked, code).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(v.note.length, code).toBeGreaterThan(20);
    }
  });
});

describe('stateTaxBasis (the one shared label)', () => {
  it('verified states say "verified against <authority>, <date>"', () => {
    expect(stateTaxBasis('CA')).toBe('verified against California Franchise Tax Board, 2026-10-22');
    expect(stateTaxBasis('PA')).toBe('verified against Pennsylvania Department of Revenue, 2026-10-22');
    expect(stateTaxBasis('GA')).toBe('verified against Georgia Department of Revenue, 2026-10-22');
  });
  it('unverified taxing states say estimate', () => {
    for (const code of ['CO', 'MN', 'OR', 'WI']) expect(stateTaxBasis(code)).toMatch(/^estimate/);
  });
  it('no-wage-tax and unknown states get no label', () => {
    for (const code of ['TX', 'FL', 'WA', 'ZZ']) expect(stateTaxBasis(code)).toBe('');
  });
});

describe('calculators show the label from the helper', () => {
  it('paycheck: verified state row and step quote the verified label', () => {
    const v = { ...payBase, state: 'CA' };
    const rows = paycheck.calculate(v);
    const row = rows.find((r) => r.id === 'statePerPaycheck')!;
    expect(row.interpretation).toBe(`State figure: ${stateTaxBasis('CA')}.`);
    const step = paycheck.explainSteps!(v).find((s) => s.label === 'State income tax')!;
    expect(step.note).toContain('verified against California Franchise Tax Board, 2026-10-22');
  });
  it('paycheck: an unverified state is labelled estimate', () => {
    const v = { ...payBase, state: 'CO' };
    const row = paycheck.calculate(v).find((r) => r.id === 'statePerPaycheck')!;
    expect(row.interpretation).toContain('estimate');
    expect(row.interpretation).not.toContain('verified against');
    expect(paycheck.explainSteps!(v).find((s) => s.label === 'State income tax')!.note).toContain('estimate');
  });
  it('paycheck: a no-tax state gets no state label', () => {
    const v = { ...payBase, state: 'TX' };
    expect(paycheck.calculate(v).find((r) => r.id === 'statePerPaycheck')!.interpretation).toBeUndefined();
    expect(paycheck.explainSteps!(v).find((s) => s.label === 'State income tax')!.note).toBeUndefined();
  });
  it('salary-take-home: verified and estimate wording comes from the same helper', () => {
    const ga = salaryTakeHome.calculate({ ...stBase, state: 'GA' }).find((r) => r.id === 'totalStateTax')!;
    expect(ga.interpretation).toBe(`State figure: ${stateTaxBasis('GA')}.`);
    const co = salaryTakeHome.calculate({ ...stBase, state: 'CO' }).find((r) => r.id === 'totalStateTax')!;
    expect(co.interpretation).toContain('estimate');
    const step = salaryTakeHome.explainSteps!({ ...stBase, state: 'GA' }).find((s) => s.label.includes('Georgia'))!;
    expect(step.note).toContain('verified against Georgia Department of Revenue, 2026-10-22');
    const stepCo = salaryTakeHome.explainSteps!({ ...stBase, state: 'CO' }).find((s) => s.label.includes('Colorado'))!;
    expect(stepCo.note).toContain('estimate');
  });
  it('the FAQ text lists the verified states from the data, not a copied list', () => {
    const answers = paycheck.educational.faqs!.map((f) => f.answer).join(' ');
    for (const name of verifiedStateNames()) expect(answers).toContain(name);
  });
});

describe('Pennsylvania HSA (PA Department of Revenue letter ruling PIT-06-005)', () => {
  // python Decimal: (100,000 - 4,000 cafeteria-plan benefits) x 3.07% = 2,947.20; the 401(k) is NOT excluded: (100,000 - 0) x 3.07% = 3,070.00
  it('Section 125 benefits (health, HSA) are excluded from PA wages: 3.07% x 96,000 = $2,947.20', () => {
    const r = paycheck.calculate({ ...payBase, state: 'PA', preTaxDeductions: '4000' });
    expect(getValue(r, 'statePerPaycheck')).toBe('$113.35'); // 2,947.20 / 26
    expect(stateIncomeTax('PA', 96000)).toBeCloseTo(2947.2, 2);
  });
  it('a 401(k) deferral is not excluded from PA wages (3.07% x 100,000 = $3,070.00, $118.08 per check)', () => {
    const r = paycheck.calculate({ ...payBase, state: 'PA', retirementContributions: '10000' });
    expect(getValue(r, 'statePerPaycheck')).toBe('$118.08');
  });
  it('the step text cites the ruling and the limitations say what is and is not excluded', () => {
    const note = paycheck.explainSteps!({ ...payBase, state: 'PA', preTaxDeductions: '4000' }).find((s) => s.label === 'State income tax')!.note!;
    expect(note).toContain('PIT-06-005');
    expect(note).toContain('outside a cafeteria plan');
    const lim = paycheck.educational.limitations!.join(' ');
    expect(lim).toContain('PIT-06-005');
    expect(lim).toContain('outside a cafeteria plan');
  });
  it('the PA note does not appear for other states or when there are no benefits', () => {
    const other = paycheck.explainSteps!({ ...payBase, state: 'CA', preTaxDeductions: '4000' }).find((s) => s.label === 'State income tax')!.note!;
    expect(other).not.toContain('PIT-06-005');
    const none = paycheck.explainSteps!({ ...payBase, state: 'PA' }).find((s) => s.label === 'State income tax')!.note!;
    expect(none).not.toContain('PIT-06-005');
  });
});
