import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/rmd/index';
import { getValue, parseMoney, near } from '../../helpers';

describe('RMD Calculator', () => {
  it('returns RMD for someone at RMD age using Uniform Lifetime Table', () => {
    const r = config.calculate({
      birthYear: '1950',
      accountBalance: '500000',
      spouseToggle: 'no',
      expectedReturn: '6',
    });
    expect(getValue(r, 'currentRmd')).toBeTruthy();
    expect(getValue(r, 'distributionPeriod')).toBeTruthy();
    expect(getValue(r, 'rmdPct')).toBeTruthy();
    expect(getValue(r, 'penaltyWarning')).toBeTruthy();
    near(parseMoney(getValue(r, 'currentRmd')), 500000 / 23.7, 1);
  });

  it('shows penalty warning for missed RMD', () => {
    const r = config.calculate({
      birthYear: '1950',
      accountBalance: '500000',
      spouseToggle: 'no',
      expectedReturn: '6',
    });
    expect(getValue(r, 'penaltyWarning')).toContain('$');
    const penaltyText = getValue(r, 'penaltyWarning').replace('Potential penalty: ', '');
    const penaltyAmount = parseMoney(penaltyText);
    near(penaltyAmount, (500000 / 23.7) * 0.25, 1);
  });

  it('shows not-yet message when under RMD age', () => {
    const r = config.calculate({
      birthYear: '2000',
      accountBalance: '100000',
      spouseToggle: 'no',
      expectedReturn: '6',
    });
    expect(getValue(r, 'notYet')).toContain('RMDs begin at age');
    expect(getValue(r, 'yearsUntil')).toContain('years');
  });

  it('uses joint life table when spouse is more than 10 years younger', () => {
    const r = config.calculate({
      birthYear: '1950',
      accountBalance: '500000',
      spouseToggle: 'yes',
      expectedReturn: '6',
    });
    near(parseMoney(getValue(r, 'currentRmd')), 500000 / 29.8, 1);
    expect(getValue(r, 'distributionPeriod')).toContain('29.8');
  });

  it('returns empty array when birth year is missing', () => {
    const r = config.calculate({
      birthYear: '',
      accountBalance: '500000',
      spouseToggle: 'no',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array when account balance is missing', () => {
    const r = config.calculate({
      birthYear: '1960',
      accountBalance: '',
      spouseToggle: 'no',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array when birth year is not a number', () => {
    const r = config.calculate({
      birthYear: 'abc',
      accountBalance: '100000',
    });
    expect(r).toEqual([]);
  });

  it('includes 10-year projection data', () => {
    const r = config.calculate({
      birthYear: '1950',
      accountBalance: '500000',
      spouseToggle: 'no',
      expectedReturn: '6',
    });
    const projection = JSON.parse(getValue(r, '_projectionData'));
    expect(Array.isArray(projection)).toBe(true);
    expect(projection.length).toBe(10);
    expect(projection[0]).toHaveProperty('year');
    expect(projection[0]).toHaveProperty('age');
    expect(projection[0]).toHaveProperty('balance');
    expect(projection[0]).toHaveProperty('rmd');
    expect(projection[0]).toHaveProperty('factor');
  });

  it('shows SECURE 2.0 age 73 start for birth year 1951-1959', () => {
    const r = config.calculate({
      birthYear: '1958',
      accountBalance: '400000',
      spouseToggle: 'no',
      expectedReturn: '6',
    });
    expect(getValue(r, 'notYet')).toContain('73');
  });

  it('shows SECURE 2.0 age 75 start for birth year 1960+', () => {
    const r = config.calculate({
      birthYear: '1970',
      accountBalance: '200000',
      spouseToggle: 'no',
      expectedReturn: '6',
    });
    expect(getValue(r, 'notYet')).toContain('75');
  });

  it('uses expected return for 10-year projection growth', () => {
    const rLow = config.calculate({
      birthYear: '1950',
      accountBalance: '500000',
      spouseToggle: 'no',
      expectedReturn: '2',
    });
    const projLow = JSON.parse(getValue(rLow, '_projectionData'));

    const rHigh = config.calculate({
      birthYear: '1950',
      accountBalance: '500000',
      spouseToggle: 'no',
      expectedReturn: '10',
    });
    const projHigh = JSON.parse(getValue(rHigh, '_projectionData'));

    const lastLow = projLow[projLow.length - 1].balance;
    const lastHigh = projHigh[projHigh.length - 1].balance;
    expect(lastHigh).toBeGreaterThan(lastLow);
  });

  it('shows RMD start age note', () => {
    const r = config.calculate({
      birthYear: '1953',
      accountBalance: '500000',
      spouseToggle: 'no',
      expectedReturn: '6',
    });
    expect(getValue(r, 'rmdStartNote')).toBe('Age 73');
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
