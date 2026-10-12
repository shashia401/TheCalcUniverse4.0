import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/rmd/index';
import { distributionPeriod, jointFactor, rmdStartAge, uniformFactor } from '../../../src/calculators/finance/rmd/rmdMath';
import { getValue, parseMoney, near } from '../../helpers';

// All expected values below are read from IRS Publication 590-B (2025), Appendix B and its worked examples.
describe('RMD audit: IRS tables', () => {
  it('Pub 590-B example: age 75, $100,000 -> Table III factor 24.6, RMD $4,065', () => {
    const r = config.calculate({ birthYear: '1951', accountBalance: '100000', spouseToggle: 'no', expectedReturn: '6' });
    expect(getValue(r, 'distributionPeriod')).toBe('24.6');
    near(parseMoney(getValue(r, 'currentRmd')), 4065.04, 0.01);
  });

  it('Pub 590-B example: age 75 / spouse 64 (11 years younger) -> Table II factor 25.3, RMD $3,953', () => {
    const r = config.calculate({ birthYear: '1951', accountBalance: '100000', spouseToggle: 'yes', spouseAge: '64', expectedReturn: '6' });
    expect(getValue(r, 'distributionPeriod')).toBe('25.3');
    near(parseMoney(getValue(r, 'currentRmd')), 3952.57, 0.01);
  });

  it('Table III spot checks (Pub 590-B)', () => {
    const t: Record<number, number> = { 72: 27.4, 80: 20.2, 90: 12.2, 100: 6.4, 110: 3.5, 119: 2.3, 120: 2.0, 130: 2.0 };
    for (const [age, f] of Object.entries(t)) expect(uniformFactor(Number(age))).toBe(f);
  });

  it('Table II spot checks (Pub 590-B)', () => {
    expect(jointFactor(72, 61)).toBe(28.1);
    expect(jointFactor(78, 63)).toBe(25.6);
    expect(jointFactor(76, 60)).toBe(28.2);
    expect(jointFactor(85, 70)).toBe(19.5);
    expect(jointFactor(100, 89)).toBe(6.8);
  });

  it('spouse exactly 10 years younger (or less) falls back to the Uniform table with a warning', () => {
    const r = config.calculate({ birthYear: '1951', accountBalance: '100000', spouseToggle: 'yes', spouseAge: '65', expectedReturn: '6' });
    expect(getValue(r, 'distributionPeriod')).toBe('24.6');
    expect(r.find((x) => x.id === 'currentRmd')?.warning).toMatch(/more than 10 years younger/);
    expect(distributionPeriod(75, 65)).toBe(24.6);
    expect(distributionPeriod(75, 64)).toBe(25.3);
  });

  it('joint selected without a spouse age is incomplete', () => {
    expect(config.calculate({ birthYear: '1951', accountBalance: '100000', spouseToggle: 'yes', expectedReturn: '6' })).toEqual([]);
  });
});

describe('RMD audit: start ages and projection', () => {
  it('SECURE 2.0 start ages by birth year', () => {
    expect(rmdStartAge(1950)).toBe(72);
    expect(rmdStartAge(1951)).toBe(73);
    expect(rmdStartAge(1959)).toBe(73);
    expect(rmdStartAge(1960)).toBe(75);
  });

  it('worked example 1 (Margaret): $500k at 73 -> $18,868; age-82 RMD about $30,410 at 6%', () => {
    const r = config.calculate({ birthYear: '1953', accountBalance: '500000', spouseToggle: 'no', expectedReturn: '6' });
    near(parseMoney(getValue(r, 'currentRmd')), 18867.92, 0.01);
    near(parseFloat(getValue(r, 'rmdPct')), 3.77, 0.005);
    const proj = JSON.parse(getValue(r, '_projectionData'));
    // independent hand roll: balance_{n+1} = (balance_n - balance_n/f_n) * 1.06 with Table III factors 26.5 ... 18.5
    expect(proj[9].age).toBe(82);
    near(proj[9].rmd, 30409.58, 0.5);
  });

  it('worked example 2 (Bob): ages 78/63 -> factor 25.6, RMD $29,297 vs $34,091 on the Uniform table', () => {
    const r = config.calculate({ birthYear: '1948', accountBalance: '750000', spouseToggle: 'yes', spouseAge: '63', expectedReturn: '5' });
    expect(getValue(r, 'distributionPeriod')).toBe('25.6');
    near(parseMoney(getValue(r, 'currentRmd')), 750000 / 25.6, 0.01);
    const proj = JSON.parse(getValue(r, '_projectionData'));
    // the spouse ages along with Bob: 79/64 = 24.7 in the next year
    expect(proj[1].factor).toBe(24.7);
    const u = config.calculate({ birthYear: '1948', accountBalance: '750000', spouseToggle: 'no', expectedReturn: '5' });
    near(parseMoney(getValue(u, 'currentRmd')), 34090.91, 0.01);
  });

  it('0% return is accepted (empty field defaults to 6%, an explicit 0 stays 0)', () => {
    const r = config.calculate({ birthYear: '1950', accountBalance: '100000', spouseToggle: 'no', expectedReturn: '0' });
    const proj = JSON.parse(getValue(r, '_projectionData'));
    near(proj[1].balance, 100000 - 100000 / 23.7, 0.01);
  });
});
