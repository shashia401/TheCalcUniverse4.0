import { describe, it, expect } from 'vitest';
import type { CalculatorConfig } from '../../../src/types/calculator';
import angle from '../../../src/calculators/industrial/angle-converter';
import area from '../../../src/calculators/industrial/area-converter';
import dataStorage from '../../../src/calculators/industrial/data-storage-converter';
import density from '../../../src/calculators/industrial/density-converter';
import electrical from '../../../src/calculators/industrial/electrical-converter';
import energy from '../../../src/calculators/industrial/energy-converter';
import force from '../../../src/calculators/industrial/force-converter';
import frequency from '../../../src/calculators/industrial/frequency-converter';
import length from '../../../src/calculators/industrial/length-converter';
import power from '../../../src/calculators/industrial/power-converter';
import pressure from '../../../src/calculators/industrial/pressure-converter';
import speed from '../../../src/calculators/industrial/speed-converter';
import torque from '../../../src/calculators/industrial/torque-converter';
import volume from '../../../src/calculators/industrial/volume-converter';
import weight from '../../../src/calculators/industrial/weight-converter';
import cooking from '../../../src/calculators/industrial/cooking-converter';
import viscosity from '../../../src/calculators/industrial/viscosity-converter';
import temperature from '../../../src/calculators/industrial/temperature-converter';
import fuel from '../../../src/calculators/industrial/fuel-economy-converter';
import hardness from '../../../src/calculators/industrial/hardness-converter';
import cbm from '../../../src/calculators/industrial/cbm-calculator';
import oven from '../../../src/calculators/industrial/oven-temperature-converter';

// Every pinned number below was computed independently with Python's decimal module (60 digits, ROUND_HALF_UP to
// 8 significant digits) from the exact definitions (1 in = 0.0254 m, 1 lb = 0.45359237 kg, g0 = 9.80665,
// 1 US gal = 231 in3, 1 BTU(IT) = 1055.05585262 J, ...), never by running the converters.

type V = Record<string, string>;
const noCommas = (s: string) => s.replace(/(\d),(?=\d{3})/g, '$1');
const exprs = (c: CalculatorConfig, v: V) => c.explainSteps!(v).map((s) => noCommas(s.expr));
const displayed = (c: CalculatorConfig, v: V) => noCommas(String(c.calculate(v).find((r) => r.id === 'result')!.value));
const ids = (from: string, to: string, value: string): V => ({ value, from, to });

// [name, config, input values, base unit, base-unit number, converted number, target label]
const LINEAR: [string, CalculatorConfig, V, string, string, string, string][] = [
  ['length 5 mi to km', length, ids('mi', 'km', '5'), 'm', '8046.72', '8.04672', 'km'],
  ['length 100 in to ft', length, ids('in', 'ft', '100'), 'm', '2.54', '8.3333333', 'ft'],
  ['angle 2 turn to rad', angle, ids('turn', 'rad', '2'), '°', '720', '12.566371', 'rad'],
  ['area 10 ac to ha', area, ids('ac', 'ha', '10'), 'm²', '40468.564', '4.0468564', 'ha'],
  ['data-storage 2 GiB to MB', dataStorage, ids('gib', 'mb', '2'), 'B', '2147483648', '2147.4836', 'MB'],
  ['data-storage 1 TB to TiB', dataStorage, ids('tb', 'tib', '1'), 'B', '1000000000000', '0.9094947', 'TiB'],
  ['density 62.4 lb/ft3 to kg/m3', density, ids('lbft3', 'kgm3', '62.4'), 'kg/m³', '999.55211', '999.55211', 'kg/m³'],
  ['electrical 4.7 kohm to Mohm', electrical, ids('kohm', 'mohm2', '4.7'), 'Ω', '4700', '0.0047', 'MΩ'],
  ['energy 1 kWh to BTU', energy, ids('kwh', 'btu', '1'), 'J', '3600000', '3412.1416', 'BTU'],
  ['force 100 lbf to N', force, ids('lbf', 'n', '100'), 'N', '444.82216', '444.82216', 'N'],
  ['force 10 kgf to lbf', force, ids('kgf', 'lbf', '10'), 'N', '98.0665', '22.046226', 'lbf'],
  ['frequency 60 rpm to rad/s', frequency, ids('rpm', 'rads', '60'), 'Hz', '1', '6.2831853', 'rad/s'],
  ['power 150 hp to kW', power, ids('hp', 'kw', '150'), 'W', '111854.98', '111.85498', 'kW'],
  ['pressure 32 psi to kPa', pressure, ids('psi', 'kpa', '32'), 'Pa', '220632.23', '220.63223', 'kPa'],
  ['speed 60 mph to km/h', speed, ids('mph', 'kmh', '60'), 'm/s', '26.8224', '96.56064', 'km/h'],
  ['torque 100 lbf-ft to N-m', torque, ids('lbfft', 'nm', '100'), 'N·m', '135.58179', '135.58179', 'N·m'],
  ['volume 5 gal to L', volume, ids('gal', 'l', '5'), 'L', '18.927059', '18.927059', 'L'],
  ['volume 2 cup to mL', volume, ids('cup', 'ml', '2'), 'L', '0.47317647', '473.17647', 'mL'],
  ['weight 154 lb to kg', weight, ids('lb', 'kg', '154'), 'g', '69853.225', '69.853225', 'kg'],
  ['cooking 1.5 cup to mL', cooking, ids('cup', 'ml', '1.5'), 'mL', '354.88235', '354.88235', 'mL'],
  ['viscosity 100 cP to Pa-s', viscosity, ids('cp', 'pas', '100'), 'Pa·s', '0.1', '0.1', 'Pa·s'],
];

describe('industrial explainSteps - linear converters', () => {
  for (const [name, c, v, bu, base, result, toLabel] of LINEAR) {
    it(`${name}: base-unit number and final line`, () => {
      const s = exprs(c, v);
      expect(s.length).toBeGreaterThanOrEqual(2);
      // (a) the last step is exactly the line the converter displays, and carries the independently computed number
      expect(s[s.length - 1]).toBe(displayed(c, v));
      expect(s[s.length - 1].endsWith(`= ${result} ${toLabel}`)).toBe(true);
      // (b) the intermediate number in the base unit
      expect(s.join('\n')).toContain(`${base} ${bu}`);
      for (const line of s) expect(line).not.toMatch(/NaN|Infinity|undefined/);
    });
  }

  it('shows the real factor from the table: 5 mi to km', () => {
    expect(exprs(length, ids('mi', 'km', '5'))).toEqual([
      '5 mi × 1609.344 m/mi = 8046.72 m',
      '8046.72 m ÷ 1000 m/km = 8.04672 km',
      '5 mi = 8.04672 km',
    ]);
  });

  it('skips the trivial step when a unit is already the base unit', () => {
    expect(exprs(length, ids('m', 'ft', '3')).length).toBe(2);
    expect(exprs(length, ids('m', 'm', '3'))).toEqual(['3 m = 3 m']);
  });
});

describe('industrial explainSteps - viscosity with density', () => {
  const v = { value: '100', from: 'cp', to: 'cst', density: '800' };
  it('100 cP to cSt at 800 kg/m3', () => {
    const s = exprs(viscosity, v);
    expect(s[0]).toContain('= 0.1 Pa·s');
    expect(s[1]).toContain('= 0.000125 m²/s'); // 0.1 / 800
    expect(s[1]).toContain('800 kg/m³');
    expect(s[s.length - 1]).toBe(displayed(viscosity, v));
    expect(s[s.length - 1].endsWith('= 125 cSt')).toBe(true);
  });
  it('kinematic to dynamic multiplies by the density', () => {
    const w = { value: '125', from: 'cst', to: 'cp', density: '800' };
    const s = exprs(viscosity, w);
    expect(s.join('\n')).toContain('μ = ν × ρ');
    expect(s[s.length - 1].endsWith('= 100 cP')).toBe(true);
  });
  it('needs a density only for dynamic <-> kinematic', () => {
    expect(viscosity.explainSteps!({ value: '100', from: 'cp', to: 'cst', density: '' })).toEqual([]);
    expect(viscosity.explainSteps!({ value: '100', from: 'cp', to: 'cst', density: '0' })).toEqual([]);
  });
});

describe('industrial explainSteps - temperature uses the real pair formula', () => {
  const T: [string, string, string, string, string][] = [
    // from, to, value, formula, converted number (Decimal oracle)
    ['f', 'c', '212', '°C = (°F − 32) × 5/9', '100'],
    ['c', 'f', '100', '°F = °C × 9/5 + 32', '212'],
    ['k', 'r', '300', '°R = K × 9/5', '540'],
    ['f', 'c', '98.6', '°C = (°F − 32) × 5/9', '37'],
    ['c', 'f', '37', '°F = °C × 9/5 + 32', '98.6'],
    ['c', 'k', '-40', 'K = °C + 273.15', '233.15'],
    ['f', 'k', '50', 'K = (°F + 459.67) × 5/9', '283.15'],
  ];
  for (const [from, to, value, formula, out] of T) {
    it(`${value} ${from} to ${to}`, () => {
      const v = ids(from, to, value);
      const s = exprs(temperature, v);
      expect(s[0]).toBe(formula);
      expect(s[1].endsWith(`= ${out} ${{ c: '°C', f: '°F', k: 'K', r: '°R' }[to]}`)).toBe(true);
      expect(s[s.length - 1].endsWith(`= ${out} ${{ c: '°C', f: '°F', k: 'K', r: '°R' }[to]}`)).toBe(true);
      expect(s[s.length - 1]).toBe(displayed(temperature, v));
    });
  }
  it('shows the visitor numbers in the formula', () => {
    expect(exprs(temperature, ids('f', 'c', '212'))[1]).toBe('(212 − 32) × 5/9 = 100 °C');
    expect(exprs(temperature, ids('c', 'k', '-40'))[1]).toBe('(-40) + 273.15 = 233.15 K');
  });
  it('rejects below absolute zero', () => {
    expect(temperature.explainSteps!(ids('c', 'f', '-300'))).toEqual([]);
    expect(temperature.explainSteps!(ids('k', 'c', '-1'))).toEqual([]);
  });
});

describe('industrial explainSteps - fuel economy (reciprocal scales)', () => {
  const F: [string, string, string, string, string, string][] = [
    // from, to, value, base L/100km ('' = not shown), converted number (Decimal oracle), target label
    ['usmpg', 'l100km', '30', '7.8404861', '7.8404861', 'L/100km'],
    ['l100km', 'usmpg', '8', '', '29.401823', 'US mpg'],
    ['usmpg', 'ukmpg', '30', '7.8404861', '36.028498', 'UK mpg'],
    ['usgal100mi', 'kml', '10', '23.521458', '4.2514371', 'km/L'],
  ];
  for (const [from, to, value, base, out, label] of F) {
    it(`${value} ${from} to ${to}`, () => {
      const v = { fromValue: value, fromUnit: from, toUnit: to };
      const s = exprs(fuel, v);
      if (base) expect(s.join('\n')).toContain(`= ${base} L/100km`);
      expect(s[s.length - 1]).toBe(displayed(fuel, v));
      expect(s[s.length - 1].endsWith(`= ${out} ${label}`)).toBe(true);
    });
  }
  it('uses the exact constant: 235.2145833 / 30', () => {
    expect(exprs(fuel, { fromValue: '30', fromUnit: 'usmpg', toUnit: 'l100km' })[0]).toBe('L/100km = 235.2145833 ÷ 30 US mpg = 7.8404861 L/100km');
  });
  it('rejects zero and negative (reciprocal)', () => {
    for (const x of ['0', '-5']) expect(fuel.explainSteps!({ fromValue: x, fromUnit: 'usmpg', toUnit: 'l100km' })).toEqual([]);
  });
});

describe('industrial explainSteps - hardness (approximate table lookup)', () => {
  const run = (value: string, scale: string) => hardness.explainSteps!({ fromValue: value, fromUnit: scale });
  it('HRC 40.5 interpolates halfway between HV 392 and HV 402', () => {
    const s = run('40.5', 'hrc');
    expect(s[0].expr).toBe('HRC 40.5 → HV 397'); // 392 + (402 - 392) x 0.5
    expect(s[0].note).toMatch(/Approximate/);
    expect(s[0].note).toMatch(/E140/);
  });
  it('the last step lists exactly what the converter displays', () => {
    const v = { fromValue: '40.5', fromUnit: 'hrc' };
    const last = hardness.explainSteps!(v).at(-1)!.expr;
    for (const r of hardness.calculate(v).filter((x) => x.id.startsWith('eq_'))) expect(last).toContain(String(r.value));
  });
  it('tensile estimate: 1280 N/mm2 is HV 400, which is HRC 40.8 and HBW 379', () => {
    const s = run('1280', 'nmm2');
    expect(s[0].expr).toBe('HV = 1,280 N/mm² ÷ 3.2 = 400');
    expect(s[1].expr).toContain('≈ 40.8 HRC');
    expect(s[1].expr).toContain('≈ 379 HBW');
  });
  it('HV is the pivot scale and out-of-table or blank input returns []', () => {
    expect(run('400', 'hv')[0].label).toMatch(/pivot/);
    expect(run('15', 'hrc')).toEqual([]);
    expect(run('', 'hrc')).toEqual([]);
    expect(run('abc', 'hrc')).toEqual([]);
  });
});

describe('industrial explainSteps - CBM and chargeable weight', () => {
  const base = { length: '100', width: '50', height: '40', unit: 'cm', packages: '3', actualWeight: '50', shippingMode: 'air' };
  it('100x50x40 cm x 3, air: 0.6 CBM, 100 kg dimensional beats 50 kg actual', () => {
    const s = exprs(cbm, base);
    expect(s[0]).toBe('1 m × 0.5 m × 0.4 m = 0.2 m³'); // Decimal: 0.200000
    expect(s[1]).toBe('0.2 m³ × 3 packages = 0.6000 CBM');
    expect(s[2]).toContain('= 100.00 kg'); // 0.6e6 / 6000
    expect(s[3]).toBe('max(actual 50.00 kg, dimensional 100.00 kg) = 100.00 kg');
    const r = cbm.calculate(base);
    expect(s[3].endsWith(`= ${String(r.find((x) => x.id === 'chargeableWeight')!.value)}`)).toBe(true);
    expect(s[1].endsWith(`= ${String(r.find((x) => x.id === 'cbm')!.value)} CBM`)).toBe(true);
  });
  it('24x18x12 in x 2, sea, heavy cargo is billed on actual weight', () => {
    const v = { length: '24', width: '18', height: '12', unit: 'in', packages: '2', actualWeight: '300', shippingMode: 'sea' };
    const s = exprs(cbm, v);
    expect(s[0]).toContain('= 0.08495054 m³'); // Decimal: 0.084950539776
    expect(s[1]).toContain('= 0.1699 CBM'); // 0.169901079552
    expect(s[2]).toContain('= 169.90 kg'); // x 1e6 / 1000
    expect(s[3]).toBe('max(actual 300.00 kg, dimensional 169.90 kg) = 300.00 kg');
  });
  it('invalid input returns []', () => {
    for (const patch of [{ length: '' }, { width: '0' }, { height: '-1' }, { actualWeight: 'abc' }, { packages: '1.5' }, { unit: 'yd' }, { length: '1e999' }]) {
      expect(cbm.explainSteps!({ ...base, ...patch })).toEqual([]);
    }
  });
});

describe('industrial explainSteps - oven temperature', () => {
  it('180 C to F', () => {
    const v = { value: '180', from: 'c', to: 'f' };
    const s = exprs(oven, v);
    expect(s[0]).toBe('°F = °C × 9/5 + 32 = 180 × 9/5 + 32 = 356.0 °F');
    expect(s.at(-1)).toBe(String(oven.calculate(v).find((r) => r.id === 'result')!.value));
  });
  it('350 F to C: (350 - 32) x 5/9 = 176.666...', () => {
    const v = { value: '350', from: 'f', to: 'c' };
    const s = exprs(oven, v);
    expect(s[0]).toBe('°C = (°F − 32) × 5/9 = (350 − 32) × 5/9 = 176.7 °C');
    expect(s.at(-1)).toContain('176.7°C');
  });
  it('gas mark 4 is a table row; 3.5 is interpolated halfway between marks 3 and 4', () => {
    expect(exprs(oven, { value: '4', from: 'gas', to: 'c' })[0]).toBe('Gas Mark 4 = 180 °C = 350 °F');
    const half = oven.explainSteps!({ value: '3.5', from: 'gas', to: 'f' });
    expect(half[0].label).toMatch(/Interpolate/);
    expect(half[0].expr).toBe('Gas Mark 3.5 = 175 °C = 338 °F'); // (170+180)/2 and (325+350)/2 = 337.5 rounds to 338
  });
  it('to Gas Mark names the nearest table row', () => {
    const v = { value: '180', from: 'c', to: 'gas' };
    const s = exprs(oven, v);
    expect(s[1]).toContain('closest to Gas Mark 4');
    expect(s.at(-1)).toBe(String(oven.calculate(v).find((r) => r.id === 'result')!.value));
  });
  it('invalid input returns []', () => {
    expect(oven.explainSteps!({ value: '', from: 'c', to: 'f' })).toEqual([]);
    expect(oven.explainSteps!({ value: 'abc', from: 'c', to: 'f' })).toEqual([]);
    expect(oven.explainSteps!({ value: '11', from: 'gas', to: 'c' })).toEqual([]);
  });
});

describe('industrial explainSteps - blank, invalid and runaway input return []', () => {
  const converters: [string, CalculatorConfig, V][] = LINEAR.map(([n, c, v]) => [n, c, v]);
  for (const [name, c, v] of converters) {
    it(`${name}`, () => {
      for (const bad of ['', '  ', 'abc', '1e999', '-1e999', 'NaN']) {
        const steps = c.explainSteps!({ ...v, value: bad });
        expect(steps).toEqual([]);
      }
    });
  }
  it('unknown units return []', () => {
    expect(length.explainSteps!(ids('furlong', 'km', '5'))).toEqual([]);
  });
  it('electrical across categories (V to A) returns []', () => {
    expect(electrical.explainSteps!(ids('v', 'a', '5'))).toEqual([]);
  });
  it('frequency rejects negatives (nonNegative)', () => {
    expect(frequency.explainSteps!(ids('hz', 'khz', '-5'))).toEqual([]);
  });
  it('fuel economy rejects blank and non-finite', () => {
    for (const x of ['', 'abc', '1e999']) expect(fuel.explainSteps!({ fromValue: x, fromUnit: 'usmpg', toUnit: 'l100km' })).toEqual([]);
  });
  it('density-free conversions ignore a missing density field', () => {
    expect(viscosity.explainSteps!({ value: '100', from: 'cp', to: 'pas' }).length).toBeGreaterThan(0);
  });
});

describe('industrial explainSteps - every converter, default values, no NaN', () => {
  const all: [string, CalculatorConfig][] = [
    ['angle', angle], ['area', area], ['cbm', cbm], ['cooking', cooking], ['data-storage', dataStorage], ['density', density],
    ['electrical', electrical], ['energy', energy], ['force', force], ['frequency', frequency], ['fuel', fuel], ['hardness', hardness],
    ['length', length], ['oven', oven], ['power', power], ['pressure', pressure], ['speed', speed], ['temperature', temperature],
    ['torque', torque], ['viscosity', viscosity], ['volume', volume], ['weight', weight],
  ];
  for (const [name, c] of all) {
    it(name, () => {
      const v: V = {};
      for (const i of c.inputs) v[i.id] = String(i.defaultValue ?? (i.type === 'number' ? '10' : ''));
      if (name === 'cbm') Object.assign(v, { length: '100', width: '50', height: '40', actualWeight: '50' });
      const s = c.explainSteps!(v);
      expect(s.length).toBeGreaterThan(0);
      for (const st of s) expect(`${st.label} ${st.expr} ${st.note ?? ''}`).not.toMatch(/NaN|Infinity|undefined/);
    });
  }
});
