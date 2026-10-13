import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/industrial/hardness-converter/index';
import { E140_ROWS, fromHV, scaleRange, toHV } from '../../../src/calculators/industrial/hardness-converter/hardnessTable';

// Reference values: ASTM E140-12b Table 1 (non-austenitic steels) as printed at engineersedge.com/hardness_conversion.htm
// (Table B). Rows used here: HRC 40 = HV 392 = HBW 371 = HRA 70.4 = HS 54; HRC 45 = HV 446 / HBW 421;
// HRC 50 = HV 513 / HBW 475; HRC 60 = HV 697 / HBW 654 / HRA 81.2 / HS 81; HRC 68 = HV 940; HRB 100 = HRC 23 = HV 254 / HBW 240.

const eq = (r: { id: string; value: string }[], id: string) => r.find((x) => x.id === id)?.value;
const run = (fromValue: string, fromUnit: string) => config.calculate({ fromValue, fromUnit });

describe('Hardness converter (ASTM E140-12b Table 1)', () => {
  it('HRC 40 reproduces the printed row', () => {
    const r = run('40', 'hrc');
    expect(eq(r, 'eq_hv')).toBe('≈ 392 HV');
    expect(eq(r, 'eq_hbw')).toBe('≈ 371 HBW');
    expect(eq(r, 'eq_hra')).toBe('≈ 70.4 HRA');
    expect(eq(r, 'eq_hs')).toBe('≈ 54 HS');
  });
  it('HRC 60 reproduces the printed row; Brinell is NOT equal to Vickers on hard steel', () => {
    const r = run('60', 'hrc');
    expect(eq(r, 'eq_hv')).toBe('≈ 697 HV');
    expect(eq(r, 'eq_hbw')).toBe('≈ 654 HBW');
    expect(eq(r, 'eq_hra')).toBe('≈ 81.2 HRA');
  });
  it('HRC 20 low end differs from the old fabricated table (HV 244 -> 238)', () => {
    expect(eq(run('20', 'hrc'), 'eq_hv')).toBe('≈ 238 HV');
  });
  it('HRC 68 is the last row', () => {
    expect(eq(run('68', 'hrc'), 'eq_hv')).toBe('≈ 940 HV');
  });
  it('linear interpolation between printed rows (HRC 45.5 -> midway between 446 and 458)', () => {
    expect(eq(run('45.5', 'hrc'), 'eq_hv')).toBe('≈ 452 HV');
  });
  it('HRB 100 pairs with HRC 23 / HV 254 / HBW 240', () => {
    const r = run('100', 'hrb');
    expect(eq(r, 'eq_hv')).toBe('≈ 254 HV');
    expect(eq(r, 'eq_hbw')).toBe('≈ 240 HBW');
    expect(eq(r, 'eq_hrc')).toBe('≈ 23 HRC');
  });
  it('HRB 90 -> HV 192 (row HRC 9)', () => {
    expect(eq(run('90', 'hrb'), 'eq_hv')).toBe('≈ 192 HV');
  });
  it('HV 600 -> HRC 55.3 (between 595=HRC55 and 613=HRC56)', () => {
    // 55 + (600-595)/(613-595) = 55.2778
    expect(eq(run('600', 'hv'), 'eq_hrc')).toBe('≈ 55.3 HRC');
  });
  it('HV 200 -> HRB 91.5 (between 196=HRB91 and 204=HRB92) and has no HRC (below HRC 20)', () => {
    const r = run('200', 'hv');
    expect(eq(r, 'eq_hrb')).toBe('≈ 91.5 HRB');
    expect(eq(r, 'eq_hrc')).toBeUndefined();
  });
  it('tensile estimate is 3.2 x HV and capped at HV 650', () => {
    expect(eq(run('400', 'hv'), 'eq_nmm2')).toBe('≈ 1,280 N/mm²');
    expect(eq(run('697', 'hv'), 'eq_nmm2')).toBeUndefined();
  });
  it('Brinell has no printed value above HRC 65 -> omitted, not extrapolated', () => {
    const r = run('67', 'hrc');
    expect(eq(r, 'eq_hbw')).toBeUndefined();
    expect(eq(r, 'eq_hv')).toBe('≈ 900 HV');
  });
  it('out-of-range input gives an explanatory error, never a number', () => {
    for (const [v, u] of [['15', 'hrc'], ['70', 'hrc'], ['80', 'hrb'], ['101', 'hrb'], ['1000', 'hv'], ['100', 'hv'], ['2', 'hs']] as const) {
      const r = run(v, u);
      expect(r).toHaveLength(1);
      expect(r[0].id).toBe('error');
      expect(r[0].value).toMatch(/not extrapolated/);
    }
  });
  it('round trip HRC -> HV -> HRC is stable for every printed HRC', () => {
    for (let hrc = 20; hrc <= 68; hrc++) {
      const hv = toHV('hrc', hrc)!;
      expect(fromHV('hrc', hv)!).toBeCloseTo(hrc, 9);
    }
  });
  it('table is monotone in every column', () => {
    for (let col = 1; col <= 5; col++) {
      let prev = -Infinity;
      for (const row of E140_ROWS) {
        const v = row[col];
        if (v === null) continue;
        expect(v).toBeGreaterThanOrEqual(prev);
        prev = v;
      }
    }
  });
  it('declared ranges come from the table', () => {
    expect(scaleRange('hrc')).toEqual([20, 68]);
    expect(scaleRange('hrb')).toEqual([81, 100]);
    expect(scaleRange('hv')).toEqual([160, 940]);
    expect(scaleRange('hbw')[0]).toBe(153);
  });
  it('incomplete input returns [] and the result is labelled approximate', () => {
    expect(config.calculate({})).toEqual([]);
    expect(config.calculate({ fromValue: '', fromUnit: 'hrc' })).toEqual([]);
    expect(config.calculate({ fromValue: 'abc', fromUnit: 'hrc' })).toEqual([]);
    expect(config.calculate({ fromValue: '40', fromUnit: 'zzz' })).toEqual([]);
    const r = run('40', 'hrc');
    expect(r[0].interpretation).toMatch(/Approximate/);
    expect(r.filter((x) => x.id.startsWith('eq_')).every((x) => x.value.startsWith('≈'))).toBe(true);
  });
  it('panel renders from results; null when only an error', () => {
    expect(config.extraPanel!({}, run('40', 'hrc'))).not.toBeNull();
    expect(config.extraPanel!({}, run('15', 'hrc'))).toBeNull();
  });
});
