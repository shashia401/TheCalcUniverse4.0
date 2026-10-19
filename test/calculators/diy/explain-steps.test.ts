import { describe, it, expect } from 'vitest';
import type { CalculatorConfig, ExplainStep } from '../../../src/types/calculator';
import { rangeErrors, seedDefaults } from '../../../src/lib/initialForm';
import btu from '../../../src/calculators/diy/btu';
import tile from '../../../src/calculators/diy/tile';
import tileFlooring from '../../../src/calculators/diy/tile-flooring';
import mulch from '../../../src/calculators/diy/mulch';
import topsoil from '../../../src/calculators/diy/mulch-topsoil';
import concrete from '../../../src/calculators/diy/concrete';
import lumber from '../../../src/calculators/diy/lumber';
import sqft from '../../../src/calculators/diy/square-footage';

// Oracle: every pinned number below was computed independently in Python's decimal module (50-digit precision,
// ROUND_HALF_UP, `python -I`), not by running the calculators.

type V = Record<string, string>;
const steps = (c: CalculatorConfig, v: V): ExplainStep[] => c.explainSteps!(v);
const strip = (s: string) => s.replace(/(\d),(?=\d{3})/g, '$1');
const exprs = (c: CalculatorConfig, v: V) => steps(c, v).map((s) => strip(s.expr));

/** One array of required substrings per step; the step count must match exactly. */
function expectSteps(c: CalculatorConfig, v: V, expected: string[][]) {
  const out = exprs(c, v);
  expect(out).toHaveLength(expected.length);
  expected.forEach((subs, i) => {
    for (const s of subs) expect(out[i], `step ${i + 1}`).toContain(s);
  });
  for (const s of steps(c, v)) {
    expect(s.label.length).toBeGreaterThan(0);
    expect(`${s.label} ${s.expr} ${s.note ?? ''}`).not.toMatch(/NaN|Infinity|undefined/);
  }
}

const ALL: [string, CalculatorConfig][] = [['btu', btu], ['tile', tile], ['tile-flooring', tileFlooring], ['mulch', mulch], ['mulch-topsoil', topsoil], ['concrete', concrete], ['lumber', lumber], ['square-footage', sqft]];

describe('diy explainSteps - default values give a worked solution', () => {
  for (const [name, config] of ALL) {
    it(name, () => {
      const v = seedDefaults(config.inputs);
      if (config.calculate(v).length === 0) return;
      const s = steps(config, v);
      expect(s.length).toBeGreaterThanOrEqual(1);
      expect(s.length).toBeLessThanOrEqual(8);
    });
  }
});

describe('diy explainSteps - blank, invalid and runaway input never print NaN/Infinity', () => {
  for (const [name, config] of ALL) {
    it(`${name}: empty values -> []`, () => {
      const blank = Object.fromEntries(config.inputs.map((i) => [i.id, '']));
      expect(steps(config, blank)).toEqual([]);
    });
    it(`${name}: junk in every number field is either clean or empty`, () => {
      for (const junk of ['abc', '-1', '0', '1e999', '1e308']) {
        const v = seedDefaults(config.inputs);
        for (const i of config.inputs) if (i.type === 'number') v[i.id] = junk;
        if (Object.keys(rangeErrors(config.inputs, v)).length) continue;
        const s = steps(config, v);
        if (config.calculate(v).length === 0) expect(s, `junk ${junk}`).toEqual([]);
        for (const st of s) expect(`${st.label} ${st.expr} ${st.note ?? ''}`, `junk ${junk}`).not.toMatch(/NaN|Infinity|undefined/);
      }
    });
    it(`${name}: one runaway field at a time stays clean`, () => {
      for (const i of config.inputs) {
        if (i.type !== 'number') continue;
        for (const junk of ['1e999', '1e308', '-1e308']) {
          const v = seedDefaults(config.inputs);
          v[i.id] = junk;
          if (Object.keys(rangeErrors(config.inputs, v)).length) continue;
          for (const st of steps(config, v)) expect(`${st.label} ${st.expr} ${st.note ?? ''}`, `${i.id}=${junk}`).not.toMatch(/NaN|Infinity|undefined/);
        }
      }
    });
  }
});

describe('btu explainSteps', () => {
  const kitchen = { area: '300', climateZone: '3', sunExposure: 'moderate', insulation: 'average', ceilingHeight: '8', roomType: 'kitchen', people: '4', purpose: 'cooling' };
  it('cooling a kitchen with four people', () => {
    expectSteps(btu, kitchen, [
      ['300 sq ft × 20 BTU/h per sq ft = 6000 BTU/h'],
      ['6000 × ceiling 1 × sun 1 × insulation 1 = 6000 BTU/h'],
      ['6000 + 4000 kitchen + 2 extra people × 600 = 11200 BTU/h'],
      ['11200 ÷ 12000 = 0.9 ton, so 1.0 ton (12000 BTU/h)'],
    ]);
  });
  it('heating ignores sun, room and people', () => {
    expectSteps(btu, { area: '250', climateZone: '4', sunExposure: 'high', insulation: 'poor', ceilingHeight: '12', roomType: 'kitchen', people: '6', purpose: 'heating' }, [
      ['250 sq ft × 50 BTU/h per sq ft = 12500 BTU/h'],
      ['12500 × ceiling 1.5 × insulation 1.2 = 22500 BTU/h'],
      ['22500 ÷ 12000 = 1.9 ton, so 2.0 ton (24000 BTU/h)'],
    ]);
  });
  it('a basement in a hot zone with a sunny, well-insulated room', () => {
    expectSteps(btu, { area: '400', climateZone: '1', sunExposure: 'high', insulation: 'good', ceilingHeight: '9', roomType: 'basement', people: '2', purpose: 'cooling' }, [
      ['400 sq ft × 30 BTU/h per sq ft = 12000 BTU/h'],
      ['12000 × ceiling 1.2 × sun 1.1 × insulation 0.9 × room 0.85 = 12118 BTU/h'],
      ['12118 + 0 (two people or fewer, no kitchen) = 12118 BTU/h'],
      ['12118 ÷ 12000 = 1.0 ton, so 1.5 ton (18000 BTU/h)'],
    ]);
  });
  it('the last step matches the displayed recommendation', () => {
    expect(btu.calculate(kitchen).find((r) => r.id === 'recommendedAC')!.value).toBe('1.0 ton (12,000 BTU/h)');
  });
});

describe('tile explainSteps', () => {
  it('12x10 room, 12x12 tile, 1/8 inch grout, grid layout, priced', () => {
    expectSteps(tile, { areaLength: '12', areaWidth: '10', tileLength: '12', tileWidth: '12', groutWidth: '0.125', layout: 'grid', pricePerTile: '2.5' }, [
      ['12 ft × 10 ft = 120.0 sq ft'],
      ['(12" + 0.125") × (12" + 0.125") ÷ 144 = 1.0209 sq ft'],
      ['120.0 ÷ 1.0209 = 118 tiles (rounded up)'],
      ['118 × (1 + 10%) = 130 tiles (12 extra)'],
      ['130 ÷ 16 tiles per box = 9 boxes (rounded up)'],
      ['130 × $2.5 = $325.00'],
    ]);
  });
  it('diagonal layout uses 15% waste; a waste override wins', () => {
    const v = { areaLength: '14', areaWidth: '11', tileLength: '12', tileWidth: '24', groutWidth: '0.25', layout: 'diagonal', sqFtPerBox: '16', pricePerTile: '' };
    expectSteps(tile, v, [
      ['14 ft × 11 ft = 154.0 sq ft'],
      ['(12" + 0.25") × (24" + 0.25") ÷ 144 = 2.0629 sq ft'],
      ['154.0 ÷ 2.0629 = 75 tiles'],
      ['75 × (1 + 15%) = 87 tiles (12 extra)'],
      ['87 ÷ 8 tiles per box = 11 boxes'],
    ]);
    expect(exprs(tile, { ...v, wasteOverride: '0' })[3]).toContain('75 × (1 + 0%) = 75 tiles (0 extra)');
  });
  it('the tile count matches the displayed total', () => {
    const v = { areaLength: '12', areaWidth: '10', tileLength: '12', tileWidth: '12', groutWidth: '0.125', layout: 'grid' };
    expect(tile.calculate(v).find((r) => r.id === 'tilesNeeded')!.value).toBe('130 tiles (9 boxes)');
  });
});

describe('tile-flooring explainSteps', () => {
  it('12x10 room with 12x24 tiles and 15% waste', () => {
    expectSteps(tileFlooring, { roomLength: '12', roomWidth: '10', tileSize: '2', wastePercent: '15', groutWidth: '0.125', pricePerSqFt: '3.2' }, [
      ['12 ft × 10 ft = 120.0 sq ft'],
      ['120.0 × (1 + 15%) = 138.0 sq ft'],
      ['(12" + 0.125") × (24" + 0.125") ÷ 144 = 2.0314 sq ft'],
      ['120.0 ÷ 2.0314 = 60 tiles; × (1 + 15%) = 69 tiles'],
      ['69 ÷ 8 tiles per box = 9 boxes'],
      ['138.0 sq ft × $3.2 = $441.60'],
    ]);
  });
  it('without a price there is no cost step', () => {
    expect(steps(tileFlooring, { roomLength: '12', roomWidth: '10', tileSize: '2', wastePercent: '15' })).toHaveLength(5);
  });
});

describe('mulch explainSteps', () => {
  it('rectangle, 3 inches deep', () => {
    expectSteps(mulch, { length: '20', width: '10', depth: '3', shape: 'rect' }, [
      ['20 ft × 10 ft = 200 sq ft'],
      ['200 sq ft × (3 in ÷ 12) = 50 cu ft'],
      ['50 ÷ 27 = 1.85 cu yd'],
      ['50 × 1.1 = 55 cu ft = 2.04 cu yd'],
      ['55 ÷ 2 = 28 bags of 2 cu ft, or ÷ 3 = 19 bags of 3 cu ft, or 2.5 cu yd in bulk'],
    ]);
  });
  it('circle uses the first dimension as the diameter', () => {
    expectSteps(mulch, { length: '10', width: '10', depth: '2', shape: 'circle' }, [
      ['π × (10 ft ÷ 2)² = 78.5 sq ft'],
      ['78.5 sq ft × (2 in ÷ 12) = 13.09 cu ft'],
      ['13.09 ÷ 27 = 0.48 cu yd'],
      ['13.09 × 1.1 = 14.4 cu ft = 0.53 cu yd'],
      ['14.4 ÷ 2 = 8 bags of 2 cu ft, or ÷ 3 = 5 bags of 3 cu ft, or 1 cu yd in bulk'],
    ]);
  });
});

describe('mulch-topsoil explainSteps', () => {
  it('20x10 bed, 4 inches deep', () => {
    expectSteps(topsoil, { material: 'topsoil', length: '20', width: '10', depth: '4' }, [
      ['20 ft × 10 ft = 200 sq ft'],
      ['200 sq ft × (4 in ÷ 12) = 66.7 cu ft'],
      ['66.7 ÷ 27 = 2.47 cu yd'],
      ['2.47 × 1.1 = 2.72 cu yd (73.3 cu ft)'],
      ['73.3 ÷ 2 = 37 bags'],
    ]);
  });
});

describe('concrete explainSteps', () => {
  it('slab, 10% waste', () => {
    expectSteps(concrete, { shape: 'slab', length: '10', width: '10', depth: '4', wastage: '10' }, [
      ['10 ft × 10 ft × (4 in ÷ 12) = 33.33 cu ft'],
      ['33.33 × (1 + 10%) = 36.67 cu ft'],
      ['36.67 ÷ 27 = 1.36 cu yd'],
      ['36.67 ÷ 0.6 = 62 bags (80 lb); 36.67 ÷ 0.45 = 82 bags (60 lb)'],
    ]);
  });
  it('round footing, 5% waste', () => {
    expectSteps(concrete, { shape: 'hole', diameter: '2', depth: '36', wastage: '5' }, [
      ['π × (2 ft ÷ 2)² × (36 in ÷ 12) = 9.42 cu ft'],
      ['9.42 × (1 + 5%) = 9.90 cu ft'],
      ['9.90 ÷ 27 = 0.37 cu yd'],
      ['9.90 ÷ 0.6 = 17 bags (80 lb); 9.90 ÷ 0.45 = 22 bags (60 lb)'],
    ]);
  });
  it('solid stairs, no waste', () => {
    expectSteps(concrete, { shape: 'stairs', stairsLength: '4', stairsWidth: '3', riserHeight: '7', numSteps: '4', wastage: '0' }, [
      ['4 ft × 3 ft × (7 in ÷ 12) × (4 + 1) ÷ 2 = 17.50 cu ft'],
      ['17.50 × (1 + 0%) = 17.50 cu ft'],
      ['17.50 ÷ 27 = 0.65 cu yd'],
      ['17.50 ÷ 0.6 = 30 bags (80 lb); 17.50 ÷ 0.45 = 39 bags (60 lb)'],
    ]);
  });
  it('the cubic yards match the displayed result for every shape', () => {
    const slab = { shape: 'slab', length: '10', width: '10', depth: '4', wastage: '10' };
    expect(concrete.calculate(slab).find((r) => r.id === 'cubicYards')!.value).toBe('1.36 cu yd');
    const stairs = { shape: 'stairs', stairsLength: '4', stairsWidth: '3', riserHeight: '7', numSteps: '4', wastage: '0' };
    expect(concrete.calculate(stairs).find((r) => r.id === 'cubicYards')!.value).toBe('0.65 cu yd');
  });
  it('a shape with missing dimensions is empty', () => {
    expect(steps(concrete, { shape: 'stairs', stairsLength: '4' })).toEqual([]);
    expect(steps(concrete, { shape: 'hole', diameter: '', depth: '36' })).toEqual([]);
  });
});

describe('lumber explainSteps', () => {
  it('ten 2x4x8 boards at a price per board foot', () => {
    expectSteps(lumber, { thickness: '2', width: '4', length: '8', quantity: '10', pricePerBdFt: '3.5' }, [
      ['2" × 4" × 8 ft ÷ 12 = 5.33 bd ft'],
      ['5.33 × 10 boards = 53.33 bd ft'],
      ['2" × 4" nominal is about 1.5" × 3.5" actual', '1.50 × 3.50 × 8 ÷ 12 × 10 = 35.00 bd ft'],
      ['53.33 bd ft × $3.5 = $186.67'],
    ]);
  });
  it('without a price there is no cost step', () => {
    expect(steps(lumber, { thickness: '2', width: '4', length: '8', quantity: '10' })).toHaveLength(3);
  });
});

describe('square-footage explainSteps', () => {
  it('rectangle in feet with wastage and a price', () => {
    expectSteps(sqft, { shape: 'rectangle', length: '12', width: '15', unit: 'ft', wastage: '10', pricePerSqFt: '3' }, [
      ['12 × 15 ft = 180 ft²'],
      ['180 ft² ÷ 10.763910417 = 16.7225 m²'],
      ['180 ft² × (1 + 10%) = 198 ft²'],
      ['198 ft² × $3 = $594.00'],
    ]);
  });
  it('circle from the radius', () => {
    expectSteps(sqft, { shape: 'circle', radius: '5', unit: 'ft', wastage: '0' }, [
      ['π × 5² = 78.5398 ft²'], ['78.5398 ft² ÷ 10.763910417 = 7.2966 m²'],
    ]);
  });
  it('L-shape is two rectangles', () => {
    expect(exprs(sqft, { shape: 'lshape', length: '10', width: '8', lLength2: '4', lWidth2: '5', unit: 'ft', wastage: '0' })[0]).toBe('(10 × 8) + (4 × 5) = 100 ft²');
  });
  it('metres convert to square feet', () => {
    expectSteps(sqft, { shape: 'rectangle', length: '4', width: '5', unit: 'm', wastage: '5' }, [
      ['4 × 5 m = 20 m²'], ['20 m² × 10.763910417 = 215.2782 ft²'], ['215.2782 ft² × (1 + 5%) = 226.0421 ft²'],
    ]);
  });
});
