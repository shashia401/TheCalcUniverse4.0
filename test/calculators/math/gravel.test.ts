import { describe, it, expect, beforeAll } from 'vitest';
import { getValue, parseNumber, near } from '../../helpers';

describe('Gravel Calculator', () => {
  let calculate: (values: Record<string, string>) => any[];

  beforeAll(async () => {
    const mod = await import(
      '../../../src/calculators/math/gravel/index'
    );
    calculate = mod.default.calculate;
  });

  // ---------------------------------------------------------------------------
  // Basic cubic yard calculations
  // ---------------------------------------------------------------------------

  it('calculates cubic yards for a 10x10 rectangle at 4 inch depth', () => {
    const results = calculate({
      length: '10',
      width: '10',
      depth: '4',
      material: 'pea-gravel',
    });
    const cubicYards = parseNumber(getValue(results, 'cubic-yards'));
    // 10 × 10 × 4 / 324 ≈ 1.2346
    near(cubicYards, 1.2346);
  });

  it('calculates cubic yards for a 12x20 rectangle at 6 inch depth', () => {
    const results = calculate({
      length: '12',
      width: '20',
      depth: '6',
      material: 'pea-gravel',
    });
    const cubicYards = parseNumber(getValue(results, 'cubic-yards'));
    // 12 × 20 × 6 / 324 ≈ 4.4444
    near(cubicYards, 4.4444);
  });

  it('calculates cubic yards for a 50x30 rectangle at 2 inch depth', () => {
    const results = calculate({
      length: '50',
      width: '30',
      depth: '2',
      material: 'pea-gravel',
    });
    const cubicYards = parseNumber(getValue(results, 'cubic-yards'));
    // 50 × 30 × 2 / 324 ≈ 9.2593
    near(cubicYards, 9.2593);
  });

  // ---------------------------------------------------------------------------
  // Tons calculation
  // ---------------------------------------------------------------------------

  it('calculates tons correctly for pea gravel (density 2700)', () => {
    const results = calculate({
      length: '10',
      width: '10',
      depth: '4',
      material: 'pea-gravel',
    });
    const tons = parseNumber(getValue(results, 'tons'));
    // cu yd = 1.2346, tons = 1.2346 × 2700 / 2000 ≈ 1.6667
    near(tons, 1.6667);
  });

  it('calculates tons correctly for crushed limestone (density 2600)', () => {
    const results = calculate({
      length: '10',
      width: '10',
      depth: '4',
      material: 'crushed-limestone',
    });
    const tons = parseNumber(getValue(results, 'tons'));
    // cu yd = 1.2346, tons = 1.2346 × 2600 / 2000 ≈ 1.6049
    near(tons, 1.6049);
  });

  // ---------------------------------------------------------------------------
  // Material type changes tonnage
  // ---------------------------------------------------------------------------

  it('returns different tonnage for different materials at same volume', () => {
    const r1 = calculate({
      length: '10',
      width: '10',
      depth: '6',
      material: 'pea-gravel',
    });
    const r2 = calculate({
      length: '10',
      width: '10',
      depth: '6',
      material: 'river-rock',
    });
    const peaTons = parseNumber(getValue(r1, 'tons'));
    const rockTons = parseNumber(getValue(r2, 'tons'));
    // River rock (2800) is heavier than pea gravel (2700)
    expect(peaTons).toBeLessThan(rockTons);
  });

  it('returns different tonnage for crushed limestone vs decomposed granite', () => {
    const r1 = calculate({
      length: '20',
      width: '15',
      depth: '4',
      material: 'crushed-limestone',
    });
    const r2 = calculate({
      length: '20',
      width: '15',
      depth: '4',
      material: 'decomposed-granite',
    });
    const limeTons = parseNumber(getValue(r1, 'tons'));
    const granTons = parseNumber(getValue(r2, 'tons'));
    // Decomposed granite (2650) is heavier than crushed limestone (2600)
    expect(limeTons).toBeLessThan(granTons);
  });

  // ---------------------------------------------------------------------------
  // Different depths
  // ---------------------------------------------------------------------------

  it('doubles volume when depth doubles', () => {
    const r1 = calculate({
      length: '10',
      width: '10',
      depth: '2',
      material: 'pea-gravel',
    });
    const r2 = calculate({
      length: '10',
      width: '10',
      depth: '4',
      material: 'pea-gravel',
    });
    const v1 = parseNumber(getValue(r1, 'cubic-yards'));
    const v2 = parseNumber(getValue(r2, 'cubic-yards'));
    near(v2 / v1, 2, 0.02);
  });

  it('calculates with 12 inch depth', () => {
    const results = calculate({
      length: '10',
      width: '10',
      depth: '12',
      material: 'pea-gravel',
    });
    const cubicYards = parseNumber(getValue(results, 'cubic-yards'));
    // 10 × 10 × 12 / 324 ≈ 3.7037
    near(cubicYards, 3.7037);
  });

  // ---------------------------------------------------------------------------
  // Weed barrier fabric
  // ---------------------------------------------------------------------------

  it('calculates weed barrier fabric square footage', () => {
    const results = calculate({
      length: '12',
      width: '15',
      depth: '4',
      material: 'pea-gravel',
    });
    const fabric = parseNumber(getValue(results, 'weed-barrier'));
    near(fabric, 180);
  });

  it('weed barrier equals L × W regardless of depth', () => {
    const r1 = calculate({
      length: '20',
      width: '30',
      depth: '2',
      material: 'pea-gravel',
    });
    const r2 = calculate({
      length: '20',
      width: '30',
      depth: '12',
      material: 'pea-gravel',
    });
    expect(getValue(r1, 'weed-barrier')).toBe(getValue(r2, 'weed-barrier'));
  });

  // ---------------------------------------------------------------------------
  // Cost estimates
  // ---------------------------------------------------------------------------

  it('calculates cost estimate when price per yard is entered', () => {
    const results = calculate({
      length: '10',
      width: '10',
      depth: '4',
      material: 'pea-gravel',
      pricePerYard: '50',
    });
    const cost = parseNumber(getValue(results, 'cost-per-yard'));
    // 1.2346 × 50 ≈ 61.73
    near(cost, 61.73);
  });

  it('calculates cost estimate when price per ton is entered', () => {
    const results = calculate({
      length: '10',
      width: '10',
      depth: '4',
      material: 'pea-gravel',
      pricePerTon: '45',
    });
    const cost = parseNumber(getValue(results, 'cost-per-ton'));
    // 1.6667 × 45 ≈ 75.00
    near(cost, 75.0);
  });

  it('returns both cost-per-yard and cost-per-ton when both prices entered', () => {
    const results = calculate({
      length: '10',
      width: '10',
      depth: '4',
      material: 'pea-gravel',
      pricePerYard: '50',
      pricePerTon: '45',
    });
    const costYard = parseNumber(getValue(results, 'cost-per-yard'));
    const costTon = parseNumber(getValue(results, 'cost-per-ton'));
    expect(costYard).toBeDefined();
    expect(costTon).toBeDefined();
    near(costYard, 61.73);
    near(costTon, 75.0);
  });

  // ---------------------------------------------------------------------------
  // Edge cases — invalid inputs return empty array
  // ---------------------------------------------------------------------------

  it('returns [] when all fields are empty', () => {
    const results = calculate({});
    expect(results).toEqual([]);
  });

  it('returns [] when depth is missing', () => {
    const results = calculate({
      length: '10',
      width: '10',
      material: 'pea-gravel',
    });
    expect(results).toEqual([]);
  });

  it('returns [] when material is missing', () => {
    const results = calculate({
      length: '10',
      width: '10',
      depth: '4',
    });
    expect(results).toEqual([]);
  });

  it('returns [] when depth is zero', () => {
    const results = calculate({
      length: '10',
      width: '10',
      depth: '0',
      material: 'pea-gravel',
    });
    expect(results).toEqual([]);
  });

  it('returns [] for negative length', () => {
    const results = calculate({
      length: '-5',
      width: '10',
      depth: '4',
      material: 'pea-gravel',
    });
    expect(results).toEqual([]);
  });

  it('returns [] for negative width', () => {
    const results = calculate({
      length: '10',
      width: '-3',
      depth: '4',
      material: 'pea-gravel',
    });
    expect(results).toEqual([]);
  });

  it('returns [] when length is non-numeric', () => {
    const results = calculate({
      length: 'abc',
      width: '10',
      depth: '4',
      material: 'pea-gravel',
    });
    expect(results).toEqual([]);
  });

  it('returns [] when material is unknown', () => {
    const results = calculate({
      length: '10',
      width: '10',
      depth: '4',
      material: 'invalid-material',
    });
    expect(results).toEqual([]);
  });
});
