import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/half-life/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('half-life', () => {
  it('solve for remaining quantity: N0=100, t12=5, t=10 -> Nt=25', () => {
    const r = config.calculate({
      solveFor: 'remainingQuantity',
      initialQuantity: '100',
      halfLife: '5',
      timeElapsed: '10',
    });
    near(parseNumber(getValue(r, 'remainingQuantity')), 25);
    near(parseNumber(getValue(r, 'halfLives')), 2);
    expect(getValue(r, 'percentRemaining')).toBe('25%');
  });

  it('solve for initial quantity: Nt=12.5, t12=3, t=9 -> N0=100', () => {
    const r = config.calculate({
      solveFor: 'initialQuantity',
      remainingQuantity: '12.5',
      halfLife: '3',
      timeElapsed: '9',
    });
    near(parseNumber(getValue(r, 'initialQuantity')), 100);
  });

  it('solve for half-life: N0=200, Nt=25, t=15 -> t12=5', () => {
    const r = config.calculate({
      solveFor: 'halfLife',
      initialQuantity: '200',
      remainingQuantity: '25',
      timeElapsed: '15',
    });
    near(parseNumber(getValue(r, 'halfLife')), 5, 0.01);
  });

  it('solve for time elapsed: N0=80, Nt=10, t12=4 -> t=12', () => {
    const r = config.calculate({
      solveFor: 'timeElapsed',
      initialQuantity: '80',
      remainingQuantity: '10',
      halfLife: '4',
    });
    near(parseNumber(getValue(r, 'timeElapsed')), 12, 0.01);
  });

  it('carbon-14 dating scenario: N0=100%, Nt=62.5%, t12=5730 -> t≈3885 years', () => {
    const r = config.calculate({
      solveFor: 'timeElapsed',
      initialQuantity: '100',
      remainingQuantity: '62.5',
      halfLife: '5730',
    });
    const tVal = parseNumber(getValue(r, 'timeElapsed'));
    near(tVal, 3885.35, 0.1);
    expect(parseFloat(getValue(r, 'halfLives'))).toBeLessThan(1);
  });

  it('shows all four quantity fields in results', () => {
    const r = config.calculate({
      solveFor: 'remainingQuantity',
      initialQuantity: '100',
      halfLife: '5',
      timeElapsed: '10',
    });
    expect(getValue(r, 'initialQuantity')).toBeTruthy();
    expect(getValue(r, 'remainingQuantity')).toBeTruthy();
    expect(getValue(r, 'halfLife')).toBeTruthy();
    expect(getValue(r, 'timeElapsed')).toBeTruthy();
  });

  it('handles fractional values', () => {
    const r = config.calculate({
      solveFor: 'remainingQuantity',
      initialQuantity: '100',
      halfLife: '3.5',
      timeElapsed: '7',
    });
    near(parseNumber(getValue(r, 'remainingQuantity')), 25, 0.01);
  });

  it('rejects Nt >= N0 when solving for time elapsed', () => {
    const r = config.calculate({
      solveFor: 'timeElapsed',
      initialQuantity: '50',
      remainingQuantity: '50',
      halfLife: '5',
    });
    expect(r).toEqual([]);
  });

  it('rejects Nt >= N0 when solving for half-life', () => {
    const r = config.calculate({
      solveFor: 'halfLife',
      initialQuantity: '100',
      remainingQuantity: '200',
      timeElapsed: '10',
    });
    expect(r).toEqual([]);
  });

  it('rejects Nt > N0 when solving for half-life (edge case)', () => {
    const r = config.calculate({
      solveFor: 'halfLife',
      initialQuantity: '100',
      remainingQuantity: '100',
      timeElapsed: '5',
    });
    expect(r).toEqual([]);
  });

  it('rejects empty/missing inputs', () => {
    const r = config.calculate({
      solveFor: 'remainingQuantity',
      initialQuantity: '',
      halfLife: '5',
      timeElapsed: '10',
    });
    expect(r).toEqual([]);
  });

  it('rejects zero initial quantity', () => {
    const r = config.calculate({
      solveFor: 'remainingQuantity',
      initialQuantity: '0',
      halfLife: '5',
      timeElapsed: '10',
    });
    expect(r).toEqual([]);
  });

  it('rejects zero half-life', () => {
    const r = config.calculate({
      solveFor: 'remainingQuantity',
      initialQuantity: '100',
      halfLife: '0',
      timeElapsed: '10',
    });
    expect(r).toEqual([]);
  });

  it('rejects negative half-life', () => {
    const r = config.calculate({
      solveFor: 'remainingQuantity',
      initialQuantity: '100',
      halfLife: '-5',
      timeElapsed: '10',
    });
    expect(r).toEqual([]);
  });

  it('rejects negative time elapsed', () => {
    const r = config.calculate({
      solveFor: 'remainingQuantity',
      initialQuantity: '100',
      halfLife: '5',
      timeElapsed: '-10',
    });
    expect(r).toEqual([]);
  });

  it('allows time elapsed of zero (t=0 meaning Nt = N0)', () => {
    const r = config.calculate({
      solveFor: 'remainingQuantity',
      initialQuantity: '50',
      halfLife: '5',
      timeElapsed: '0',
    });
    expect(r.length).toBeGreaterThan(0);
    near(parseNumber(getValue(r, 'remainingQuantity')), 50);
    expect(getValue(r, 'percentRemaining')).toBe('100%');
  });

  it('rejects missing solveFor', () => {
    const r = config.calculate({
      solveFor: '',
      initialQuantity: '100',
      halfLife: '5',
      timeElapsed: '10',
    });
    expect(r).toEqual([]);
  });

  it('rejects non-numeric input', () => {
    const r = config.calculate({
      solveFor: 'remainingQuantity',
      initialQuantity: 'abc',
      halfLife: '5',
      timeElapsed: '10',
    });
    expect(r).toEqual([]);
  });

  it('handles large ratio correctly: 1e20 to 1e-6 with t12=5', () => {
    const r = config.calculate({
      solveFor: 'timeElapsed',
      initialQuantity: '1e20',
      remainingQuantity: '0.000001',
      halfLife: '5',
    });
    // log2(1e20/1e-6) = log2(1e26) ≈ 86.37 half-lives × 5 ≈ 431.85
    const tVal = parseNumber(getValue(r, 'timeElapsed'));
    near(tVal, 431.85, 0.1);
  });

  it('solves drug half-life scenario: 500mg, t12=4h, t=12h -> 62.5mg', () => {
    const r = config.calculate({
      solveFor: 'remainingQuantity',
      initialQuantity: '500',
      halfLife: '4',
      timeElapsed: '12',
    });
    near(parseNumber(getValue(r, 'remainingQuantity')), 62.5);
  });

  it('solve for initial: Nt=50, t12=5, t=5 -> N0=100 (one half-life reverse)', () => {
    const r = config.calculate({
      solveFor: 'initialQuantity',
      remainingQuantity: '50',
      halfLife: '5',
      timeElapsed: '5',
    });
    near(parseNumber(getValue(r, 'initialQuantity')), 100);
  });

  it('solve for time: very small remaining fraction', () => {
    const r = config.calculate({
      solveFor: 'timeElapsed',
      initialQuantity: '1000',
      remainingQuantity: '0.977',
      halfLife: '5',
    });
    // 1000 * (1/2)^(t/5) = 0.977 -> t/5 = log2(1000/0.977) ≈ 10 -> t ≈ 50
    const tVal = parseNumber(getValue(r, 'timeElapsed'));
    expect(tVal).toBeGreaterThan(49);
    expect(tVal).toBeLessThan(51);
  });

  it('correctly identifies the solved-for field as highlighted', () => {
    const r = config.calculate({
      solveFor: 'remainingQuantity',
      initialQuantity: '100',
      halfLife: '5',
      timeElapsed: '10',
    });
    const highlighted = r.find((x: { id: string; highlight?: boolean }) => x.id === 'remainingQuantity');
    expect(highlighted?.highlight).toBe(true);
  });

  it('educational content has workedExamples', () => {
    expect(config.educational.workedExamples).toBeDefined();
    expect(config.educational.workedExamples!.length).toBeGreaterThanOrEqual(3);
  });

  it('educational content has 5+ FAQs', () => {
    expect(config.educational.faqs).toBeDefined();
    expect(config.educational.faqs!.length).toBeGreaterThanOrEqual(5);
  });

  it('educational content has proTips', () => {
    expect(config.educational.proTips).toBeDefined();
    expect(config.educational.proTips!.length).toBeGreaterThanOrEqual(3);
  });

  it('educational content has limitations', () => {
    expect(config.educational.limitations).toBeDefined();
    expect(config.educational.limitations!.length).toBeGreaterThanOrEqual(3);
  });

  it('educational content has quickReference', () => {
    expect(config.educational.quickReference).toBeDefined();
    expect(config.educational.quickReference!.length).toBeGreaterThanOrEqual(5);
  });

  it('number inputs have inputMode decimal', () => {
    const numInputs = config.inputs.filter((i: { type: string }) => i.type === 'number');
    expect(numInputs.length).toBeGreaterThan(0);
    for (const inp of numInputs) {
      expect((inp as { inputMode?: string }).inputMode).toBe('decimal');
    }
  });
});
