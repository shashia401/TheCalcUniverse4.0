import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/half-life/index';
import { getValue, parseNumber, near } from '../../helpers';

// Expected values derived independently (Python: t = t½·log2(N0/Nt), N = N0·2^(-t/t½)), not from this calculator.
describe('half-life audit', () => {
  const modes = [
    { solveFor: 'remainingQuantity', initialQuantity: '100', halfLife: '5', timeElapsed: '10' },
    { solveFor: 'initialQuantity', remainingQuantity: '12.5', halfLife: '3', timeElapsed: '9' },
    { solveFor: 'halfLife', initialQuantity: '200', remainingQuantity: '25', timeElapsed: '15' },
    { solveFor: 'timeElapsed', initialQuantity: '80', remainingQuantity: '10', halfLife: '4' },
  ];

  it.each(modes)('every result id is unique and the solved one is highlighted ($solveFor)', (v) => {
    const r = config.calculate(v);
    const ids = r.map((x) => x.id);
    expect(new Set(ids).size).toBe(ids.length); // duplicate ids made duplicate React keys
    const highlighted = r.filter((x) => x.highlight);
    expect(highlighted).toHaveLength(1);
    expect(highlighted[0].id).toBe(v.solveFor);
  });

  it('shows all four quantities exactly once', () => {
    const r = config.calculate(modes[0]);
    for (const id of ['initialQuantity', 'remainingQuantity', 'halfLife', 'timeElapsed']) {
      expect(r.filter((x) => x.id === id)).toHaveLength(1);
    }
  });

  it('labels use t₁⁄₂, never the old t₁₂⁄₂ typo', () => {
    const r = config.calculate(modes[2]);
    expect(r.find((x) => x.id === 'halfLife')!.label).toBe('Half-Life (t₁⁄₂)');
    expect(JSON.stringify(config.educational)).not.toContain('₁₂⁄₂');
  });

  it('non-integer half-lives: N0=100, t½=5, t=7 -> 37.8929 (100·2^-1.4)', () => {
    const r = config.calculate({ ...modes[0], timeElapsed: '7' });
    near(parseNumber(getValue(r, 'remainingQuantity')), 37.8929141628, 1e-6);
    near(parseNumber(getValue(r, 'halfLives')), 1.4, 1e-9);
  });

  // Worked examples in the educational text
  it('carbon-14: 1 -> 0.35 with t½ 5730 gives 8678.504 years (text says ≈ 8,679)', () => {
    const r = config.calculate({ solveFor: 'timeElapsed', initialQuantity: '1', remainingQuantity: '0.35', halfLife: '5730' });
    near(parseNumber(getValue(r, 'timeElapsed')), 8678.504280, 1e-3);
  });

  it('antibiotic: 500 -> 15 mg with t½ 4 h gives 20.2356 h = 20 h 14 min (4:14 AM after an 8:00 dose)', () => {
    const r = config.calculate({ solveFor: 'timeElapsed', initialQuantity: '500', remainingQuantity: '15', halfLife: '4' });
    near(parseNumber(getValue(r, 'timeElapsed')), 20.2355747562, 1e-6);
    expect(JSON.stringify(config.educational.workedExamples)).toContain('4:14 AM');
  });

  it('Sr-90: 50 kg -> 0.05 kg with t½ 28.8 y gives 287.0146 years', () => {
    const r = config.calculate({ solveFor: 'timeElapsed', initialQuantity: '50', remainingQuantity: '0.05', halfLife: '28.8' });
    near(parseNumber(getValue(r, 'timeElapsed')), 287.0145873983, 1e-6);
  });

  it('rejects nonsense: Nt >= N0 for time/half-life, zero/negative inputs, unknown mode', () => {
    expect(config.calculate({ solveFor: 'timeElapsed', initialQuantity: '10', remainingQuantity: '10', halfLife: '5' })).toEqual([]);
    expect(config.calculate({ solveFor: 'halfLife', initialQuantity: '10', remainingQuantity: '20', timeElapsed: '5' })).toEqual([]);
    expect(config.calculate({ solveFor: 'remainingQuantity', initialQuantity: '0', halfLife: '5', timeElapsed: '1' })).toEqual([]);
    expect(config.calculate({ solveFor: 'bogus', initialQuantity: '1' })).toEqual([]);
  });

  it('huge elapsed time underflows cleanly (no NaN/Infinity text)', () => {
    const r = config.calculate({ solveFor: 'remainingQuantity', initialQuantity: '100', halfLife: '1', timeElapsed: '5000' });
    for (const x of r) expect(x.value).not.toMatch(/NaN|Infinity|undefined/);
  });
});
