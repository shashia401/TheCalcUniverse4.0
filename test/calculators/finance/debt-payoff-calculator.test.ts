import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/debt-payoff/index';
import { getValue, parseMoney, near } from '../../helpers';

describe('Debt Payoff Calculator', () => {
  const defaultInputs = {
    extraPayment: '200',
    card1name: 'Chase Sapphire',
    card1balance: '4500',
    card1rate: '22.99',
    card1min: '85',
    card2name: 'Citi Double Cash',
    card2balance: '2100',
    card2rate: '19.99',
    card2min: '45',
  };

  it('returns empty array when no cards are defined', () => {
    expect(config.calculate({})).toHaveLength(0);
    expect(config.calculate({ extraPayment: '100' })).toHaveLength(0);
  });

  it('returns empty array when balance is 0', () => {
    expect(config.calculate({ extraPayment: '100', card1balance: '0', card1rate: '22' })).toHaveLength(0);
  });

  it('computes total debt across cards', () => {
    const r = config.calculate(defaultInputs);
    const totalDebt = parseMoney(getValue(r, 'totalDebt'));
    near(totalDebt, 6600, 1);
  });

  it('computes total minimum payments', () => {
    const r = config.calculate(defaultInputs);
    const totalMinVal = getValue(r, 'totalMin').replace(/\/mo.*$/, '').trim();
    const totalMin = parseMoney(totalMinVal);
    near(totalMin, 130, 1);
  });

  it('matches the "Sarah" worked example with freed-up minimums rolling over (27 months each; independent hand simulation: $2,118.57 / $2,026.84 interest)', () => {
    const r = config.calculate({
      extraPayment: '200',
      card1name: 'Chase Sapphire', card1balance: '4500', card1rate: '22.99', card1min: '85',
      card2name: 'Citi Double Cash', card2balance: '2100', card2rate: '19.99', card2min: '45',
      card3name: 'CapOne', card3balance: '850', card3rate: '28.99', card3min: '25',
    });
    expect(getValue(r, 'snowballTime')).toBe('2yr 3mo');
    expect(getValue(r, 'avalancheTime')).toBe('2yr 3mo');
    near(parseMoney(getValue(r, 'snowballInterest')), 2119, 1);
    near(parseMoney(getValue(r, 'avalancheInterest')), 2027, 1);
  });

  it('rolls a cleared minimum into the next card (two cards, no extra)', () => {
    // Card A: $100 @12%, min $50; Card B: $1000 @12%, min $20. Total budget $70/mo.
    // Without rollover B alone would take far longer; with rollover the whole $70 goes to B after A clears.
    const r = config.calculate({
      extraPayment: '0',
      card1name: 'A', card1balance: '100', card1rate: '12', card1min: '50',
      card2name: 'B', card2balance: '1000', card2rate: '12', card2min: '20',
    });
    // Independent simulation of a constant $70/mo budget gives 18 months.
    expect(getValue(r, 'snowballTime')).toBe('1yr 6mo');
  });

  it('avalanche saves more or equal interest than snowball', () => {
    const r = config.calculate(defaultInputs);
    const snowballInterest = parseMoney(getValue(r, 'snowballInterest'));
    const avalancheInterest = parseMoney(getValue(r, 'avalancheInterest'));
    expect(avalancheInterest).toBeLessThanOrEqual(snowballInterest + 0.01);
  });

  it('both strategies produce payoff times', () => {
    const r = config.calculate(defaultInputs);
    expect(getValue(r, 'snowballTime')).toBeTruthy();
    expect(getValue(r, 'avalancheTime')).toBeTruthy();
  });

  it('handles single card with extra payment', () => {
    const r = config.calculate({
      extraPayment: '100',
      card1name: 'Only Card',
      card1balance: '2000',
      card1rate: '18',
      card1min: '40',
    });
    expect(getValue(r, 'totalDebt')).toContain('2,000');
    expect(getValue(r, 'snowballTime')).toBe(getValue(r, 'avalancheTime'));
  });

  it('handles three cards', () => {
    const r = config.calculate({
      extraPayment: '300',
      card1name: 'A', card1balance: '5000', card1rate: '24', card1min: '100',
      card2name: 'B', card2balance: '3000', card2rate: '18', card2min: '60',
      card3name: 'C', card3balance: '1000', card3rate: '29', card3min: '25',
    });
    expect(r.length).toBeGreaterThanOrEqual(7);
    expect(getValue(r, 'totalDebt')).toContain('9,000');
  });

  it('handles zero extra payment', () => {
    const r = config.calculate({
      extraPayment: '0',
      card1name: 'A', card1balance: '1000', card1rate: '20', card1min: '25',
    });
    expect(getValue(r, 'snowballTime')).toBeTruthy();
    expect(getValue(r, 'avalancheTime')).toBeTruthy();
  });

  it('shows interest saved comparison', () => {
    const r = config.calculate(defaultInputs);
    expect(getValue(r, 'interestSaved')).toBeTruthy();
  });

  it('educational content has required sections', () => {
    const edu = config.educational;
    expect(edu.formula).toBeTruthy();
    expect(edu.variables.length).toBeGreaterThanOrEqual(3);
    expect(edu.faqs.length).toBeGreaterThanOrEqual(5);
    expect(edu.workedExamples).toBeDefined();
    if (edu.workedExamples) {
      expect(edu.workedExamples.length).toBeGreaterThanOrEqual(2);
      edu.workedExamples.forEach((ex) => {
        expect(ex.scenario).toBeTruthy();
        expect(ex.inputs).toBeDefined();
        expect(ex.insight).toBeTruthy();
      });
    }
    expect(edu.proTips).toBeDefined();
    if (edu.proTips) {
      expect(edu.proTips.length).toBeGreaterThanOrEqual(4);
    }
    expect(edu.limitations).toBeTruthy();
    expect(edu.quickReference).toBeDefined();
    if (edu.quickReference) {
      expect(edu.quickReference.length).toBeGreaterThanOrEqual(5);
    }
  });
});
