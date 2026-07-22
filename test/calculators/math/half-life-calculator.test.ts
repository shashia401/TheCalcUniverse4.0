import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/half-life';
import { getValue, parseNumber, near } from '../../helpers';

describe('half-life-calculator', () => {
  it('solve for remaining: N0=100, t12=5, t=10 → Nt=25', () => {
    const r = config.calculate({
      solveFor: 'remainingQuantity',
      initialQuantity: '100',
      halfLife: '5',
      timeElapsed: '10',
    });
    near(parseNumber(getValue(r, 'remainingQuantity')), 25);
    // 2 half-lives elapsed
    near(parseNumber(getValue(r, 'halfLives')), 2);
  });

  it('solve for remaining: N0=100, t12=5, t=5 → Nt=50 (one half-life)', () => {
    const r = config.calculate({
      solveFor: 'remainingQuantity',
      initialQuantity: '100',
      halfLife: '5',
      timeElapsed: '5',
    });
    near(parseNumber(getValue(r, 'remainingQuantity')), 50);
  });

  it('solve for remaining at t=0 → Nt=N0', () => {
    const r = config.calculate({
      solveFor: 'remainingQuantity',
      initialQuantity: '100',
      halfLife: '5',
      timeElapsed: '0',
    });
    near(parseNumber(getValue(r, 'remainingQuantity')), 100);
  });

  it('solve for initial: Nt=25, t12=5, t=10 → N0=100', () => {
    const r = config.calculate({
      solveFor: 'initialQuantity',
      remainingQuantity: '25',
      halfLife: '5',
      timeElapsed: '10',
    });
    near(parseNumber(getValue(r, 'initialQuantity')), 100);
  });

  it('solve for half-life: N0=100, Nt=25, t=10 → t12=5', () => {
    const r = config.calculate({
      solveFor: 'halfLife',
      initialQuantity: '100',
      remainingQuantity: '25',
      timeElapsed: '10',
    });
    near(parseNumber(getValue(r, 'halfLife')), 5, 0.001);
  });

  it('solve for half-life: N0=100, Nt=50, t=5730 → t12≈5730 (C-14)', () => {
    const r = config.calculate({
      solveFor: 'halfLife',
      initialQuantity: '100',
      remainingQuantity: '50',
      timeElapsed: '5730',
    });
    near(parseNumber(getValue(r, 'halfLife')), 5730, 0.1);
  });

  it('solve for time: N0=100, Nt=25, t12=5 → t=10', () => {
    const r = config.calculate({
      solveFor: 'timeElapsed',
      initialQuantity: '100',
      remainingQuantity: '25',
      halfLife: '5',
    });
    near(parseNumber(getValue(r, 'timeElapsed')), 10, 0.001);
  });

  it('percentage remaining: 25/100 = 25%', () => {
    const r = config.calculate({
      solveFor: 'remainingQuantity',
      initialQuantity: '100',
      halfLife: '5',
      timeElapsed: '10',
    });
    expect(getValue(r, 'percentRemaining')).toContain('25');
  });

  it('percentage remaining at t=0 = 100%', () => {
    const r = config.calculate({
      solveFor: 'remainingQuantity',
      initialQuantity: '100',
      halfLife: '5',
      timeElapsed: '0',
    });
    expect(getValue(r, 'percentRemaining')).toContain('100');
  });

  it('rejects N0 <= 0 for remainingQuantity', () => {
    const r = config.calculate({
      solveFor: 'remainingQuantity',
      initialQuantity: '0',
      halfLife: '5',
      timeElapsed: '10',
    });
    expect(r).toEqual([]);
  });

  it('rejects t12 <= 0 for remainingQuantity', () => {
    const r = config.calculate({
      solveFor: 'remainingQuantity',
      initialQuantity: '100',
      halfLife: '-5',
      timeElapsed: '10',
    });
    expect(r).toEqual([]);
  });

  it('rejects Nt >= N0 for halfLife', () => {
    const r = config.calculate({
      solveFor: 'halfLife',
      initialQuantity: '50',
      remainingQuantity: '100',
      timeElapsed: '10',
    });
    expect(r).toEqual([]);
  });

  it('rejects Nt >= N0 for timeElapsed', () => {
    const r = config.calculate({
      solveFor: 'timeElapsed',
      initialQuantity: '50',
      remainingQuantity: '100',
      halfLife: '5',
    });
    expect(r).toEqual([]);
  });

  it('rejects NaN initialQuantity', () => {
    const r = config.calculate({
      solveFor: 'remainingQuantity',
      initialQuantity: 'abc',
      halfLife: '5',
      timeElapsed: '10',
    });
    expect(r).toEqual([]);
  });

  it('rejects NaN halfLife', () => {
    const r = config.calculate({
      solveFor: 'remainingQuantity',
      initialQuantity: '100',
      halfLife: '',
      timeElapsed: '10',
    });
    expect(r).toEqual([]);
  });

  it('rejects empty solveFor', () => {
    const r = config.calculate({ solveFor: '' });
    expect(r).toEqual([]);
  });

  it('half-lives elapsed = 3 for N0=100, t12=5, t=15', () => {
    const r = config.calculate({
      solveFor: 'remainingQuantity',
      initialQuantity: '100',
      halfLife: '5',
      timeElapsed: '15',
    });
    near(parseNumber(getValue(r, 'halfLives')), 3);
    near(parseNumber(getValue(r, 'remainingQuantity')), 12.5);
  });
});
