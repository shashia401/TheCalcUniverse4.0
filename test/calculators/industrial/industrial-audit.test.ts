import { describe, it, expect } from 'vitest';
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
import fuelEconomy from '../../../src/calculators/industrial/fuel-economy-converter';
import hardness from '../../../src/calculators/industrial/hardness-converter';
import cbm from '../../../src/calculators/industrial/cbm-calculator';

// Every factor below is an exact definition or a NIST/SI value, written down independently of the code:
// 1 in = 25.4 mm, 1 lb = 0.45359237 kg, 1 US gal = 3.785411784 L, 1 nmi = 1852 m, 1 atm = 101325 Pa,
// 1 lbf = 4.4482216152605 N, 1 cal(th) = 4.184 J, 1 BTU(IT) = 1055.05585262 J, 1 hp = 745.69987158 W ...
type Out = { id: string; value: string }[];
const result = (cfg: any, inputs: Record<string, string>) => (cfg.calculate(inputs) as Out).find((r) => r.id === 'result')?.value;

const CASES: [string, any, string, string, string][] = [
  // [name, converter, from, to, expected "result" line for a value of 1]
  ['angle', angle, 'deg', 'rad', '1 ° = 0.017453293 rad'],
  ['angle', angle, 'turn', 'deg', '1 turn = 360 °'],
  ['angle', angle, 'point', 'deg', '1 pt = 11.25 °'],
  ['angle', angle, 'grad', 'deg', '1 grad = 0.9 °'],
  ['area', area, 'ac', 'm2', '1 ac = 4,046.8564 m²'],
  ['area', area, 'mi2', 'km2', '1 mi² = 2.5899881 km²'],
  ['area', area, 'ft2', 'm2', '1 ft² = 0.09290304 m²'],
  ['data', dataStorage, 'gb', 'mb', '1 GB = 1,000 MB'],
  ['data', dataStorage, 'gib', 'gb', '1 GiB = 1.0737418 GB'],
  ['data', dataStorage, 'b', 'bit', '1 B = 8 bit'],
  ['data', dataStorage, 'tib', 'gib', '1 TiB = 1,024 GiB'],
  ['density', density, 'gcm3', 'kgm3', '1 g/cm³ = 1,000 kg/m³'],
  ['density', density, 'lbft3', 'kgm3', '1 lb/ft³ = 16.018463 kg/m³'],
  ['density', density, 'lbgalus', 'kgm3', '1 lb/gal (US) = 119.82643 kg/m³'],
  ['electrical', electrical, 'mah', 'c', '1 mAh = 3.6 C'],
  ['electrical', electrical, 'ah', 'c', '1 Ah = 3,600 C'],
  ['energy', energy, 'kcal', 'j', '1 kcal = 4,184 J'],
  ['energy', energy, 'kwh', 'mj', '1 kWh = 3.6 MJ'],
  ['energy', energy, 'btu', 'j', '1 BTU = 1,055.0559 J'],
  ['energy', energy, 'ftlb', 'j', '1 ft·lbf = 1.3558179 J'],
  ['energy', energy, 'ev', 'j', '1 eV = 1.602177e-19 J'],
  ['energy', energy, 'wh', 'j', '1 Wh = 3,600 J'],
  ['force', force, 'lbf', 'n', '1 lbf = 4.4482216 N'],
  ['force', force, 'kgf', 'n', '1 kgf = 9.80665 N'],
  ['force', force, 'kip', 'n', '1 kip = 4,448.2216 N'],
  ['force', force, 'pdl', 'n', '1 pdl = 0.13825495 N'],
  ['frequency', frequency, 'hz', 'rpm', '1 Hz = 60 RPM'],
  ['frequency', frequency, 'hz', 'rads', '1 Hz = 6.2831853 rad/s'],
  ['frequency', frequency, 'hz', 'dps', '1 Hz = 360 °/s'],
  ['length', length, 'nmi', 'm', '1 nmi = 1,852 m'],
  ['length', length, 'mi', 'km', '1 mi = 1.609344 km'],
  ['length', length, 'in', 'mm', '1 in = 25.4 mm'],
  ['power', power, 'hp', 'w', '1 hp = 745.69987 W'],
  ['power', power, 'hpe', 'w', '1 hp(E) = 746 W'],
  ['power', power, 'hpm', 'w', '1 hp(M) = 735.49875 W'],
  ['power', power, 'btuh', 'w', '1 BTU/h = 0.29307107 W'],
  ['power', power, 'tr', 'kw', '1 TR = 3.5168528 kW'],
  ['pressure', pressure, 'atm', 'pa', '1 atm = 101,325 Pa'],
  ['pressure', pressure, 'psi', 'pa', '1 psi = 6,894.7573 Pa'],
  ['pressure', pressure, 'mmhg', 'pa', '1 mmHg = 133.32237 Pa'],
  ['pressure', pressure, 'inhg', 'pa', '1 inHg = 3,386.3886 Pa'],
  ['pressure', pressure, 'bar', 'psi', '1 bar = 14.503774 psi'],
  ['speed', speed, 'mph', 'ms', '1 mph = 0.44704 m/s'],
  ['speed', speed, 'kn', 'ms', '1 kn = 0.51444444 m/s'],
  ['speed', speed, 'c', 'ms', '1 c = 299,792,458 m/s'],
  ['torque', torque, 'lbfft', 'nm', '1 lbf·ft = 1.3558179 N·m'],
  ['torque', torque, 'kgfm', 'nm', '1 kgf·m = 9.80665 N·m'],
  ['torque', torque, 'ozfin', 'nm', '1 ozf·in = 0.0070615518 N·m'],
  ['volume', volume, 'gal', 'l', '1 gal = 3.7854118 L'],
  ['volume', volume, 'ukgal', 'l', '1 UK gal = 4.54609 L'],
  ['volume', volume, 'cup', 'ml', '1 cup = 236.58824 mL'],
  ['volume', volume, 'tbsp', 'ml', '1 tbsp = 14.786765 mL'],
  ['volume', volume, 'tsp', 'ml', '1 tsp = 4.9289216 mL'],
  ['volume', volume, 'ft3', 'l', '1 ft³ = 28.316847 L'],
  ['weight', weight, 'lb', 'kg', '1 lb = 0.45359237 kg'],
  ['weight', weight, 'oz', 'g', '1 oz = 28.349523 g'],
  ['weight', weight, 'st', 'kg', '1 st = 6.3502932 kg'],
  ['weight', weight, 'usTon', 'kg', '1 ton = 907.18474 kg'],
  ['weight', weight, 'ukTon', 'kg', '1 long ton = 1,016.0469 kg'],
  ['cooking', cooking, 'mcup', 'ml', '1 metric cup = 250 mL'],
  ['viscosity', viscosity, 'pas', 'p', '1 Pa·s = 10 P'],
  ['viscosity', viscosity, 'pas', 'cp', '1 Pa·s = 1,000 cP'],
  ['viscosity', viscosity, 'st', 'm2s', '1 St = 0.0001 m²/s'],
  ['temperature', temperature, 'c', 'f', '1 °C = 33.8 °F'],
  ['temperature', temperature, 'c', 'k', '1 °C = 274.15 K'],
  ['temperature', temperature, 'c', 'r', '1 °C = 493.47 °R'],
];

describe('industrial converters audit: exact definitions', () => {
  for (const [name, cfg, from, to, expected] of CASES) {
    it(`${name}: ${from} -> ${to}`, () => {
      expect(result(cfg, { value: '1', from, to })).toBe(expected);
    });
  }

  it('boiling point and freezing point of water on every temperature scale', () => {
    expect(result(temperature, { value: '100', from: 'c', to: 'f' })).toContain('212');
    expect(result(temperature, { value: '100', from: 'c', to: 'k' })).toContain('373.15');
    expect(result(temperature, { value: '32', from: 'f', to: 'c' })).toContain('= 0 °C');
    expect(result(temperature, { value: '-40', from: 'c', to: 'f' })).toContain('-40 °F');
    expect(result(temperature, { value: '0', from: 'k', to: 'c' })).toContain('-273.15 °C');
  });

  it('fuel economy: 30 US mpg = 7.84 L/100 km = 36.03 UK mpg = 12.75 km/L', () => {
    const f = (to: string) => result(fuelEconomy, { fromValue: '30', fromUnit: 'usmpg', toUnit: to });
    expect(f('l100km')).toBe('30 US mpg = 7.8404861 L/100km');
    expect(f('ukmpg')).toBe('30 US mpg = 36.028498 UK mpg');
    expect(f('kml')).toBe('30 US mpg = 12.754311 km/L');
  });

  it('hardness follows ASTM E140: HRC 40 = 392 HV = 371 HBW; out-of-table values are refused, not extrapolated', () => {
    const r = hardness.calculate({ fromValue: '40', fromUnit: 'hrc' }) as Out;
    expect(r.find((x) => x.id === 'eq_hv')?.value).toBe('≈ 392 HV');
    expect(r.find((x) => x.id === 'eq_hbw')?.value).toBe('≈ 371 HBW');
    expect(r.find((x) => x.id === 'eq_hra')?.value).toBe('≈ 70.4 HRA');
    const bad = hardness.calculate({ fromValue: '10', fromUnit: 'hrc' }) as Out;
    expect(bad.map((x) => x.id)).toEqual(['error']);
  });

  it('CBM: 10 cartons of 100 x 50 x 40 cm = 2 CBM; air volumetric 333.33 kg (6000 cm3/kg), sea 2000 kg (1 CBM = 1000 kg)', () => {
    const base = { length: '100', width: '50', height: '40', unit: 'cm', packages: '10', actualWeight: '100' };
    const air = cbm.calculate({ ...base, shippingMode: 'air' }) as Out;
    expect(air.find((x) => x.id === 'cbm')?.value).toBe('2.0000');
    expect(air.find((x) => x.id === 'chargeableWeight')?.value).toBe('333.33 kg');
    const sea = cbm.calculate({ ...base, shippingMode: 'sea' }) as Out;
    expect(sea.find((x) => x.id === 'chargeableWeight')?.value).toBe('2000.00 kg');
  });
});
