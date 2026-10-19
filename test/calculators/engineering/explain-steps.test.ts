import { describe, it, expect } from 'vitest';
import type { CalculatorConfig, ExplainStep } from '../../../src/types/calculator';
import { rangeErrors, seedDefaults } from '../../../src/lib/initialForm';
import ohms from '../../../src/calculators/engineering/ohms-law';
import ph from '../../../src/calculators/engineering/ph-calculator';
import buffer from '../../../src/calculators/engineering/buffer-capacity';
import flow from '../../../src/calculators/engineering/flow-rate';
import freezing from '../../../src/calculators/engineering/freezing-point-depression';
import froude from '../../../src/calculators/engineering/froude-number';
import gear from '../../../src/calculators/engineering/gear-ratio';
import leadScrew from '../../../src/calculators/engineering/lead-screw';
import mtbf from '../../../src/calculators/engineering/mtbf';
import nusselt from '../../../src/calculators/engineering/nusselt-number';
import prandtl from '../../../src/calculators/engineering/prandtl-number';
import rateLimit from '../../../src/calculators/engineering/rate-limit';
import voltageDrop from '../../../src/calculators/engineering/voltage-drop';
import wireGauge from '../../../src/calculators/engineering/wire-gauge';

// Oracle: every pinned number below was computed independently in Python's decimal module (50-digit precision,
// ROUND_HALF_UP, `python -I`), not by running the calculators.
// Deliberately without steps: ai-token-pricing (its price table is volatile vendor data), cookie-consent and
// crypto-hash (code generators / hashing, not formula-driven).

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

const ALL: [string, CalculatorConfig][] = [
  ['ohms-law', ohms], ['ph-calculator', ph], ['buffer-capacity', buffer], ['flow-rate', flow],
  ['freezing-point-depression', freezing], ['froude-number', froude], ['gear-ratio', gear], ['lead-screw', leadScrew],
  ['mtbf', mtbf], ['nusselt-number', nusselt], ['prandtl-number', prandtl], ['rate-limit', rateLimit],
  ['voltage-drop', voltageDrop], ['wire-gauge', wireGauge],
];

describe('engineering explainSteps - default values give a worked solution that matches the calculator', () => {
  for (const [name, config] of ALL) {
    it(name, () => {
      const v = seedDefaults(config.inputs);
      if (config.calculate(v).length === 0) return;
      const s = steps(config, v);
      expect(s.length).toBeGreaterThanOrEqual(1);
      expect(s.length).toBeLessThanOrEqual(7);
    });
  }
});

describe('engineering explainSteps - blank, invalid and runaway input never print NaN/Infinity', () => {
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

describe('ohms-law explainSteps', () => {
  it('voltage from I and R', () => {
    expectSteps(ohms, { solveFor: 'voltage', current: '2', resistance: '6' }, [
      ['V = I × R'], ['V = 2 A × 6 Ω = 12 V'], ['P = I² × R = (2)² × 6 = 24 W'],
    ]);
  });
  it('current from V and R', () => {
    expectSteps(ohms, { solveFor: 'current', voltage: '12', resistance: '240' }, [
      ['I = V ÷ R'], ['I = 12 V ÷ 240 Ω = 0.05 A'], ['P = V² ÷ R = (12)² ÷ 240 = 0.6 W'],
    ]);
  });
  it('resistance from V and I', () => {
    expectSteps(ohms, { solveFor: 'resistance', voltage: '120', current: '0.5' }, [
      ['R = V ÷ I'], ['R = 120 V ÷ 0.5 A = 240 Ω'], ['P = V × I = 120 × 0.5 = 60 W'],
    ]);
  });
  it('power from V and I, with the load resistance', () => {
    expectSteps(ohms, { solveFor: 'power', voltage: '12', current: '3' }, [
      ['P = V × I'], ['P = 12 V × 3 A = 36 W'], ['R = V ÷ I = 12 ÷ 3 = 4 Ω'],
    ]);
  });
  it('zero current: power is 0 W and no resistance step', () => {
    expectSteps(ohms, { solveFor: 'power', voltage: '12', current: '0' }, [['P = V × I'], ['P = 12 V × 0 A = 0 W']]);
  });
  it('divide-by-zero cases are empty', () => {
    expect(steps(ohms, { solveFor: 'current', voltage: '12', resistance: '0' })).toEqual([]);
    expect(steps(ohms, { solveFor: 'resistance', voltage: '12', current: '0' })).toEqual([]);
  });
});

describe('ph-calculator explainSteps', () => {
  it('pH to concentrations', () => {
    expectSteps(ph, { mode: 'ph-to-conc', ph: '3.5' }, [
      ['[H⁺] = 10^(−pH) = 10^(−3.50) = 3.16 × 10⁻⁴ M'], ['pOH = 14 − 3.50 = 10.50'], ['[OH⁻] = 10^(−10.50) = 3.16 × 10⁻¹¹ M'], ['pH 3.50 → Acidic'],
    ]);
  });
  it('[H+] to pH', () => {
    expectSteps(ph, { mode: 'h-to-ph', hConcentration: '0.00001' }, [
      ['pH = −log₁₀(1.00 × 10⁻⁵ M) = 5.00'], ['pOH = 14 − 5.00 = 9.00'], ['[OH⁻] = 10^(−9.00) = 1.00 × 10⁻⁹ M'], ['pH 5.00 → Acidic'],
    ]);
  });
  it('[OH-] to pOH', () => {
    expectSteps(ph, { mode: 'oh-to-poh', ohConcentration: '0.001' }, [
      ['pOH = −log₁₀(1.00 × 10⁻³ M) = 3.00'], ['pH = 14 − 3.00 = 11.00'], ['[H⁺] = 10^(−11.00) = 1.00 × 10⁻¹¹ M'], ['pH 11.00 → Basic'],
    ]);
  });
  it('out-of-range input is empty', () => {
    expect(steps(ph, { mode: 'ph-to-conc', ph: '15' })).toEqual([]);
    expect(steps(ph, { mode: 'h-to-ph', hConcentration: '0' })).toEqual([]);
  });
});

describe('buffer-capacity explainSteps', () => {
  it('pH = pKa gives the maximum capacity C x ln10 / 4', () => {
    expectSteps(buffer, { pKa: '4.76', pH: '4.76', concentration: '0.1' }, [
      ['Ka = 10^(−4.76) = 1.738e-5', '[H⁺] = 10^(−4.76) = 1.738e-5 M', '[OH⁻] = 1e−14 ÷ [H⁺] = 5.754e-10 M'],
      ['= 2.500e-2'],
      ['β = 2.3026 × (1.738e-5 + 5.754e-10 + 2.500e-2) = 0.0576 mol/L·pH'],
      ['= 50.0% base / 50.0% acid'],
    ]);
  });
});

describe('flow-rate explainSteps', () => {
  it('velocity from diameter and flow', () => {
    expectSteps(flow, { mode: 'velocity', pipeDiameter: '2', flowRate: '50' }, [
      ['A = π × (2 in ÷ 12 ÷ 2)² = 0.021817 ft² (3.1416 in²)'],
      ['50 GPM ÷ 448.83 = 0.111401 ft³/s'],
      ['v = 0.111401 ÷ 0.021817 = 5.1062 ft/s (1.5564 m/s)'],
    ]);
  });
  it('flow rate from diameter and velocity', () => {
    expectSteps(flow, { mode: 'flowrate', pipeDiameter: '2', velocity: '5' }, [
      ['0.021817 ft²'],
      ['Q = 0.021817 ft² × 5 ft/s = 0.109083 ft³/s'],
      ['0.109083 × 448.83 = 48.9598 GPM (185.3328 L/min)'],
    ]);
  });
  it('diameter from flow and velocity', () => {
    expectSteps(flow, { mode: 'diameter', flowRate: '100', velocity: '8' }, [
      ['100 GPM ÷ 448.83 = 0.222802 ft³/s'],
      ['A = 0.222802 ÷ 8 = 0.02785 ft² (4.0104 in²)'],
      ['= 2.2597 inches'],
    ]);
  });
});

describe('freezing-point-depression explainSteps', () => {
  it('given molality and van t Hoff factor', () => {
    expectSteps(freezing, { kf: '1.86', molality: '1', vanthoff: '2' }, [
      ['ΔTf = Kf × m × i = 1.86 × 1 × 2 = 3.72°C'], ['0°C − 3.72°C = -3.72°C'],
    ]);
  });
  it('masses override the molality field', () => {
    expectSteps(freezing, { kf: '1.86', molality: '9', vanthoff: '2', soluteMass: '10', solventMass: '500', molarMass: '58.44' }, [
      ['10 g ÷ 58.44 g/mol = 0.1711 mol'],
      ['0.1711 mol ÷ (500 g ÷ 1000) = 0.3422 mol/kg'],
      ['1.86 × 0.3422 × 2 = 1.273°C'],
      ['0°C − 1.273°C = -1.273°C'],
    ]);
  });
});

describe('froude-number explainSteps', () => {
  it('subcritical flow', () => {
    expectSteps(froude, { velocity: '3', gravity: '9.81', characteristicLength: '2' }, [
      ['c = √(g × L) = √(9.81 × 2) = 4.429 m/s'], ['Fr = 3 ÷ 4.429 = 0.6773'], ['Fr < 1 → subcritical (tranquil)'],
    ]);
  });
  it('supercritical flow', () => {
    // v = 8, c = 4.4294 -> Fr = 1.8061
    const out = exprs(froude, { velocity: '8', gravity: '9.81', characteristicLength: '2' });
    expect(out[1]).toContain('Fr = 8 ÷ 4.429 = 1.806');
    expect(out[2]).toContain('supercritical (rapid)');
  });
});

describe('gear-ratio explainSteps', () => {
  it('output speed and torque at the default 95% efficiency', () => {
    expectSteps(gear, { mode: 'output', inputRPM: '1750', gearRatio: '5', inputTorque: '10', efficiency: '' }, [
      ['1750 RPM ÷ 5 = 350 RPM'], ['T_out = 10 N·m × 5 × 95% = 47.5 N·m'],
    ]);
  });
  it('gear ratio from two speeds', () => {
    expectSteps(gear, { mode: 'ratio', inputRPM: '1750', outputRPM: '350' }, [['1750 ÷ 350 = 5:1']]);
  });
  it('required input speed', () => {
    expectSteps(gear, { mode: 'input_rpm', outputRPM: '350', gearRatio: '5' }, [['350 RPM × 5 = 1750 RPM']]);
  });
});

describe('lead-screw explainSteps', () => {
  it('torque, safety factor, mechanical advantage and power', () => {
    expectSteps(leadScrew, { axialForce: '1000', lead: '0.005', efficiency: '30', safetyFactor: '2' }, [
      ['(1000 N × 0.005 m) ÷ (2π × 0.3) = 2.6526 N·m'],
      ['2.6526 N·m × 2 = 5.3052 N·m'],
      ['2π × 0.3 ÷ 0.005 = 376.9911 : 1'],
      ['2.6526 × 2π = 16.6667 W'],
    ]);
  });
});

describe('mtbf explainSteps', () => {
  it('MTBF from failures', () => {
    expectSteps(mtbf, { mode: 'mtbf', operatingHours: '10000', numberOfFailures: '4' }, [
      ['10000 h ÷ 4 = 2500 hours'], ['λ = 1 ÷ 2500 = 4.0000e-4 failures/hr'], ['R = e^(−8760 ÷ 2500) = 3.01%'],
    ]);
  });
  it('reliability at a mission time', () => {
    expectSteps(mtbf, { mode: 'reliability', mtbf: '2500', missionTime: '500' }, [
      ['λ = 1 ÷ 2500 = 4.0000e-4 /hr'], ['R = e^(−500 ÷ 2500) = 81.8731%'], ['100% − 81.8731% = 18.1269%'],
    ]);
  });
  it('expected failures', () => {
    expectSteps(mtbf, { mode: 'failures', mtbf: '2500', missionTime: '8760' }, [['8760 ÷ 2500 = 3.50']]);
  });
});

describe('nusselt and prandtl explainSteps', () => {
  it('nusselt number', () => {
    expectSteps(nusselt, { heatTransferCoeff: '25', characteristicLength: '0.1', thermalConductivity: '0.6' }, [
      ['h × L = 25 × 0.1 = 2.5 W/m·K'], ['Nu = 2.5 ÷ 0.6 = 4.167'], ['Nu = 4.167 > 1'],
    ]);
  });
  it('nusselt below 1', () => {
    expect(exprs(nusselt, { heatTransferCoeff: '1', characteristicLength: '0.1', thermalConductivity: '1' })[2]).toContain('Nu = 0.1 < 1');
  });
  it('prandtl number of water', () => {
    expectSteps(prandtl, { dynamicViscosity: '0.001', specificHeat: '4186', thermalConductivity: '0.6' }, [
      ['μ × cp = 0.001 × 4186 = 4.186'], ['Pr = 4.186 ÷ 0.6 = 6.977'], ['1 ≤ Pr < 10'],
    ]);
  });
});

describe('rate-limit explainSteps', () => {
  it('throughput, bandwidth and monthly transfer', () => {
    expectSteps(rateLimit, { maxRpm: '600', avgPayloadSize: '50', peakConcurrentUsers: '20', burstRpm: '' }, [
      ['600 RPM ÷ 60 = 10 req/s'],
      ['10 req/s × 50 KB = 500 KB/s'],
      ['500 KB/s × 1024 bytes × 8 bits ÷ 1000000 = 4.1 Mbps'],
      ['500 KB/s × 1024 × 86400 s × 30 ÷ 10¹² = 1.33 TB'],
      ['600 × 60 × 24 = 864000 req/day'],
      ['600 RPM ÷ 20 users = 30.00 RPM/user'],
    ]);
  });
  it('no concurrent users drops the per-user step', () => {
    expect(steps(rateLimit, { maxRpm: '600', avgPayloadSize: '50', peakConcurrentUsers: '' })).toHaveLength(5);
  });
});

describe('voltage-drop explainSteps', () => {
  it('12 AWG copper, 100 ft at 15 A on 120 V', () => {
    expectSteps(voltageDrop, { voltage: '120', current: '15', wireLength: '100', wireGauge: '12', conductorMaterial: 'copper' }, [
      ['12 AWG copper = 1.98 Ω per 1000 ft'],
      ['(1.98 ÷ 1000) × (100 ft × 2) = 0.3960 Ω'],
      ['15 A × 0.3960 Ω = 5.940 V', '5.940 ÷ 120 = 4.95%'],
      ['120 V − 5.940 V = 114.06 V'],
      ['P = I² × R = 15² × 0.3960 = 89.10 W (4.95% of total)'],
    ]);
  });
  it('the hypothetical 14 AWG aluminum row uses the labelled estimate', () => {
    // 3.14 x 3.25 / 1.98 = 5.15404
    const out = exprs(voltageDrop, { voltage: '120', current: '10', wireLength: '50', wireGauge: '14', conductorMaterial: 'aluminum' });
    expect(out[0]).toContain('14 AWG aluminum = 5.154 Ω per 1000 ft');
  });
});

describe('wire-gauge explainSteps', () => {
  const base = { current: '40', loadType: 'continuous', conductorMaterial: 'copper', insulationType: '75', numConductors: '1' };
  it('continuous load is sized at 125%', () => {
    expectSteps(wireGauge, base, [
      ['40 A × 1.25 = 50 A'], ['50 A ÷ 1 = 50.0 A'], ['8 AWG is rated 50 A ≥ 50.0 A'],
    ]);
  });
  it('more than three conductors in the conduit derate the wire', () => {
    expectSteps(wireGauge, { ...base, numConductors: '4' }, [
      ['40 A × 1.25 = 50 A'], ['50 A ÷ 0.8 = 62.5 A'], ['6 AWG is rated 65 A ≥ 62.5 A'],
    ]);
  });
  it('small-conductor overcurrent limit bumps 12 AWG up to 10 AWG', () => {
    expectSteps(wireGauge, { current: '25', loadType: 'normal', conductorMaterial: 'copper', insulationType: '75', numConductors: '1' }, [
      ['25 A (not a continuous load'], ['25 A ÷ 1 = 25.0 A'], ['12 AWG is rated 25 A ≥ 25.0 A'],
      ['12 AWG copper is limited to 20 A of protection, below your 25 A, so step up to 10 AWG (35 A)'],
    ]);
  });
  it('aluminum uses the aluminum table', () => {
    expect(exprs(wireGauge, { ...base, conductorMaterial: 'aluminum', loadType: 'normal' })[2]).toContain('8 AWG is rated 40 A ≥ 40.0 A');
  });
  it('oversize loads beyond 4/0 return no steps', () => {
    expect(steps(wireGauge, { ...base, current: '900' })).toEqual([]);
  });
});
