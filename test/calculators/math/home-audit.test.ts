import { describe, it, expect } from 'vitest';
import gravel from '../../../src/calculators/math/gravel';
import roofing from '../../../src/calculators/math/roofing';
import stair from '../../../src/calculators/math/stair';
import sleep from '../../../src/calculators/math/sleep';

// Expected values recomputed independently in Python / worked out by hand.
type R = { id: string; value: string }[];
const val = (r: R, id: string) => r.find((x) => x.id === id)?.value;

describe('gravel audit', () => {
  const run = (o: Record<string, string>) =>
    gravel.calculate({ length: '20', width: '10', depth: '4', material: 'crushed-limestone', ...o }) as R;

  it('10 x 20 ft driveway, 4 in of crushed limestone (the worked example)', () => {
    const r = run({});
    expect(val(r, 'cubic-yards')).toBe('2.47 cubic yards');
    expect(val(r, 'tons')).toBe('3.21 tons');
    expect(val(r, 'weed-barrier')).toBe('200 sq ft');
  });

  it('costs are exact decimals with thousands separators', () => {
    const r = run({ pricePerYard: '40', pricePerTon: '55' });
    expect(val(r, 'cost-per-yard')).toBe('$98.77'); // 2.469136 x 40 = 98.7654
    expect(val(r, 'cost-per-ton')).toBe('$176.54');
    expect(val(run({ length: '1000', width: '1000', depth: '12', pricePerYard: '40' }), 'cost-per-yard')).toBe('$1,481,481.48');
  });

  it('rejects junk', () => {
    for (const bad of [{ length: '20ft' }, { width: '-3' }, { length: '0' }, { depth: 'deep' }, { length: 'Infinity' }]) {
      expect(run(bad)).toEqual([]);
    }
  });
});

describe('roofing audit', () => {
  const run = (o: Record<string, string>) =>
    roofing.calculate({ length: '40', width: '30', pitch: '6', overhang: '1', roofType: 'gable', wasteFactor: '10', ...o }) as R;
  const materials = (r: R) => JSON.parse(val(r, '_materialsList')!);

  it('40 x 30 ft, 6/12, 1 ft overhang, 10% waste (the worked example)', () => {
    const r = run({});
    expect(val(r, 'footprintArea')).toBe('1344 sq ft');
    expect(val(r, 'surfaceArea')).toBe('1502.6 sq ft');
    expect(val(r, 'roofArea')).toBe('1652.9 sq ft');
    expect(val(r, 'squares')).toBe('17 squares');
    expect(val(r, 'bundles')).toBe('51 bundles');
  });

  it('a hip roof orders 5% more material', () => {
    const r = run({ roofType: 'hip' });
    expect(val(r, 'roofArea')).toBe('1728 sq ft'); // 1502.592 x 1.15
    expect(val(r, 'squares')).toBe('18 squares');
  });

  it('ridge cap run: gable = ridge length; hip = short ridge + four hips (it used the full length)', () => {
    expect(materials(run({})).ridgeLength).toBe('42');
    // 42 x 32 ft: ridge 10 ft, rise 8 ft, each hip sqrt(16^2 + 16^2 + 8^2) = 24 ft -> 10 + 96
    expect(materials(run({ roofType: 'hip' })).ridgeLength).toBe('106');
  });

  it('optional price per square gives a cost line (there used to be none to enter)', () => {
    expect(val(run({ pricePerSquare: '120' }), 'estimatedCost')).toBe('$2,040.00');
    expect(val(run({}), 'estimatedCost')).toBeUndefined();
  });

  it('rejects junk and negative overhang', () => {
    for (const bad of [{ length: '40ft' }, { overhang: 'a lot' }, { overhang: '-2' }, { width: '0' }, { wasteFactor: 'x' }]) {
      expect(run(bad)).toEqual([]);
    }
  });
});

describe('stair audit', () => {
  const run = (o: Record<string, string>) =>
    stair.calculate({ totalRise: '105', targetRiserHeight: '7', treadDepth: '11', unitSystem: 'in', ...o }) as R;

  it('105 in rise, 7 in riser, 11 in tread (the worked example)', () => {
    const r = run({});
    expect(val(r, 'numberOfSteps')).toBe('15 steps');
    expect(val(r, 'riserHeight')).toBe('7.00"');
    expect(val(r, 'totalRun')).toBe('154.00"');
    expect(val(r, 'stringerLength')).toBe('186.39"');
    expect(val(r, 'stringerAngle')).toBe('34.3°');
    expect(val(run({ unitSystem: 'ft' }), 'totalRun')).toBe('12\' 10.00"');
    expect(val(run({ unitSystem: 'ft' }), 'stringerLength')).toBe('15\' 6.39"');
  });

  it('feet and inches never print 12.00 inches', () => {
    // one 23.996 in tread: the old formatter gave 1' 12.00"
    expect(val(run({ totalRise: '14', treadDepth: '23.996', unitSystem: 'ft' }), 'totalRun')).toBe('2\' 0.00"');
  });

  it('a rise that divides exactly does not get an extra riser from float error', () => {
    expect(val(run({ totalRise: '7.7', targetRiserHeight: '1.1' }), 'numberOfSteps')).toBe('7 steps');
  });

  it('code check separates residential (IRC 7.75" / 10") from commercial (IBC 7" / 11")', () => {
    expect(val(run({}), 'ibcStatus')).toContain('Passes IRC (residential) and IBC (commercial)');
    // 7.5 in riser, 10.5 in tread: fine for a house, too steep for commercial
    const house = val(run({ targetRiserHeight: '7.5', treadDepth: '10.5' }), 'ibcStatus')!;
    expect(house).toContain('Passes IRC');
    expect(house).toContain('Does not meet IBC');
    expect(val(run({ totalRise: '110', targetRiserHeight: '8.5' }), 'ibcStatus')).toContain('Does not meet');
    expect(val(run({ treadDepth: '9' }), 'ibcStatus')).toContain('Does not meet');
  });

  it('comfort rule 2 x riser + tread', () => {
    expect(val(run({}), 'comfortRule')).toBe('25.0" (24-25" feels natural)');
  });

  it('rejects junk', () => {
    expect(run({ totalRise: '105in' })).toEqual([]);
    expect(run({ totalRise: '-5' })).toEqual([]);
    expect(run({ treadDepth: '0' })).toEqual([]);
  });
});

describe('sleep audit', () => {
  const wake = (wakeupTime: string) => sleep.calculate({ mode: 'wake', wakeupTime }) as R;
  const bed = (bedtime: string) => sleep.calculate({ mode: 'sleep', bedtime }) as R;
  const options = (r: R) => JSON.parse(val(r, 'options')!) as { time: string; cycles: number; hours: number }[];

  it('wake at 6:30 AM: 6 cycles -> 9:16 PM, 5 -> 10:46 PM, 4 -> 12:16 AM (the worked example)', () => {
    const r = wake('6:30 AM');
    expect(options(r).map((o) => [o.cycles, o.time])).toEqual([
      [6, '9:16 PM'],
      [5, '10:46 PM'],
      [4, '12:16 AM'],
      [3, '1:46 AM'],
    ]);
    expect(val(r, 'recommendedBedtime')).toBe('10:46 PM');
  });

  it('go to bed at 11:00 PM: 5 cycles + 14 min -> 6:44 AM', () => {
    expect(val(bed('11:00 PM'), 'recommendedWakeup')).toBe('6:44 AM');
  });

  it('accepts "6 AM", "6am", 24-hour times; rejects nonsense', () => {
    expect(val(wake('6 AM'), 'recommendedBedtime')).toBe('10:16 PM');
    expect(val(wake('6am'), 'recommendedBedtime')).toBe('10:16 PM');
    expect(val(wake('06:00'), 'recommendedBedtime')).toBe('10:16 PM');
    expect(wake('25:00')).toEqual([]);
    expect(wake('six thirty')).toEqual([]);
    expect(wake('13:00 PM')).toEqual([]);
  });
});
