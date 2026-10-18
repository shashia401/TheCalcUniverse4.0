import { describe, it, expect } from 'vitest';
import braSize from '../../../src/calculators/math/bra-size';
import shoeSize from '../../../src/calculators/math/shoe-size';
import gdp from '../../../src/calculators/math/gdp';
import love from '../../../src/calculators/math/love-calculator';

// Expected values worked out by hand / in Python from each calculator's documented rule.
type R = { id: string; value: string }[];
const val = (r: R, id: string) => r.find((x) => x.id === id)?.value;

describe('bra-size audit', () => {
  const run = (o: Record<string, string>) => braSize.calculate({ unit: 'in', underbustSnug: '30', bustStanding: '35', ...o }) as R;

  it('30 in underbust, 35 in bust = 30DD, sisters 28DDD and 32D', () => {
    const r = run({});
    expect(val(r, 'bandSize')).toBe('30');
    expect(val(r, 'cupSize')).toBe('DD');
    expect(val(r, 'size')).toBe('30DD');
    const sisters = JSON.parse(val(r, 'sisterSizes')!);
    expect(sisters.sisterDown.size).toBe('28DDD');
    expect(sisters.sisterUp.size).toBe('32D');
  });

  it('the band is the nearest even number with no jump at 24 inches (24.4 used to give 26, 23.9 gave 24)', () => {
    expect(val(run({ underbustSnug: '24.4', bustStanding: '27' }), 'bandSize')).toBe('24');
    expect(val(run({ underbustSnug: '23', bustStanding: '27' }), 'bandSize')).toBe('24');
    expect(val(run({ underbustSnug: '25', bustStanding: '28' }), 'bandSize')).toBe('26');
    expect(val(run({ underbustSnug: '33.9', bustStanding: '38' }), 'bandSize')).toBe('34');
  });

  it('centimetres give the same answer as the equivalent inches, and values above 60 are accepted', () => {
    expect(val(run({ unit: 'cm', underbustSnug: '76.2', bustStanding: '88.9' }), 'size')).toBe('30DD');
    expect(val(run({ unit: 'cm', underbustSnug: '80', bustStanding: '95' }), 'size')).toBe('32DDD');
  });

  it('averages the optional bust positions', () => {
    const r = run({ bustStanding: '35', bustLeaning: '36', bustLying: '34' });
    expect(JSON.parse(val(r, 'measurements')!).bustAverage).toBe(35);
  });

  it('out-of-range measurements and junk are rejected', () => {
    expect(run({ underbustSnug: '15' }).map((x) => x.id)).toEqual(['error']);
    expect(run({ bustStanding: '90' }).map((x) => x.id)).toEqual(['error']);
    expect(run({ unit: 'cm', underbustSnug: '30' }).map((x) => x.id)).toEqual(['error']); // 30 cm is not a ribcage
    expect(run({ underbustSnug: '30in' })).toEqual([]);
    expect(run({ bustLeaning: '12abc' })).toEqual([]);
  });
});

describe('shoe-size audit', () => {
  const run = (o: Record<string, string>) => shoeSize.calculate({ size: '9', fromRegion: 'us_m', gender: 'M', ...o }) as R;

  it('the women\'s chart is labelled women\'s even when Gender is left on Men', () => {
    expect(val(run({ fromRegion: 'us_w' }), 'genderLabel')).toBe("Women's Sizing");
    expect(val(run({ fromRegion: 'us_m' }), 'genderLabel')).toBe("Men's Sizing");
  });

  it('sizes far outside the chart give a message instead of an invented conversion', () => {
    expect(run({ size: '40' }).map((x) => x.id)).toEqual(['error']);
    expect(run({ size: '3' }).map((x) => x.id)).toEqual(['error']);
    expect(run({ fromRegion: 'eu', size: '60' }).map((x) => x.id)).toEqual(['error']);
    expect(val(run({ size: '5.5' }), 'usSize')).toBeDefined(); // a little below the chart is still extrapolated
  });

  it('junk is rejected', () => {
    expect(run({ size: '9us' })).toEqual([]);
    expect(run({ size: '-9' })).toEqual([]);
    expect(run({ size: 'Infinity' })).toEqual([]);
  });
});

describe('gdp audit', () => {
  const T = 1e12;
  const run = (o: Record<string, string> = {}) =>
    gdp.calculate({
      mode: 'nominal',
      consumption: String(18.6 * T),
      investment: String(4.8 * T),
      governmentSpending: String(4.7 * T),
      exports: String(3.1 * T),
      imports: String(3.8 * T),
      ...o,
    }) as R;

  it('the worked example: C 18.6 + I 4.8 + G 4.7 + (X 3.1 - M 3.8) = 27.4 trillion', () => {
    const r = run();
    expect(val(r, 'gdp')).toBe('$27.40 trillion');
    expect(val(r, 'netExports')).toBe('-$700.00 billion');
    expect(val(r, 'consumptionShare')).toBe('67.9%');
    expect(val(r, 'investmentShare')).toBe('17.5%');
    expect(val(r, 'governmentShare')).toBe('17.2%');
    expect(val(r, 'netExportShare')).toBe('-2.6%');
  });

  it('real GDP divides by the deflator: 27.4 / 1.234 = 22.20 trillion', () => {
    expect(val(run({ mode: 'real', gdpDeflator: '123.4' }), 'gdp')).toBe('$22.20 trillion');
  });

  it('small sums are exact (0.1 + 0.2 is 0.3, not 0.30000000000000004)', () => {
    const r = run({ consumption: '0.1', investment: '0.2', governmentSpending: '0', exports: '0', imports: '0' });
    expect(val(r, '_gdpNumeric')).toBe('0.3');
    expect(val(r, 'gdp')).toBe('$0.30');
  });

  it('rejects junk, negatives and a missing deflator', () => {
    expect(run({ consumption: '18.6T' })).toEqual([]);
    expect(run({ imports: '-5' })).toEqual([]);
    expect(run({ mode: 'real', gdpDeflator: '0' })).toEqual([]);
    expect(run({ mode: 'real', gdpDeflator: '' })).toEqual([]);
  });
});

describe('love-calculator audit (entertainment - the documented rule)', () => {
  const run = (name1: string, name2: string) => love.calculate({ name1, name2 }) as R;

  it('reproduces the worked examples: Priya+Marcus 10%, Sean+Aoife 20%, Oliver+Olivia 36%', () => {
    expect(val(run('Priya', 'Marcus'), 'loveScore')).toBe('10%');
    expect(val(run('Sean', 'Aoife'), 'loveScore')).toBe('20%');
    expect(val(run('Oliver', 'Olivia'), 'loveScore')).toBe('36%');
  });

  it('is deterministic, order-independent and case-insensitive', () => {
    expect(val(run('emma', 'NOAH'), 'loveScore')).toBe(val(run('Noah', 'Emma'), 'loveScore'));
    const s = Number(val(run('Emma', 'Noah'), 'loveScore')!.replace('%', ''));
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(100);
  });

  it('needs both names', () => {
    expect(run('', 'Noah')).toEqual([]);
    expect(run('Emma', '   ')).toEqual([]);
  });
});
