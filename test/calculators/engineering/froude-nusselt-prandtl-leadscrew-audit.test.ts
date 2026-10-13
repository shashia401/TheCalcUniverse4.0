import { describe, it, expect } from 'vitest';
import froude from '../../../src/calculators/engineering/froude-number';
import nusselt from '../../../src/calculators/engineering/nusselt-number';
import prandtl from '../../../src/calculators/engineering/prandtl-number';
import leadScrew from '../../../src/calculators/engineering/lead-screw';
import { getResult, getValue, parseNumber, near } from '../../helpers';

describe('froude-number audit (Fr = v / sqrt(g L))', () => {
  const run = (velocity: string, characteristicLength: string, gravity = '9.81') =>
    froude.calculate({ velocity, gravity, characteristicLength });
  it('worked examples: 2 m/s, 1.5 m -> 0.5214; 15 m/s, 0.3 m -> 8.744', () => {
    expect(getValue(run('2', '1.5'), 'froude')).toBe('0.5214');
    expect(getValue(run('15', '0.3'), 'froude')).toBe('8.744');
    expect(getValue(run('2', '1.5'), 'waveSpeed')).toBe('3.836 m/s');
  });
  it('hydraulic-jump energy loss at Fr 8.744 is ~69% (y2/y1 = 0.5(sqrt(1+8Fr^2)-1))', () => {
    const fr = 8.744;
    const r = 0.5 * (Math.sqrt(1 + 8 * fr * fr) - 1);
    expect(r).toBeCloseTo(11.87, 1);
    const loss = ((r - 1) ** 3 / (4 * r)) / (1 + (fr * fr) / 2);
    expect(loss).toBeCloseTo(0.69, 2);
  });
  it('regime thresholds on the displayed value (0.99996 -> shows 1 -> critical band)', () => {
    expect(getValue(run('3.13', '1', '9.81'), 'regime')).toMatch(/Critical|Subcritical, near/); // 3.13/3.1321=0.9993
    expect(getValue(run('0.5', '1'), 'regime')).toMatch(/^Subcritical \(tranquil\)/);
    expect(getValue(run('3.1321', '1'), 'froude')).toBe('1');
    expect(getValue(run('3.1321', '1'), 'regime')).toMatch(/^Critical/);
    expect(getValue(run('20', '1'), 'regime')).toMatch(/^Strongly supercritical/);
  });
  it('gravity changes Fr (Mars 3.71)', () => {
    near(parseNumber(getValue(run('5', '2', '3.71'), 'froude')), 5 / Math.sqrt(3.71 * 2), 1e-3);
  });
  it('invalid input returns []', () => {
    expect(run('', '1')).toEqual([]);
    expect(run('1', '0')).toEqual([]);
  });
});

describe('nusselt-number audit (Nu = hL/k)', () => {
  const run = (h: string, L: string, k: string) => nusselt.calculate({ heatTransferCoeff: h, characteristicLength: L, thermalConductivity: k });
  it('examples: 25*0.5/0.026 = 480.8; 8000*0.025/0.6 = 333.3', () => {
    expect(getValue(run('25', '0.5', '0.026'), 'nusselt')).toBe('480.8');
    expect(getValue(run('8000', '0.025', '0.6'), 'nusselt')).toBe('333.3');
  });
  it('Nu = 1 and Nu < 1 interpretations', () => {
    expect(getValue(run('6', '0.1', '0.6'), 'interpretation')).toMatch(/Nu = 1/);
    expect(getValue(run('1', '0.1', '0.6'), 'interpretation')).toMatch(/Nu < 1/);
  });
  it('invalid input returns []', () => {
    expect(run('0', '1', '1')).toEqual([]);
    expect(run('1', '', '1')).toEqual([]);
  });
});

describe('prandtl-number audit (Pr = mu cp / k)', () => {
  const run = (mu: string, cp: string, k: string) => prandtl.calculate({ dynamicViscosity: mu, specificHeat: cp, thermalConductivity: k });
  it('water 60 C = 2.988; air 300 C = 0.6952; water 20 C (0.001, 4184, 0.6) = 6.973', () => {
    expect(getValue(run('0.000467', '4184', '0.654'), 'prandtl')).toBe('2.988');
    expect(getValue(run('0.0000293', '1044', '0.044'), 'prandtl')).toBe('0.6952');
    expect(getValue(run('0.001', '4184', '0.6'), 'prandtl')).toBe('6.973');
  });
  it('categories: liquid metal / gas / water-like / viscous / very viscous', () => {
    const cat = (mu: string, cp: string, k: string) => getValue(run(mu, cp, k), 'category');
    expect(cat('0.00007', '1300', '80')).toMatch(/^Liquid metal/); // sodium-like, Pr ~0.001
    expect(cat('0.0000185', '1005', '0.026')).toMatch(/^Gas/);
    expect(cat('0.001', '4184', '0.6')).toMatch(/^Water-like/);
    expect(cat('0.1', '1900', '0.15')).toMatch(/^Very viscous/); // Pr ~ 1267
    expect(cat('0.005', '2000', '0.15')).toMatch(/^Viscous liquid/); // Pr 66.7
  });
  it('no placeholder "enter density" row', () => {
    expect(run('0.001', '4184', '0.6').some((r) => r.id === 'momentumDiffusivity')).toBe(false);
  });
  it('invalid input returns []', () => {
    expect(run('0', '4184', '0.6')).toEqual([]);
  });
});

describe('lead-screw audit (T = F p / (2 pi eta))', () => {
  const run = (axialForce: string, lead: string, efficiency: string, safetyFactor = '1.5') =>
    leadScrew.calculate({ axialForce, lead, efficiency, safetyFactor });
  it('3D printer bed: 49 N, 8 mm, 40% -> 0.156 N·m (0.234 with SF 1.5)', () => {
    const r = run('49', '0.008', '40');
    near(parseNumber(getValue(r, 'torque')), (49 * 0.008) / (2 * Math.PI * 0.4), 1e-3);
    near(parseNumber(getValue(r, 'torqueSF')), 0.234, 1e-3);
  });
  it('CNC: 800 N, 5 mm, 90% -> 0.7074 N·m (1.415 with SF 2)', () => {
    const r = run('800', '0.005', '90', '2');
    near(parseNumber(getValue(r, 'torque')), 0.7074, 1e-3);
    near(parseNumber(getValue(r, 'torqueSF')), 1.4147, 2e-3);
    expect(getResult(r, 'torqueSF').label).toBe('Torque with SF 2×');
  });
  it('mechanical advantage 2 pi eta / p: 2 mm, 40% -> 1,257', () => {
    expect(parseNumber(getValue(run('100', '0.002', '40'), 'mechAdv').replace(',', ''))).toBeCloseTo(1257, 0);
  });
  it('blank safety factor falls back to 1 and labels it so', () => {
    expect(getResult(run('100', '0.005', '50', ''), 'torqueSF').label).toBe('Torque with SF 1×');
  });
  it('power at 1 rev/s = T x 2 pi', () => {
    near(parseNumber(getValue(run('49', '0.008', '40'), 'power')), 0.156 * 2 * Math.PI, 0.01);
  });
  it('invalid input returns []', () => {
    expect(run('100', '0', '40')).toEqual([]);
    expect(run('100', '0.005', '0')).toEqual([]);
  });
});
