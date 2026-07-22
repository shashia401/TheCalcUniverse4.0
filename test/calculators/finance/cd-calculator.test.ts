import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/cd-calculator/index';
import { getValue, getResult, parseMoney, parseNumber, parsePercent, near } from '../../helpers';

describe('cd calculator', () => {
  // ── Basic calculations ──────────────────────────────────────────────
  it('calculates CD maturity with monthly compounding', () => {
    const r = config.calculate({
      initialDeposit: '10000',
      termUnit: 'years',
      termLength: '5',
      apy: '5',
      compounding: 'monthly',
      additionalDeposit: '0',
    });
    const balance = parseMoney(getValue(r, 'balance'));
    // $10K at 5% for 5yr monthly: ~$12,833.59
    expect(balance).toBeGreaterThan(12800);
    expect(balance).toBeLessThan(12900);
  });

  it('calculates short-term CD in months', () => {
    const r = config.calculate({
      initialDeposit: '5000',
      termUnit: 'months',
      termLength: '6',
      apy: '4.5',
      compounding: 'monthly',
      additionalDeposit: '0',
    });
    const balance = parseMoney(getValue(r, 'balance'));
    // $5K at 4.5% for 6mo monthly: ~$5,113.64
    expect(balance).toBeGreaterThan(5100);
    expect(balance).toBeLessThan(5200);
  });

  it('calculates CD with annual compounding', () => {
    const r = config.calculate({
      initialDeposit: '10000',
      termUnit: 'years',
      termLength: '3',
      apy: '4',
      compounding: 'annually',
      additionalDeposit: '0',
    });
    const interest = parseMoney(getValue(r, 'totalInterest'));
    // $10K at 4% for 3yr annual: $1,248.64 interest
    expect(interest).toBeGreaterThan(1200);
    expect(interest).toBeLessThan(1300);
  });

  it('calculates CD with daily compounding', () => {
    const r = config.calculate({
      initialDeposit: '10000',
      termUnit: 'years',
      termLength: '1',
      apy: '5',
      compounding: 'daily',
      additionalDeposit: '0',
    });
    const balance = parseMoney(getValue(r, 'balance'));
    // $10K at 5% for 1yr daily: ~$10,512.67
    expect(balance).toBeGreaterThan(10500);
    expect(balance).toBeLessThan(10600);
  });

  it('calculates CD with quarterly compounding', () => {
    const r = config.calculate({
      initialDeposit: '25000',
      termUnit: 'years',
      termLength: '2',
      apy: '4.5',
      compounding: 'quarterly',
      additionalDeposit: '0',
    });
    const balance = parseMoney(getValue(r, 'balance'));
    // $25K at 4.5% for 2yr quarterly: ~$27,320
    expect(balance).toBeGreaterThan(27300);
    expect(balance).toBeLessThan(27500);
  });

  it('daily compounding earns more than annual for same APY (more frequent = higher effective)', () => {
    const daily = config.calculate({
      initialDeposit: '10000',
      termUnit: 'years',
      termLength: '5',
      apy: '5',
      compounding: 'daily',
      additionalDeposit: '0',
    });
    const annual = config.calculate({
      initialDeposit: '10000',
      termUnit: 'years',
      termLength: '5',
      apy: '5',
      compounding: 'annually',
      additionalDeposit: '0',
    });
    const dailyBal = parseMoney(getValue(daily, 'balance'));
    const annualBal = parseMoney(getValue(annual, 'balance'));
    expect(dailyBal).toBeGreaterThan(annualBal);
  });

  it('shows correct total interest', () => {
    const r = config.calculate({
      initialDeposit: '20000',
      termUnit: 'years',
      termLength: '3',
      apy: '4',
      compounding: 'annually',
      additionalDeposit: '0',
    });
    const principal = parseMoney(getValue(r, 'totalPrincipal'));
    const balance = parseMoney(getValue(r, 'balance'));
    const interest = parseMoney(getValue(r, 'totalInterest'));
    near(principal, 20000);
    near(interest, balance - 20000, 0.10);
  });

  // ── Term unit conversions ───────────────────────────────────────────
  it('handles months to years conversion correctly (12mo = 1yr)', () => {
    const monthsCalc = config.calculate({
      initialDeposit: '10000',
      termUnit: 'months',
      termLength: '12',
      apy: '5',
      compounding: 'monthly',
      additionalDeposit: '0',
    });
    const yearsCalc = config.calculate({
      initialDeposit: '10000',
      termUnit: 'years',
      termLength: '1',
      apy: '5',
      compounding: 'monthly',
      additionalDeposit: '0',
    });
    const monthsBal = parseMoney(getValue(monthsCalc, 'balance'));
    const yearsBal = parseMoney(getValue(yearsCalc, 'balance'));
    near(monthsBal, yearsBal, 1);
  });

  it('handles 18-month term correctly', () => {
    const r = config.calculate({
      initialDeposit: '10000',
      termUnit: 'months',
      termLength: '18',
      apy: '4.65',
      compounding: 'monthly',
      additionalDeposit: '0',
    });
    const balance = parseMoney(getValue(r, 'balance'));
    // $10K at 4.65% for 18mo monthly: ~$10,715
    expect(balance).toBeGreaterThan(10700);
    expect(balance).toBeLessThan(10800);
  });

  // ── Additional deposits ─────────────────────────────────────────────
  it('handles additional deposits correctly', () => {
    const r = config.calculate({
      initialDeposit: '10000',
      termUnit: 'years',
      termLength: '2',
      apy: '5',
      compounding: 'monthly',
      additionalDeposit: '200',
    });
    const balance = parseMoney(getValue(r, 'balance'));
    // $10K + $200/mo × 24 = $14,800 principal. With interest > $16,000
    expect(balance).toBeGreaterThan(16000);
  });

  it('additional deposits with zero additional amount returns same as no additional', () => {
    const withZero = config.calculate({
      initialDeposit: '10000',
      termUnit: 'years',
      termLength: '3',
      apy: '5',
      compounding: 'monthly',
      additionalDeposit: '0',
    });
    const without = config.calculate({
      initialDeposit: '10000',
      termUnit: 'years',
      termLength: '3',
      apy: '5',
      compounding: 'monthly',
      additionalDeposit: '',
    });
    const bal1 = parseMoney(getValue(withZero, 'balance'));
    const bal2 = parseMoney(getValue(without, 'balance'));
    near(bal1, bal2, 1);
  });

  it('additional deposits with zero APY work correctly', () => {
    const r = config.calculate({
      initialDeposit: '10000',
      termUnit: 'years',
      termLength: '2',
      apy: '0',
      compounding: 'monthly',
      additionalDeposit: '200',
    });
    const balance = parseMoney(getValue(r, 'balance'));
    // $10K + $200 × 24 = $14,800, no interest
    near(balance, 14800, 1);
  });

  // ── Edge cases: NaN, empty, invalid ─────────────────────────────────
  it('returns empty for zero deposit', () => {
    const r = config.calculate({
      initialDeposit: '0',
      termUnit: 'years',
      termLength: '5',
      apy: '5',
      compounding: 'monthly',
      additionalDeposit: '0',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for negative deposit', () => {
    const r = config.calculate({
      initialDeposit: '-1000',
      termUnit: 'years',
      termLength: '1',
      apy: '5',
      compounding: 'monthly',
      additionalDeposit: '0',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for missing required field', () => {
    expect(config.calculate({ initialDeposit: '', termUnit: 'years', termLength: '1', apy: '5', compounding: 'monthly', additionalDeposit: '0' })).toEqual([]);
    expect(config.calculate({ initialDeposit: '10000', termUnit: 'years', termLength: '', apy: '5', compounding: 'monthly', additionalDeposit: '0' })).toEqual([]);
    expect(config.calculate({ initialDeposit: '10000', termUnit: 'years', termLength: '1', apy: '', compounding: 'monthly', additionalDeposit: '0' })).toEqual([]);
  });

  it('returns empty for NaN input', () => {
    const r = config.calculate({
      initialDeposit: 'abc',
      termUnit: 'years',
      termLength: '5',
      apy: '5',
      compounding: 'monthly',
      additionalDeposit: '0',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for negative term', () => {
    const r = config.calculate({
      initialDeposit: '10000',
      termUnit: 'years',
      termLength: '-1',
      apy: '5',
      compounding: 'monthly',
      additionalDeposit: '0',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for negative APY', () => {
    const r = config.calculate({
      initialDeposit: '10000',
      termUnit: 'years',
      termLength: '1',
      apy: '-5',
      compounding: 'monthly',
      additionalDeposit: '0',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for negative additional deposit', () => {
    const r = config.calculate({
      initialDeposit: '10000',
      termUnit: 'years',
      termLength: '1',
      apy: '5',
      compounding: 'monthly',
      additionalDeposit: '-100',
    });
    expect(r).toEqual([]);
  });

  // ── Result structure ────────────────────────────────────────────────
  it('includes all expected result fields', () => {
    const r = config.calculate({
      initialDeposit: '10000',
      termUnit: 'years',
      termLength: '2',
      apy: '4.5',
      compounding: 'daily',
      additionalDeposit: '0',
    });
    expect(r.length).toBeGreaterThanOrEqual(6);
    const ids = r.map((x) => x.id);
    expect(ids).toContain('balance');
    expect(ids).toContain('totalPrincipal');
    expect(ids).toContain('totalInterest');
    expect(ids).toContain('interestPct');
    expect(ids).toContain('apyResult');
    expect(ids).toContain('compoundingResult');
    expect(ids).toContain('effectiveAnnualRate');
  });

  it('balance is highlighted', () => {
    const r = config.calculate({
      initialDeposit: '10000',
      termUnit: 'years',
      termLength: '1',
      apy: '5',
      compounding: 'monthly',
      additionalDeposit: '0',
    });
    const balanceResult = getResult(r, 'balance');
    expect(balanceResult.highlight).toBe(true);
  });

  it('interestPct is a percentage string with % sign', () => {
    const r = config.calculate({
      initialDeposit: '10000',
      termUnit: 'years',
      termLength: '3',
      apy: '5',
      compounding: 'monthly',
      additionalDeposit: '0',
    });
    const pctStr = getValue(r, 'interestPct');
    expect(pctStr).toContain('%');
    const pct = parsePercent(pctStr);
    expect(pct).toBeGreaterThan(0);
    expect(pct).toBeLessThan(100);
  });

  // ── Effective annual rate ───────────────────────────────────────────
  it('shows effective annual rate', () => {
    const r = config.calculate({
      initialDeposit: '10000',
      termUnit: 'years',
      termLength: '1',
      apy: '5',
      compounding: 'monthly',
      additionalDeposit: '0',
    });
    const earStr = getValue(r, 'effectiveAnnualRate');
    const ear = parsePercent(earStr);
    // For monthly compounding at 5% nominal: (1+0.05/12)^12 - 1 = ~5.116%
    expect(ear).toBeGreaterThan(5);
  });

  it('effective annual rate equals APY for annual compounding', () => {
    const r = config.calculate({
      initialDeposit: '10000',
      termUnit: 'years',
      termLength: '1',
      apy: '5',
      compounding: 'annually',
      additionalDeposit: '0',
    });
    const earStr = getValue(r, 'effectiveAnnualRate');
    const ear = parsePercent(earStr);
    near(ear, 5, 0.1);
  });

  // ── Large deposit / jumbo CD ────────────────────────────────────────
  it('handles jumbo CD deposits gracefully', () => {
    const r = config.calculate({
      initialDeposit: '250000',
      termUnit: 'years',
      termLength: '1',
      apy: '5.25',
      compounding: 'daily',
      additionalDeposit: '0',
    });
    const balance = parseMoney(getValue(r, 'balance'));
    // $250K at 5.25% for 1yr daily: ~$263,470
    expect(balance).toBeGreaterThan(262000);
    expect(balance).toBeLessThan(265000);
  });

  // ── Compounding frequency labels ────────────────────────────────────
  it('shows correct compounding labels', () => {
    const daily = getValue(config.calculate({
      initialDeposit: '1000', termUnit: 'years', termLength: '1',
      apy: '5', compounding: 'daily', additionalDeposit: '0',
    }), 'compoundingResult');
    const monthly = getValue(config.calculate({
      initialDeposit: '1000', termUnit: 'years', termLength: '1',
      apy: '5', compounding: 'monthly', additionalDeposit: '0',
    }), 'compoundingResult');
    expect(daily).toContain('Daily');
    expect(daily).toContain('365');
    expect(monthly).toContain('Monthly');
    expect(monthly).toContain('12');
  });

  // ── Educational content ─────────────────────────────────────────────
  it('has educational content with all required sections', () => {
    const edu = config.educational;
    expect(edu).toBeDefined();
    expect(edu.formula).toBeTruthy();
    expect(edu.formulaDescription).toBeTruthy();
    expect(edu.explanation).toBeTruthy();
    expect(edu.variables).toBeDefined();
    expect(edu.variables!.length).toBeGreaterThanOrEqual(3);
    expect(edu.howToUse).toBeDefined();
    expect(edu.howToUse!.length).toBeGreaterThanOrEqual(3);
    expect(edu.commonUses).toBeDefined();
    expect(edu.commonUses!.length).toBeGreaterThanOrEqual(2);
    expect(edu.faqs).toBeDefined();
    expect(edu.faqs!.length).toBeGreaterThanOrEqual(7);
    expect(edu.citations).toBeDefined();
    expect(edu.citations!.length).toBeGreaterThanOrEqual(2);
    expect(edu.proTips).toBeDefined();
    expect(edu.proTips!.length).toBeGreaterThanOrEqual(4);
    expect(edu.limitations).toBeDefined();
    expect(edu.workedExamples).toBeDefined();
    expect(edu.workedExamples!.length).toBeGreaterThanOrEqual(3);
    expect(edu.quickReference).toBeDefined();
    expect(edu.quickReference!.length).toBeGreaterThanOrEqual(4);
  });

  it('has explanation over 350 words', () => {
    const words = config.educational!.explanation!.split(/\s+/).filter(w => w.length > 1);
    expect(words.length).toBeGreaterThanOrEqual(350);
  });

  it('has formula source cited', () => {
    expect(config.educational!.formulaSource).toBeTruthy();
    expect(config.educational!.formulaSource!.length).toBeGreaterThan(50);
  });
});
