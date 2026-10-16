import { describe, it, expect } from 'vitest';
import cosines from '../../../src/calculators/math/law-of-cosines/index';
import sines from '../../../src/calculators/math/law-of-sines/index';
import triangle from '../../../src/calculators/math/triangle/index';
import { classify, solveSAS, solveSSA, solveSSS } from '../../../src/calculators/math/shared/triangle';
import { getValue } from '../../helpers';

// Oracle: sympy 1.14 (acos / asin / sin evaluated to 14 digits) and exact identities.
const LC = (v: Record<string, string>) => cosines.calculate(v);
const LS = (v: Record<string, string>) => sines.calculate(v);
const TR = (v: Record<string, string>) => triangle.calculate(v);

describe('law of cosines (audit)', () => {
  it('SSS 7-8-9: A = 48.18968510°, B = 58.41186449°, C = 73.39845040°', () => {
    const r = LC({ mode: 'sss', a: '7', b: '8', c: '9' });
    expect(getValue(r, 'angleA')).toBe('48.1896851°');
    expect(getValue(r, 'angleB')).toBe('58.41186449°');
    expect(getValue(r, 'angleC')).toBe('73.3984504°');
    expect(getValue(r, 'triangleType')).toBe('Scalene Acute');
  });
  it('SAS a=5, b=7, C=40°: c = 4.51407676 (A = 45.39634540°, B = 94.60365460°, obtuse)', () => {
    const r = LC({ mode: 'sas', a: '5', b: '7', angleC: '40' });
    // The old code's acos could not return an obtuse angle reliably; atan2 can: B > 90.
    expect(getValue(r, 'c')).toBe('4.51407676');
    expect(getValue(r, 'angleA')).toBe('45.3963454°');
    expect(getValue(r, 'angleB')).toBe('94.6036546°');
    expect(getValue(r, 'triangleType')).toBe('Scalene Obtuse');
  });
  it('right triangle 3-4-5 is classified Right and has exact 90°', () => {
    const r = LC({ mode: 'sss', a: '3', b: '4', c: '5' });
    expect(getValue(r, 'angleC')).toBe('90°');
    expect(getValue(r, 'triangleType')).toBe('Scalene Right');
    expect(getValue(LC({ mode: 'sas', a: '3', b: '4', angleC: '90' }), 'c')).toBe('5');
  });
  it('precision at tiny angles: SSS (1, 1, 1e-8) has C = 1e-8 rad = 5.72958e-7°, not 0 (acos gives 0 here)', () => {
    const r = LC({ mode: 'sss', a: '1', b: '1', c: '0.00000001' });
    expect(getValue(r, 'angleC')).toBe('5.72958e-7°');
    // SAS with a 1e-8 degree angle: c = 2 sin(C/2) = 1.74532925e-10 (the plain law of cosines cancels to 0)
    const s = LC({ mode: 'sas', a: '1', b: '1', angleC: '0.00000001' });
    expect(getValue(s, 'c')).toBe('1.74533e-10');
  });
  it('radians: SAS a=b=2, C = 1.0471975511965976 rad (60°) is equilateral with every angle π/3 = 1.04719755 rad', () => {
    const r = LC({ mode: 'sas', angleUnit: 'rad', a: '2', b: '2', angleC: '1.0471975511965976' });
    expect(getValue(r, 'c')).toBe('2');
    expect(getValue(r, 'angleA')).toBe('1.04719755 rad');
    expect(getValue(r, 'triangleType')).toBe('Equilateral Acute');
    // 180 in radian mode is far beyond π and must be rejected
    expect(getValue(LC({ mode: 'sas', angleUnit: 'rad', a: '2', b: '2', angleC: '3.2' }), 'triangleError')).toContain('less than 180');
  });
  it('invalid triangles explain themselves: 1-2-10, 1-2-3 (flat), SAS 200°', () => {
    expect(getValue(LC({ mode: 'sss', a: '1', b: '2', c: '10' }), 'triangleError')).toContain('cannot form a triangle');
    expect(getValue(LC({ mode: 'sss', a: '1', b: '2', c: '3' }), 'triangleError')).toContain('degenerate');
    expect(getValue(LC({ mode: 'sas', a: '3', b: '4', angleC: '200' }), 'triangleError')).toContain('less than 180');
    expect(LC({ mode: 'sss', a: '3abc', b: '4', c: '5' })).toEqual([]);
    expect(LC({ mode: 'sss', a: '-3', b: '4', c: '5' })).toEqual([]);
  });
});

describe('law of sines (audit)', () => {
  it('AAS: A=30°, B=70°, a=10 -> C=80°, b=18.79385242, c=19.69615506', () => {
    const r = LS({ sideA: '10', angleA: '30', angleB: '70' });
    expect(getValue(r, 'angleC')).toBe('80°');
    expect(getValue(r, 'sideB')).toBe('18.79385242');
    expect(getValue(r, 'sideC')).toBe('19.69615506');
    expect(getValue(r, 'triangleCount')).toBe('1');
  });
  it('ASA with the side between the angles', () => {
    const r = LS({ angleA: '30', angleB: '70', sideC: '19.69615506' });
    expect(getValue(r, 'sideA')).toBe('10');
  });
  it('SSA ambiguous case: a=6, A=30°, b=10 -> TWO triangles (sympy: B=56.44269024°/123.55730976°, c=11.97687883/5.34362925)', () => {
    const r = LS({ sideA: '6', angleA: '30', sideB: '10' });
    expect(getValue(r, 'triangleCount')).toMatch(/^2/);
    expect(getValue(r, 'angleB')).toBe('56.44269024°');
    expect(getValue(r, 'angleC')).toBe('93.55730976°');
    expect(getValue(r, 'sideC')).toBe('11.97687883');
    expect(getValue(r, 'angleB2')).toBe('123.55730976°');
    expect(getValue(r, 'angleC2')).toBe('26.44269024°');
    expect(getValue(r, 'sideC2')).toBe('5.34362925');
  });
  it('SSA no triangle: a=3, A=30°, b=10 (sin B = 1.667)', () => {
    expect(getValue(LS({ sideA: '3', angleA: '30', sideB: '10' }), 'triangleError')).toContain('No triangle');
  });
  it('SSA right triangle: a=5, A=30°, b=10 -> exactly one triangle with B = 90°, c = 8.66025404', () => {
    const r = LS({ sideA: '5', angleA: '30', sideB: '10' });
    expect(getValue(r, 'triangleCount')).toBe('1');
    expect(getValue(r, 'angleB')).toBe('90°');
    expect(getValue(r, 'sideC')).toBe('8.66025404');
  });
  it('SSA with the known angle opposite the longer side: a=10, A=40°, b=7 -> one triangle (B=26.74056117°, c=14.2928419)', () => {
    const r = LS({ sideA: '10', angleA: '40', sideB: '7' });
    expect(getValue(r, 'triangleCount')).toBe('1');
    expect(getValue(r, 'angleB')).toBe('26.74056117°');
    expect(getValue(r, 'sideC')).toBe('14.2928419');
  });
  it('inconsistent / impossible input is reported, not silently "fixed"', () => {
    expect(getValue(LS({ angleA: '100', angleB: '90', sideA: '5' }), 'triangleError')).toContain('less than 180');
    expect(getValue(LS({ angleA: '50', angleB: '60', angleC: '80', sideA: '5' }), 'triangleError')).toContain('add up to 190');
    expect(getValue(LS({ sideA: '10', angleA: '50', sideB: '11.918', angleB: '66', sideC: '8.793', angleC: '64' }), 'triangleError')).toContain('contradict');
    expect(getValue(LS({ sideA: '10', sideB: '15', angleC: '40' }), 'triangleError')).toContain('Law of Cosines');
    expect(LS({ sideA: '10', angleA: '30abc', sideB: '15' })).toEqual([]);
  });
  it('radians', () => {
    const r = LS({ angleUnit: 'rad', sideA: '10', angleA: '0.5235987755982988', angleB: '1.2217304763960306' });
    expect(getValue(r, 'angleC')).toBe('1.3962634 rad');
    expect(getValue(r, 'sideB')).toBe('18.79385242');
  });
});

describe('triangle calculator (audit)', () => {
  it('unrounded math: ASA 45°, c=10, 60° -> a = 8.97...; area from the exact sides (old code rounded a, b to 2 dp first)', () => {
    // sympy: a = 10 sin45/sin75 = 7.3205080757, b = 10 sin60/sin75 = 8.9658...
    const r = TR({ mode: 'asa', asaAngleA: '45', asaSideC: '10', asaAngleB: '60' });
    expect(getValue(r, 'sideALabel')).toBe('7.32050808');
    expect(getValue(r, 'sideBLabel')).toBe('8.96575472');
    // area = c² sinA sinB / (2 sin C) = 100·0.70710678·0.8660254/(2·0.96592583) = 31.69872981
    expect(getValue(r, 'area')).toBe('31.69872981 sq units');
  });
  it('AAS mode: 30°, 70°, a = 10 matches the law of sines', () => {
    const r = TR({ mode: 'aas', aasAngleA: '30', aasAngleB: '70', aasSideA: '10' });
    expect(getValue(r, 'sideBLabel')).toBe('18.79385242');
    expect(getValue(r, 'angleC')).toBe('80°');
  });
  it('SAS maps b, A (included), c to the third side a: b=5, A=60°, c=7 -> a = √39 = 6.244998', () => {
    const r = TR({ mode: 'sas', sasSideB: '5', sasAngleA: '60', sasSideC: '7' });
    expect(getValue(r, 'sideALabel')).toBe('6.244998');
    expect(getValue(r, 'angleA')).toBe('60°');
    expect(getValue(r, 'area')).toBe('15.15544457 sq units');
  });
  it('classification uses exact values: 3-4-5 Right, 5-5-5 Equilateral, 5-5-8 Isosceles Obtuse, 2-3-4 Scalene Obtuse', () => {
    expect(getValue(TR({ mode: 'sss', sideA: '3', sideB: '4', sideC: '5' }), 'triangleType')).toBe('Scalene Right');
    expect(getValue(TR({ mode: 'sss', sideA: '5', sideB: '5', sideC: '5' }), 'triangleType')).toBe('Equilateral Acute');
    expect(getValue(TR({ mode: 'sss', sideA: '5', sideB: '5', sideC: '8' }), 'triangleType')).toBe('Isosceles Obtuse');
    expect(getValue(TR({ mode: 'sss', sideA: '2', sideB: '3', sideC: '4' }), 'triangleType')).toBe('Scalene Obtuse');
    // 3-4-5.01 is obtuse by 0.0001 of c²... the old code rounded to 2 dp and called it Right
    expect(getValue(TR({ mode: 'sss', sideA: '3', sideB: '4', sideC: '5.001' }), 'triangleType')).toBe('Scalene Obtuse');
  });
  it('degrees vs radians and error messages', () => {
    const r = TR({ mode: 'sss', angleUnit: 'rad', sideA: '3', sideB: '4', sideC: '5' });
    expect(getValue(r, 'angleC')).toBe('1.57079633 rad');
    expect(getValue(TR({ mode: 'asa', asaAngleA: '100', asaSideC: '5', asaAngleB: '80' }), 'triangleError')).toContain('less than 180');
    expect(getValue(TR({ mode: 'sas', sasSideB: '5', sasAngleA: '180', sasSideC: '7' }), 'triangleError')).toContain('less than 180');
  });
});

describe('shared triangle solvers', () => {
  it('solveSSS returns null for degenerate and negative input, angle sum is 180', () => {
    expect(solveSSS(1, 2, 3)).toBeNull();
    expect(solveSSS(-1, 2, 2)).toBeNull();
    const t = solveSSS(13, 14, 15)!; // area 84
    expect(t.A + t.B + t.C).toBeCloseTo(180, 12);
    expect(0.5 * t.b * t.c * Math.sin((t.A * Math.PI) / 180)).toBeCloseTo(84, 10);
  });
  it('solveSAS: x=1, y=1, γ=120° -> z = √3', () => {
    expect(solveSAS(1, 1, 120)!.c).toBeCloseTo(Math.sqrt(3), 14);
  });
  it('solveSSA counts: sin X exactly 1 -> one right triangle; sin X slightly above 1 by rounding is tolerated', () => {
    const r = solveSSA(5, 30, 10);
    expect(r.kind === 'solutions' && r.triangles.length).toBe(1);
    expect(classify(solveSSS(3, 4, 5)!).byAngles).toBe('Right');
  });
});
