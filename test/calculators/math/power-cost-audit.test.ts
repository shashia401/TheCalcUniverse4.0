import { describe, it, expect } from 'vitest';
import electricity from '../../../src/calculators/math/electricity-cost';
import horsepower from '../../../src/calculators/math/horsepower';
import engineHp from '../../../src/calculators/math/engine-horsepower';

// Expected values recomputed independently in Python (exact decimals; 1 hp = 745.69987158227 W).
type R = { id: string; value: string }[];
const val = (r: R, id: string) => r.find((x) => x.id === id)?.value;

describe('electricity-cost audit', () => {
  const run = (o: Record<string, string>) =>
    electricity.calculate({ wattage: '1500', hoursPerDay: '4', days: '30', costPerKwh: '0.14', applianceCount: '1', ...o }) as R;

  it('1500 W x 4 h = 6 kWh/day; 180 kWh and $25.20 in 30 days', () => {
    const r = run({});
    expect(val(r, 'kwhUsed')).toBe('180 kWh');
    expect(val(r, 'kwhPerDay')).toBe('6 kWh');
    expect(val(r, 'costPerPeriod')).toBe('$25.20');
    expect(val(r, 'costPerDay')).toBe('$0.84');
    expect(val(r, 'costPerYear')).toBe('$306.60');
  });

  it('EV charger 7,000 W x 4 h: $3.92/day, $117.60/month, $1,430.80/year (full amounts, not "$1.43K")', () => {
    const r = run({ wattage: '7000' });
    expect(val(r, 'costPerDay')).toBe('$3.92');
    expect(val(r, 'costPerMonth')).toBe('$117.60');
    expect(val(r, 'costPerYear')).toBe('$1,430.80');
  });

  it('big totals keep their cents', () => {
    expect(val(run({ wattage: '1000000', hoursPerDay: '24' }), 'costPerPeriod')).toBe('$100,800.00');
  });

  it('rounds half-up on exact decimals ($1.005 -> $1.01)', () => {
    expect(val(run({ wattage: '1000', hoursPerDay: '1', days: '1', costPerKwh: '1.005' }), 'costPerPeriod')).toBe('$1.01');
  });

  it('standby claim in the text: 10 devices x 5 W for 24 h = 1.2 kWh/day, about $5/month at $0.14', () => {
    const r = run({ wattage: '5', hoursPerDay: '24', applianceCount: '10' });
    expect(val(r, 'kwhPerDay')).toBe('1.2 kWh');
    expect(val(r, 'costPerMonth')).toBe('$5.04');
    expect(val(r, 'costPerYear')).toBe('$61.32');
  });

  it('presets fill in only a blank wattage; a typed one wins', () => {
    expect(val(run({ preset: 'space-heater', wattage: '' }), 'costPerPeriod')).toBe('$25.20');
    expect(val(run({ preset: 'space-heater', wattage: '1000' }), 'costPerPeriod')).toBe('$16.80');
  });

  it('comparison only appears when a preset is actually close', () => {
    expect(val(run({}), 'equivalentNote')).toContain('Roughly equivalent');
    expect(val(run({ wattage: '90000' }), 'equivalentNote')).toBeUndefined();
  });

  it('rejects impossible or garbled input', () => {
    for (const bad of [
      { hoursPerDay: '25' },
      { hoursPerDay: '4h' },
      { wattage: 'abc' },
      { wattage: '-5' },
      { applianceCount: '2.5' },
      { applianceCount: '0' },
      { days: '0' },
      { costPerKwh: '-0.1' },
      { costPerKwh: 'cheap' },
    ]) {
      expect(run(bad)).toEqual([]);
    }
  });
});

describe('horsepower (Hale) audit', () => {
  const run = (o: Record<string, string>) =>
    horsepower.calculate({ mode: 'both', vehicleWeight: '3500', quarterMileET: '13.0', trapSpeed: '108', drivetrain: 'rwd', ...o }) as R;

  it('worked example in the text: 3,500 lb, 13.0 s at 108 mph', () => {
    const r = run({});
    expect(val(r, 'hpFromET')).toBe('314.9 HP');
    expect(val(r, 'hpFromSpeed')).toBe('344.1 HP');
    expect(val(r, 'estimatedHP')).toBe('329.5 HP');
    expect(val(r, 'wheelHP')).toBe('270.2 HP');
    expect(val(r, 'powerToWeight')).toBe('10.6 lbs/hp');
    expect(val(r, 'powerCategory')).toBe('Average'); // 10-12.5 lbs/hp
  });

  it('single-input modes use just that formula', () => {
    expect(val(run({ mode: 'et' }), 'estimatedHP')).toBe('314.9 HP');
    expect(val(run({ mode: 'speed' }), 'estimatedHP')).toBe('344.1 HP');
    expect(val(run({ mode: 'et', trapSpeed: 'junk' }), 'method')).toBe('ET-based');
  });

  it('absurd inputs give a message, not billions of horsepower', () => {
    for (const bad of [{ quarterMileET: '0.1' }, { quarterMileET: '90' }, { trapSpeed: '900' }, { vehicleWeight: '50' }]) {
      const r = run(bad);
      expect(r.map((x) => x.id)).toEqual(['error']);
    }
  });

  it('rejects junk', () => {
    expect(run({ vehicleWeight: '3500lbs' })).toEqual([]);
    expect(run({ quarterMileET: '13s' })).toEqual([]);
    expect(run({ trapSpeed: '' })).toEqual([]);
  });
});

describe('engine-horsepower audit', () => {
  const run = (o: Record<string, string>) =>
    engineHp.calculate({ unitSystem: 'imperial', showExplanation: 'no', torque: '400', rpm: '4000', ...o }) as R;

  it('400 lb-ft at 4,000 rpm = 304.6 hp = 227.17 kW; 350 lb-ft at 6,000 = 399.8 hp (the worked example)', () => {
    const a = run({});
    expect(val(a, 'horsepower')).toBe('304.6 HP');
    expect(val(a, 'powerKW')).toBe('227.17 kW');
    expect(val(run({ torque: '350', rpm: '6000' }), 'horsepower')).toBe('399.8 HP');
  });

  it('metric: 300 Nm at 6,000 rpm = 188.50 kW = 252.8 hp', () => {
    const r = run({ unitSystem: 'metric', torque: '300', rpm: '6000' });
    expect(val(r, 'powerKW')).toBe('188.50 kW');
    expect(val(r, 'horsepower')).toBe('252.8 HP');
  });

  it('torque equals hp at 33,000 / 2pi = 5,252.11 rpm', () => {
    const r = run({ torque: '300', rpm: '5252.1131' });
    expect(val(r, 'horsepower')).toBe('300.0 HP');
  });

  it('rejects junk and out-of-range rpm', () => {
    expect(run({ torque: '400 lb-ft' })).toEqual([]);
    expect(run({ rpm: '25000' })).toEqual([]);
    expect(run({ rpm: '0' })).toEqual([]);
    expect(run({ torque: 'Infinity' })).toEqual([]);
  });
});
