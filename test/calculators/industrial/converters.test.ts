import { describe, it, expect } from 'vitest';
import type { CalculatorConfig } from '../../../src/types/calculator';
import angle from '../../../src/calculators/industrial/angle-converter/index';
import area from '../../../src/calculators/industrial/area-converter/index';
import cooking from '../../../src/calculators/industrial/cooking-converter/index';
import storage from '../../../src/calculators/industrial/data-storage-converter/index';
import density from '../../../src/calculators/industrial/density-converter/index';
import electrical from '../../../src/calculators/industrial/electrical-converter/index';
import energy from '../../../src/calculators/industrial/energy-converter/index';
import force from '../../../src/calculators/industrial/force-converter/index';
import frequency from '../../../src/calculators/industrial/frequency-converter/index';
import fuel from '../../../src/calculators/industrial/fuel-economy-converter/index';
import length from '../../../src/calculators/industrial/length-converter/index';
import power from '../../../src/calculators/industrial/power-converter/index';
import pressure from '../../../src/calculators/industrial/pressure-converter/index';
import speed from '../../../src/calculators/industrial/speed-converter/index';
import temperature from '../../../src/calculators/industrial/temperature-converter/index';
import torque from '../../../src/calculators/industrial/torque-converter/index';
import viscosity from '../../../src/calculators/industrial/viscosity-converter/index';
import volume from '../../../src/calculators/industrial/volume-converter/index';
import weight from '../../../src/calculators/industrial/weight-converter/index';

// Expected values were derived independently (python, from the exact definitions: 1 in = 25.4 mm, 1 lb = 0.45359237 kg,
// g0 = 9.80665 m/s2, US gal = 231 in3, UK gal = 4.54609 L, BTU(IT) = 1055.05585262 J, cal(th) = 4.184 J, atm = 101325 Pa).
// The converter prints 8 significant digits, so compare with a 1e-6 relative tolerance (scientific notation prints 7 digits).

const out = (cfg: CalculatorConfig, v: Record<string, string>): number => {
  const r = cfg.calculate(v).find((x) => x.id === 'result');
  if (!r) throw new Error(`no result for ${JSON.stringify(v)}`);
  return Number(r.value.split(' = ')[1].replace(/ .*$/, '').replace(/,/g, ''));
};

type Case = [string, CalculatorConfig, string, string, string, number];
const cases: Case[] = [
  ['angle 60 deg -> rad', angle, '60', 'deg', 'rad', 1.0471975511965976],
  ['angle 135 grad -> deg', angle, '135', 'grad', 'deg', 121.5],
  ['angle 3.294 mrad -> arcmin', angle, '3.294', 'mrad', 'arcmin', 11.323937862965591],
  ['angle 180 deg -> grad', angle, '180', 'deg', 'grad', 200],
  ['angle 1 turn -> arcsec', angle, '1', 'turn', 'arcsec', 1296000],
  ['area 2400 ft2 -> m2 (was 0.092903)', area, '2400', 'ft2', 'm2', 222.967296],
  ['area 80 ac -> ha (was 4046.86)', area, '80', 'ac', 'ha', 32.3748513792],
  ['area 15 ha -> ac', area, '15', 'ha', 'ac', 37.0658072200748],
  ['area 1 mi2 -> km2 (was 2589988.1)', area, '1', 'mi2', 'km2', 2.589988110336],
  ['area 1 yd2 -> ft2', area, '1', 'yd2', 'ft2', 9],
  ['length 42.5 ft -> m', length, '42.5', 'ft', 'm', 12.954],
  ['length 42.195 km -> mi', length, '42.195', 'km', 'mi', 26.218757456454306],
  ['length 13.75 ft -> m', length, '13.75', 'ft', 'm', 4.191],
  ['length 1 nmi -> km', length, '1', 'nmi', 'km', 1.852],
  ['length 1 in -> mm', length, '1', 'in', 'mm', 25.4],
  ['weight 1 kg -> lb', weight, '1', 'kg', 'lb', 2.2046226218487757],
  ['weight 1 US ton -> kg', weight, '1', 'usTon', 'kg', 907.18474],
  ['weight 1 UK ton -> kg', weight, '1', 'ukTon', 'kg', 1016.0469088],
  ['weight 1 st -> kg', weight, '1', 'st', 'kg', 6.35029318],
  ['weight 1 lb -> oz', weight, '1', 'lb', 'oz', 16],
  ['volume 1 US gal -> L', volume, '1', 'gal', 'l', 3.785411784],
  ['volume 1 UK gal -> L', volume, '1', 'ukgal', 'l', 4.54609],
  ['volume 1 UK gal -> US gal', volume, '1', 'ukgal', 'gal', 1.2009499255],
  ['volume 1 US cup -> mL', volume, '1', 'cup', 'ml', 236.5882365],
  ['volume 1 tsp -> mL (was 4.92892)', volume, '1', 'tsp', 'ml', 4.92892159375],
  ['volume 1 ft3 -> L', volume, '1', 'ft3', 'l', 28.316846592],
  ['volume 1 UK pint -> mL', volume, '1', 'ukpt', 'ml', 568.26125],
  ['cooking 250 g water -> cup', cooking, '250', 'gram', 'cup', 1.0566882094325938],
  ['cooking 2 cup -> mL', cooking, '2', 'cup', 'ml', 473.176473],
  ['cooking 2 fl oz -> mL', cooking, '2', 'floz', 'ml', 59.147059125],
  ['cooking metric cup 250 mL -> US cup', cooking, '1', 'mcup', 'cup', 1.0566882094325938],
  ['cooking 1 tbsp -> tsp', cooking, '1', 'tbsp', 'tsp', 3],
  ['cooking 1 lb (water) -> g', cooking, '1', 'lb_weight', 'gram', 453.59237],
  ['storage 2 TB -> GiB', storage, '2', 'tb', 'gib', 1862.645149230957],
  ['storage 1 TiB -> B', storage, '1', 'tib', 'b', 1099511627776],
  ['storage 1e9 KiB -> GB', storage, '1000000000', 'kib', 'gb', 1024],
  ['storage 36000 GB -> TB', storage, '36000', 'gb', 'tb', 36],
  ['storage 1 PiB -> B', storage, '1', 'pib', 'b', 1125899906842624],
  ['storage 1 B -> bit', storage, '1', 'b', 'bit', 8],
  ['storage 1 GB -> GiB', storage, '1', 'gb', 'gib', 0.931322574615479],
  ['density 1 lb/ft3 -> kg/m3 (was 16.0185)', density, '1', 'lbft3', 'kgm3', 16.018463373960138],
  ['density 1 lb/in3 -> kg/m3', density, '1', 'lbin3', 'kgm3', 27679.904710203125],
  ['density 1 lb/US gal -> kg/m3', density, '1', 'lbgalus', 'kgm3', 119.82642731689664],
  ['density 1 lb/UK gal -> kg/m3', density, '1', 'lbgaluk', 'kgm3', 99.7763726631017],
  ['density 1 oz/in3 -> kg/m3', density, '1', 'ozin3', 'kgm3', 1729.9940443876953],
  ['density SG 2.7 -> g/cm3', density, '2.7', 'sg', 'gcm3', 2.7],
  ['electrical 4.7 kohm -> ohm', electrical, '4.7', 'kohm', 'ohm', 4700],
  ['electrical 100 nF -> uF', electrical, '100', 'nf', 'uf', 0.1],
  ['electrical 3000 mAh -> C', electrical, '3000', 'mah', 'c', 10800],
  ['electrical 13.8 kV -> V', electrical, '13.8', 'kv', 'v', 13800],
  ['electrical 1 S -> mS', electrical, '1', 's', 'ms', 1000],
  ['energy 1 kWh -> BTU (was 1055.06)', energy, '1', 'kwh', 'btu', 3412.141633127942],
  ['energy 1 kcal -> kJ', energy, '1', 'kcal', 'kj', 4.184],
  ['energy 1 ft.lbf -> J', energy, '1', 'ftlb', 'j', 1.3558179483314004],
  ['energy 1 therm -> J', energy, '1', 'therm', 'j', 105505585.262],
  ['energy 1 TCE -> kWh', energy, '1', 'tce', 'kwh', 8141],
  ['energy 1 eV -> J (tiny result, not "0")', energy, '1', 'ev', 'j', 1.602176634e-19],
  ['force 1 lbf -> N (was 4.44822)', force, '1', 'lbf', 'n', 4.4482216152605],
  ['force 2500 kN -> kip', force, '2500', 'kn', 'kip', 562.0223577492762],
  ['force 50000 N -> kgf', force, '50000', 'n', 'kgf', 5098.581064889641],
  ['force 2750 kN -> lbf', force, '2750', 'kn', 'lbf', 618224.5935242039],
  ['force 1 pdl -> N', force, '1', 'pdl', 'n', 0.138254954376],
  ['frequency 60 Hz -> RPM', frequency, '60', 'hz', 'rpm', 3600],
  ['frequency 1 rad/s -> Hz', frequency, '1', 'rads', 'hz', 0.15915494309189535],
  ['frequency 1 RPM -> deg/s', frequency, '1', 'rpm', 'dps', 6],
  ['power 1 hp -> W (was 745.7)', power, '1', 'hp', 'w', 745.6998715822702],
  ['power 400 kW -> hp', power, '400', 'kw', 'hp', 536.4088358380111],
  ['power 400 kW -> metric hp (was 735.499)', power, '400', 'kw', 'hpm', 543.8486469215618],
  ['power 5800 BTU/h -> W', power, '5800', 'btuh', 'w', 1699.8122069988888],
  ['power 40 hp(E) -> kW', power, '40', 'hpe', 'kw', 29.84],
  ['power 1 TR -> kW', power, '1', 'tr', 'kw', 3.5168528420666667],
  ['pressure 1 psi -> Pa (was 6894.76)', pressure, '1', 'psi', 'pa', 6894.757293168361],
  ['pressure 1 atm -> psi', pressure, '1', 'atm', 'psi', 14.69594877551345],
  ['pressure 760 mmHg -> atm', pressure, '760', 'mmhg', 'atm', 1],
  ['pressure 1 inHg -> Pa', pressure, '1', 'inhg', 'pa', 3386.388640341],
  ['pressure 1 bar -> psi', pressure, '1', 'bar', 'psi', 14.503773773020923],
  ['speed 70 mph -> km/h', speed, '70', 'mph', 'kmh', 112.65408],
  ['speed 480 kn -> km/h', speed, '480', 'kn', 'kmh', 888.96],
  ['speed 100 km/h -> mph', speed, '100', 'kmh', 'mph', 62.13711922373339],
  ['speed 1 Mach -> km/h', speed, '1', 'mach', 'kmh', 1225.0584],
  ['speed 1 c -> m/s', speed, '1', 'c', 'ms', 299792458],
  ['torque 103 N.m -> lbf.ft', torque, '103', 'nm', 'lbfft', 75.96890137555833],
  ['torque 45 lbf.in -> N.m', torque, '45', 'lbfin', 'nm', 5.084317306242752],
  ['torque 8 N.m -> kgf.cm', torque, '8', 'nm', 'kgfcm', 81.57729703823426],
  ['torque 1 kip.ft -> N.m', torque, '1', 'kipft', 'nm', 1355.8179483314004],
  ['fuel 30 US mpg -> L/100km', fuel, '30', 'usmpg', 'l100km', 7.84048611111111],
  ['fuel 10 L/100km -> US mpg', fuel, '10', 'l100km', 'usmpg', 23.52145833333333],
  ['fuel 10 L/100km -> UK mpg', fuel, '10', 'l100km', 'ukmpg', 28.248093633182215],
  ['fuel 30 US mpg -> UK mpg', fuel, '30', 'usmpg', 'ukmpg', 36.02849776514565],
  ['fuel 1 US gal/100mi -> L/100km (was 2.352)', fuel, '1', 'usgal100mi', 'l100km', 2.352145833333333],
  ['fuel 1 km/L -> US mpg', fuel, '1', 'kml', 'usmpg', 2.352145833333333],
  ['temperature 100 C -> F', temperature, '100', 'c', 'f', 212],
  ['temperature 37 C -> F', temperature, '37', 'c', 'f', 98.6],
  ['temperature -40 C -> F', temperature, '-40', 'c', 'f', -40],
  ['temperature 491.67 R -> K', temperature, '491.67', 'r', 'k', 273.15],
  ['temperature 0 F -> R', temperature, '0', 'f', 'r', 459.67],
  ['viscosity 1 Pa.s -> cP', viscosity, '1', 'pas', 'cp', 1000],
  ['viscosity 1 St -> cSt', viscosity, '1', 'st', 'cst', 100],
];

// fuel economy keeps legacy input ids so shared URLs keep working
const ids = (cfg: CalculatorConfig) => (cfg === fuel ? { v: 'fromValue', f: 'fromUnit', t: 'toUnit' } : { v: 'value', f: 'from', t: 'to' });

describe('industrial converters: values vs independently derived references', () => {
  for (const [name, cfg, value, from, to, expected] of cases) {
    it(name, () => {
      const k = ids(cfg);
      const got = out(cfg, { [k.v]: value, [k.f]: from, [k.t]: to });
      expect(Math.abs(got - expected)).toBeLessThanOrEqual(Math.abs(expected) * 1e-6);
    });
  }
  it('fuel economy shows the L/100km base equivalent between two non-metric units', () => {
    expect(fuel.calculate({ fromValue: '30', fromUnit: 'usmpg', toUnit: 'ukmpg' }).some((x) => x.id === 'baseEquivalent')).toBe(true);
    expect(fuel.calculate({ fromValue: '30', fromUnit: 'usmpg', toUnit: 'l100km' }).some((x) => x.id === 'baseEquivalent')).toBe(false);
  });
});

describe('industrial converters: shared behaviour', () => {
  const all: [string, CalculatorConfig][] = [
    ['angle', angle], ['area', area], ['cooking', cooking], ['storage', storage], ['density', density], ['electrical', electrical],
    ['energy', energy], ['force', force], ['frequency', frequency], ['length', length], ['power', power], ['pressure', pressure],
    ['speed', speed], ['temperature', temperature], ['torque', torque], ['volume', volume], ['weight', weight],
  ];
  for (const [name, cfg] of all) {
    it(`${name}: incomplete / invalid input returns []`, () => {
      expect(cfg.calculate({})).toEqual([]);
      expect(cfg.calculate({ value: '' })).toEqual([]);
      expect(cfg.calculate({ value: '12abc' })).toEqual([]);
      expect(cfg.calculate({ value: '1', from: 'nope', to: 'nope' })).toEqual([]);
    });
    it(`${name}: defaults give a result, identity conversion returns the input, panel uses the same numbers`, () => {
      const vals: Record<string, string> = {};
      for (const i of cfg.inputs) vals[i.id] = i.defaultValue ?? '';
      const results = cfg.calculate(vals);
      expect(results.length).toBeGreaterThan(0);
      const from = cfg.inputs[1].defaultValue!;
      expect(out(cfg, { value: '7.25', from, to: from })).toBeCloseTo(7.25, 9);
      const el = cfg.extraPanel!(vals, results) as { props: { input: number; result: number } } | null;
      expect(el).not.toBeNull();
      expect(Number.isFinite(el!.props.input) && Number.isFinite(el!.props.result)).toBe(true);
      expect(cfg.extraPanel!(vals, [])).toBeNull();
    });
    it(`${name}: extreme values never print NaN / Infinity`, () => {
      const u = cfg.inputs[1].options!;
      for (const v of ['1e308', '1e-308', '0']) {
        for (const r of cfg.calculate({ value: v, from: u[u.length - 1].value, to: u[0].value })) expect(r.value).not.toMatch(/NaN|Infinity/);
      }
    });
    it(`${name}: educational content is complete`, () => {
      expect(cfg.educational.formula).toBeTruthy();
      expect(cfg.educational.faqs!.length).toBeGreaterThanOrEqual(3);
      expect(cfg.educational.citations!.length).toBeGreaterThan(0);
    });
  }

  it('every worked example in the educational text is reproducible from its inputs', () => {
    for (const [, cfg] of [...all, ['fuel', fuel] as [string, CalculatorConfig]]) {
      for (const w of cfg.educational.workedExamples ?? []) {
        expect(cfg.calculate(w.inputs).some((r) => r.id === 'result'), JSON.stringify(w.inputs)).toBe(true);
      }
    }
  });
  it('frequency rejects negative values; pressure keeps sign (gauge vacuum)', () => {
    expect(frequency.calculate({ value: '-1', from: 'hz', to: 'rpm' })).toEqual([]);
    expect(out(pressure, { value: '-5', from: 'psi', to: 'kpa' })).toBeCloseTo(-34.473786, 5);
  });
  it('temperature: absolute zero floor', () => {
    expect(out(temperature, { value: '-273.15', from: 'c', to: 'k' })).toBe(0);
    expect(out(temperature, { value: '-459.67', from: 'f', to: 'k' })).toBe(0);
    expect(out(temperature, { value: '0', from: 'k', to: 'c' })).toBeCloseTo(-273.15, 9);
    const below = temperature.calculate({ value: '-300', from: 'c', to: 'f' });
    expect(below[0].id).toBe('error');
    expect(below[0].value).toMatch(/below absolute zero/);
    expect(temperature.calculate({ value: '-1', from: 'k', to: 'c' })[0].id).toBe('error');
    expect(temperature.calculate({ value: '-1', from: 'r', to: 'c' })[0].id).toBe('error');
    expect(temperature.extraPanel!({ value: '-1', from: 'k', to: 'c' }, temperature.calculate({ value: '-1', from: 'k', to: 'c' }))).toBeNull();
  });
  it('electrical: cross-category pairs are refused with a message, not a number', () => {
    const r = electrical.calculate({ value: '1', from: 'v', to: 'a' });
    expect(r).toHaveLength(1);
    expect(r[0].id).toBe('error');
    expect(r[0].label).toBe('Incompatible Units');
  });
  it('viscosity: dynamic <-> kinematic needs density', () => {
    // 10 cP at 870 kg/m3: nu = 0.01 Pa.s / 870 = 1.1494e-5 m2/s = 11.494 cSt
    expect(out(viscosity, { value: '10', from: 'cp', to: 'cst', density: '870' })).toBeCloseTo(11.494252873563218, 6);
    // 1 cSt at 800 kg/m3: mu = 1e-6 * 800 = 8e-4 Pa.s = 0.8 mPa.s
    expect(out(viscosity, { value: '1', from: 'cst', to: 'mpas', density: '800' })).toBeCloseTo(0.8, 9);
    expect(viscosity.calculate({ value: '1', from: 'cp', to: 'cst', density: '' })).toEqual([]);
    expect(viscosity.calculate({ value: '1', from: 'cp', to: 'cst', density: '0' })).toEqual([]);
    const densityInput = viscosity.inputs.find((i) => i.id === 'density')!;
    expect(densityInput.showWhen!({ from: 'cp', to: 'cst' })).toBe(true);
    expect(densityInput.showWhen!({ from: 'cp', to: 'pas' })).toBe(false);
    expect(viscosity.calculate({ value: '5', from: 'cp', to: 'mpas' })[0].value).toContain('5 mPa·s');
  });
  it('data storage: decimal vs binary interpretation', () => {
    expect(storage.calculate({ value: '1', from: 'tb', to: 'gib' })[0].interpretation).toMatch(/931 GiB/);
    expect(storage.calculate({ value: '1', from: 'gb', to: 'mb' })[0].interpretation).toMatch(/decimal/);
    expect(storage.calculate({ value: '1', from: 'gib', to: 'mib' })[0].interpretation).toMatch(/binary/);
    expect(storage.calculate({ value: '1', from: 'b', to: 'bit' })[0].interpretation).toMatch(/eighth/);
  });
  it('fuel economy: zero / negative / non-finite are rejected (reciprocal units)', () => {
    for (const v of ['0', '-5', '1e999']) expect(fuel.calculate({ fromValue: v, fromUnit: 'usmpg', toUnit: 'l100km' })).toEqual([]);
    expect(fuel.explainSteps!({ fromValue: '30', fromUnit: 'usmpg', toUnit: 'l100km' }).length).toBe(2);
  });
});
