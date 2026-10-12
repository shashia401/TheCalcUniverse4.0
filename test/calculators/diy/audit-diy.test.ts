// End-to-end audit regression tests for the DIY batch (btu, concrete, concrete-slab, drywall, lumber,
// mulch, mulch-topsoil, paint-coverage, square-footage, tile, tile-flooring) including the twin-agreement
// checks. Expected values were derived by hand / closed form, not copied from the calculators' output.
import { describe, it, expect } from 'vitest';
import concrete from '../../../src/calculators/diy/concrete/index';
import slab from '../../../src/calculators/diy/concrete-slab/index';
import { concreteOrder } from '../../../src/calculators/diy/shared/concreteMath';
import mulch from '../../../src/calculators/diy/mulch/index';
import mulchTopsoil from '../../../src/calculators/diy/mulch-topsoil/index';
import mathMulch from '../../../src/calculators/math/mulch/index';
import { mulchVolume } from '../../../src/calculators/diy/shared/mulchMath';
import tile from '../../../src/calculators/diy/tile/index';
import tileFlooring from '../../../src/calculators/diy/tile-flooring/index';
import mathTile from '../../../src/calculators/math/tile/index';
import { tileEstimate } from '../../../src/calculators/diy/shared/tileMath';
import drywall from '../../../src/calculators/diy/drywall/index';
import lumber from '../../../src/calculators/diy/lumber/index';
import paint from '../../../src/calculators/diy/paint-coverage/index';
import btu from '../../../src/calculators/diy/btu/index';
import sqft from '../../../src/calculators/diy/square-footage/index';
import { getValue, parseNumber } from '../../helpers';

describe('twins: concrete vs concrete-slab agree on identical inputs', () => {
  it('10x10 ft, 4 in, default waste: both 1.36 cu yd, 62 eighty-lb bags, 82 sixty-lb bags', () => {
    // 10 x 10 x 4/12 = 33.333 cu ft; x1.10 = 36.667 cu ft = 1.358 cu yd; /0.6 = 61.1 -> 62; /0.45 = 81.5 -> 82
    const a = concrete.calculate({ shape: 'slab', length: '10', width: '10', depth: '4' });
    const b = slab.calculate({ length: '10', width: '10', depth: '4' });
    expect(getValue(a, 'cubicYards')).toBe('1.36 cu yd');
    expect(getValue(b, 'cubicYards')).toBe('1.36 cu yd');
    expect(parseNumber(getValue(a, 'bags80lb'))).toBe(62);
    expect(parseNumber(getValue(b, 'bags80')).toString()).toBe('62');
    expect(parseNumber(getValue(a, 'bags60lb'))).toBe(82);
    expect(parseNumber(getValue(b, 'bags60')).toString()).toBe('82');
  });
  it('an explicit 0% waste in the concrete calculator is still honored', () => {
    expect(getValue(concrete.calculate({ shape: 'slab', length: '10', width: '10', depth: '4', wastage: '0' }), 'cubicYards')).toBe('1.23 cu yd');
  });
  it('bag counts ignore float noise: exactly 45 eighty-lb bags per cubic yard', () => {
    expect(concreteOrder(27, 0).bags80).toBe(45);
    expect(concreteOrder(27, 0).bags60).toBe(60);
  });
  it('stairs are a solid stepped block: 10 x 3 x (7/12) x (10+1)/2 = 96.25 cu ft', () => {
    const r = concrete.calculate({ shape: 'stairs', stairsLength: '10', stairsWidth: '3', riserHeight: '7', numSteps: '10', wastage: '0' });
    expect(getValue(r, 'cubicFeet')).toBe('96.25 cu ft');
  });
  it('footing: 12 in diameter x 48 in deep = pi x 0.25 x 4 = 3.14 cu ft; +10% = 6 eighty-lb bags', () => {
    const r = concrete.calculate({ shape: 'hole', diameter: '1', depth: '48', wastage: '10' });
    expect(getValue(r, 'cubicFeet')).toBe('3.46 cu ft');
    expect(getValue(r, 'bags80lb')).toBe('6');
  });
});

describe('twins: mulch, mulch-topsoil and math/mulch agree on identical inputs', () => {
  // 10 x 10 ft bed at 2 in: 100 sq ft x 2/12 = 16.667 cu ft = 0.617 cu yd; +10% = 18.333 cu ft = 0.679 cu yd
  // 2 cu ft bags: ceil(9.17) = 10; 3 cu ft bags: ceil(6.11) = 7
  const m = mulch.calculate({ length: '10', width: '10', depth: '2', shape: 'rect' });
  const mt = mulchTopsoil.calculate({ material: 'mulch', length: '10', width: '10', depth: '2' });
  const mm = mathMulch.calculate({ length: '10', width: '10', depth: '2', shape: 'rect' });
  it('exact volume is 0.62 cu yd everywhere', () => {
    expect(getValue(m, 'cubicYards')).toBe('0.62 cu yd');
    expect(getValue(mt, 'cubicYards')).toBe('0.62 cu yd');
    expect(getValue(mm, 'cubicYards')).toBe('0.62 cu yd');
  });
  it('suggested order with the 10% buffer is 0.68 cu yd everywhere', () => {
    expect(getValue(m, 'orderCuYd')).toBe('0.68 cu yd');
    expect(getValue(mt, 'orderCuYd')).toBe('0.68 cu yd');
    expect(getValue(mm, 'orderCuYd')).toBe('0.68 cu yd');
  });
  it('bag count includes the buffer: 10 bags of 2 cu ft', () => {
    expect(getValue(m, 'bags2ft')).toBe('10 bags');
    expect(getValue(mt, 'bags')).toBe('10 bags');
    expect(getValue(mm, 'bags2ft')).toBe('10 bags');
    expect(getValue(m, 'bags3ft')).toBe('7 bags');
  });
  it('bulk order rounds the buffered volume up to the next half yard (0.68 -> 1 cu yd; 1.36 -> 1.5)', () => {
    expect(mulchVolume(100, 2).bulkYards).toBe(1);
    expect(mulchVolume(100, 4).bulkYards).toBe(1.5);
  });
  it('circle uses the length as diameter: 15 ft ring at 2 in = pi x 7.5^2 x 2/12 = 29.45 cu ft', () => {
    const r = mulch.calculate({ length: '15', width: '15', depth: '2', shape: 'circle' });
    expect(getValue(r, 'cubicFeet')).toBe('29.45 cu ft');
  });
});

describe('twins: tile, tile-flooring and math/tile agree on identical inputs', () => {
  // 12 x 10 ft room, 12 x 24 in tile, 1/8 in grout, 10% waste:
  // cell = 12.125 x 24.125 / 144 = 2.0314 sq ft -> ceil(120 / 2.0314) = 60; +10% = 66 tiles
  // carton 15.5 sq ft -> round(15.5 / 2) = 8 tiles -> ceil(66 / 8) = 9 boxes
  it('66 tiles and 9 boxes in all three', () => {
    const a = tile.calculate({ areaLength: '12', areaWidth: '10', tileLength: '12', tileWidth: '24', groutWidth: '0.125', layout: 'grid' });
    const b = tileFlooring.calculate({ roomLength: '12', roomWidth: '10', tileSize: '2', wastePercent: '10' });
    const c = mathTile.calculate({ areaLength: '12', areaWidth: '10', tileLength: '12', tileWidth: '24', groutWidth: '0.125', layout: 'grid' });
    expect(getValue(a, 'boxesNeeded')).toBe('9 boxes');
    expect(getValue(b, 'boxes')).toBe('9 boxes');
    expect(getValue(c, 'boxesNeeded')).toBe('9 boxes');
    expect(getValue(a, 'baseTiles')).toBe('60 tiles');
    expect(getValue(b, 'tiles')).toBe('66 tiles');
    expect(getValue(c, 'tilesNeeded')).toBe('66 tiles');
  });
  it('grout width is used (it was an ignored input): 3/8 in joints need fewer tiles than 1/16 in', () => {
    const t = (g: number) => tileEstimate({ roomLengthFt: 12, roomWidthFt: 10, tileLengthIn: 12, tileWidthIn: 12, groutIn: g, wastePct: 0 }).baseTiles;
    expect(t(0)).toBe(120);
    expect(t(0.375)).toBe(Math.ceil(120 / (12.375 ** 2 / 144))); // 12.375^2/144 = 1.0635 -> 113
    expect(t(0.375)).toBe(113);
  });
  it('a printed carton coverage overrides the 15.5 sq ft default: 20 sq ft cartons of 12x24 hold 10 tiles', () => {
    const e = tileEstimate({ roomLengthFt: 12, roomWidthFt: 10, tileLengthIn: 12, tileWidthIn: 24, groutIn: 0.125, wastePct: 10, sqFtPerBox: 20 });
    expect(e.tilesPerBox).toBe(10);
    expect(e.boxes).toBe(7); // ceil(66 / 10)
  });
});

describe('drywall', () => {
  it('4x12 sheets: 20x20x10 room with ceiling, 1 door, 2 windows -> 27 sheets, 1,296 screws, 11.5 gal, 2 rolls', () => {
    // walls 800 + ceiling 400 - 20 - 30 = 1,150 net; x1.1 = 1,265; /48 = 26.4 -> 27 sheets
    // screws 27 x 48 = 1,296 (1 per sq ft of board); compound 10 gal/1,000 sq ft = 11.5; tape 370 ft/1,000 = 425.5 ft -> 2 rolls
    const r = drywall.calculate({ length: '20', width: '20', height: '10', sheetSize: '48', ceiling: 'yes', doors: '1', windows: '2' });
    expect(getValue(r, 'sheets')).toBe('27 sheets');
    expect(getValue(r, 'screws')).toBe('1296 screws');
    expect(getValue(r, 'jointCompound')).toBe('11.5 gallons');
    expect(getValue(r, 'tape')).toContain('2 rolls');
  });
  it('openings that remove all the area return nothing (previously a negative sheet count)', () => {
    expect(drywall.calculate({ length: '4', width: '4', height: '8', sheetSize: '32', ceiling: 'no', doors: '20', windows: '20' })).toEqual([]);
  });
});

describe('lumber', () => {
  it('2x8x16 x 8 boards = 21.33 bd ft each, 170.67 total; actual 1.5 x 7.25', () => {
    const r = lumber.calculate({ thickness: '2', width: '8', length: '16', quantity: '8', pricePerBdFt: '1.85' });
    expect(getValue(r, 'totalBdFt')).toBe('170.67 bd ft');
    expect(getValue(r, 'actualDimensions')).toBe('1.5" x 7.3"'); // 7.25 shown to one decimal
    expect(getValue(r, 'totalCost')).toBe('$315.73');
    expect(getValue(r, 'actualBdFt')).toBe('116.00 bd ft'); // 1.5 x 7.25 x 16 / 12 = 14.5 each x 8
  });
  it('a nominal size with no physical actual size returns nothing instead of negative board feet', () => {
    expect(lumber.calculate({ thickness: '0.2', width: '4', length: '8', quantity: '1' })).toEqual([]);
  });
});

describe('paint-coverage', () => {
  it('worked example: 14x12x9, 2 doors, 3 windows, 2 coats -> 381 sq ft, 2.4 gal, buy 3', () => {
    // walls 468 - 42 - 45 = 381; 381 x 2 / 350 = 2.177 gal; +10% = 2.39
    const r = paint.calculate({ roomLength: '14', roomWidth: '12', ceilingHeight: '9', doors: '2', windows: '3', coats: '2' });
    expect(getValue(r, 'paintableArea')).toBe('381.0 sq ft');
    expect(getValue(r, 'gallons')).toBe('2.4 gallons');
    expect(getValue(r, 'containers')).toBe('3 gallon(s)');
  });
  it('openings larger than the walls return nothing', () => {
    expect(paint.calculate({ roomLength: '4', roomWidth: '4', ceilingHeight: '8', doors: '10', windows: '10', coats: '2' })).toEqual([]);
  });
});

describe('btu', () => {
  const base = { area: '400', climateZone: '1', sunExposure: 'moderate', insulation: 'average', ceilingHeight: '8', roomType: 'standard', people: '1', purpose: 'cooling' };
  it('20 BTU/sq ft anchor: zone 3, 400 sq ft = 8,000 BTU/h', () => {
    expect(getValue(btu.calculate({ ...base, climateZone: '3' }), 'btuRequired')).toBe('8,000 BTU/h');
  });
  it('heating no longer shrinks as the climate gets colder (zone 4 > zone 1)', () => {
    const h = (z: string) => parseNumber(getValue(btu.calculate({ ...base, climateZone: z, purpose: 'heating' }), 'btuRequired'));
    expect(h('4')).toBeGreaterThan(h('1'));
  });
  it('kitchen +4,000 BTU/h and each occupant beyond two +600 BTU/h (ENERGY STAR guidance)', () => {
    expect(getValue(btu.calculate({ ...base, climateZone: '3', roomType: 'kitchen', people: '4' }), 'btuRequired')).toBe('13,200 BTU/h'); // 8,000 + 4,000 + 1,200
  });
});

describe('square-footage', () => {
  it('meters: 10 x 5 m = 50 m2 = 538.2 ft2 (10.7639 ft2 per m2)', () => {
    const r = sqft.calculate({ shape: 'rectangle', length: '10', width: '5', unit: 'm', wastage: '0' });
    expect(getValue(r, 'sqm')).toBe('50 m²');
    expect(parseNumber(getValue(r, 'sqft'))).toBeCloseTo(538.2, 1);
  });
  it('L-shape worked example: 16x12 + 10x8 = 272 ft2, +10% = 299.2, $6.50/ft2 = $1,944.80', () => {
    const r = sqft.calculate({ shape: 'lshape', length: '16', width: '12', lLength2: '10', lWidth2: '8', unit: 'ft', wastage: '10', pricePerSqFt: '6.50' });
    expect(getValue(r, 'sqft')).toBe('272 ft²');
    expect(getValue(r, 'withWaste')).toBe('299.2 ft²');
    expect(getValue(r, 'totalCost')).toBe('$1944.80');
  });
});
