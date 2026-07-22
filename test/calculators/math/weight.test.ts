import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/weight/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Weight Calculator', () => {
  // ─── calcWeight mode ─────────────────────────────────────
  it('calcWeight: 70 kg on Earth = 686.7 N', () => {
    const r = config.calculate({ mode: 'calcWeight', mass: '70', massUnit: 'kg', gravitySelect: 'Earth' });
    near(parseNumber(getValue(r, 'result')), 686.7, 0.1);
    expect(getValue(r, 'result')).toContain('N');
  });

  it('calcWeight: shows lbf conversion', () => {
    const r = config.calculate({ mode: 'calcWeight', mass: '70', massUnit: 'kg', gravitySelect: 'Earth' });
    near(parseNumber(getValue(r, 'weightLbf')), 154.3, 0.5);
    expect(getValue(r, 'weightLbf')).toContain('lbf');
  });

  it('calcWeight: shows mass in kg', () => {
    const r = config.calculate({ mode: 'calcWeight', mass: '70', massUnit: 'kg', gravitySelect: 'Earth' });
    expect(getValue(r, 'massKg')).toContain('70');
  });

  it('calcWeight: 70 kg on Moon = 113.4 N', () => {
    const r = config.calculate({ mode: 'calcWeight', mass: '70', massUnit: 'kg', gravitySelect: 'Moon' });
    near(parseNumber(getValue(r, 'result')), 113.4, 0.1);
  });

  it('calcWeight: 70 kg on Jupiter = 1735.3 N', () => {
    const r = config.calculate({ mode: 'calcWeight', mass: '70', massUnit: 'kg', gravitySelect: 'Jupiter' });
    near(parseNumber(getValue(r, 'result')), 1735.3, 0.5);
  });

  it('calcWeight: custom gravity value', () => {
    const r = config.calculate({ mode: 'calcWeight', mass: '10', massUnit: 'kg', gravitySelect: 'custom', gravityCustom: '5' });
    near(parseNumber(getValue(r, 'result')), 50);
  });

  it('calcWeight: mass in g converts correctly', () => {
    const r = config.calculate({ mode: 'calcWeight', mass: '70000', massUnit: 'g', gravitySelect: 'Earth' });
    near(parseNumber(getValue(r, 'result')), 686.7, 0.1);
  });

  it('calcWeight: returns empty for no mass', () => {
    const r = config.calculate({ mode: 'calcWeight', mass: '', massUnit: 'kg', gravitySelect: 'Earth' });
    expect(r).toEqual([]);
  });

  it('calcWeight: shows formula W = m × g', () => {
    const r = config.calculate({ mode: 'calcWeight', mass: '10', massUnit: 'kg', gravitySelect: 'Earth' });
    expect(getValue(r, 'formula')).toContain('W = m × g');
  });

  // ─── calcMass mode ───────────────────────────────────────
  it('calcMass: 686.7 N on Earth = 70 kg', () => {
    const r = config.calculate({ mode: 'calcMass', weight: '686.7', gravitySelect: 'Earth' });
    near(parseNumber(getValue(r, 'result')), 70, 0.1);
    expect(getValue(r, 'result')).toContain('kg');
  });

  it('calcMass: shows formula m = W / g', () => {
    const r = config.calculate({ mode: 'calcMass', weight: '100', gravitySelect: 'Earth' });
    expect(getValue(r, 'formula')).toContain('m = W / g');
  });

  // ─── calcGravity mode ────────────────────────────────────
  it('calcGravity: 686.7 N on 70 kg = 9.81 m/s²', () => {
    const r = config.calculate({ mode: 'calcGravity', mass: '70', massUnit: 'kg', weight: '686.7' });
    near(parseNumber(getValue(r, 'result')), 9.81, 0.01);
    expect(getValue(r, 'result')).toContain('m/s²');
  });

  it('calcGravity: shows formula g = W / m', () => {
    const r = config.calculate({ mode: 'calcGravity', mass: '70', massUnit: 'kg', weight: '686.7' });
    expect(getValue(r, 'formula')).toContain('g = W / m');
  });

  // ─── Human comparison ────────────────────────────────────
  it('shows human weight comparison for ~70kg on Earth', () => {
    const r = config.calculate({ mode: 'calcWeight', mass: '70', massUnit: 'kg', gravitySelect: 'Earth' });
    const comp = getValue(r, 'humanComparison');
    expect(comp).toContain('70 kg');
    expect(comp).toContain('Earth');
  });

  it('does not show human comparison for out-of-range mass', () => {
    const r = config.calculate({ mode: 'calcWeight', mass: '5000', massUnit: 'kg', gravitySelect: 'Earth' });
    expect(r.find(x => x.id === 'humanComparison')).toBeUndefined();
  });

  // ─── Planet weight results ───────────────────────────────
  it('shows weight on Moon, Mars, Jupiter, Sun', () => {
    const r = config.calculate({ mode: 'calcWeight', mass: '70', massUnit: 'kg', gravitySelect: 'Earth' });
    expect(r.find(x => x.id === 'moonWeight')).toBeDefined();
    expect(r.find(x => x.id === 'marsWeight')).toBeDefined();
    expect(r.find(x => x.id === 'jupiterWeight')).toBeDefined();
    expect(r.find(x => x.id === 'sunWeight')).toBeDefined();
  });

  it('planet weights show correct values', () => {
    const r = config.calculate({ mode: 'calcWeight', mass: '70', massUnit: 'kg', gravitySelect: 'Earth' });
    near(parseNumber(getValue(r, 'moonWeight')), 113.4, 0.5);
    near(parseNumber(getValue(r, 'marsWeight')), 259.7, 0.5);
    near(parseNumber(getValue(r, 'jupiterWeight')), 1735.3, 0.5);
    near(parseNumber(getValue(r, 'sunWeight')), 19180, 10);
  });

  it('calcWeight: 70 kg on Sun = 19,180 N', () => {
    const r = config.calculate({ mode: 'calcWeight', mass: '70', massUnit: 'kg', gravitySelect: 'Sun' });
    near(parseNumber(getValue(r, 'result')), 19180, 10);
  });

  it('calcMass: mass in g and lb outputs', () => {
    const r = config.calculate({ mode: 'calcMass', weight: '686.7', gravitySelect: 'Earth' });
    expect(r.find((x: { id: string }) => x.id === 'massG')).toBeDefined();
    expect(r.find((x: { id: string }) => x.id === 'massLb')).toBeDefined();
  });

  it('calcGravity: returns error for zero mass', () => {
    const r = config.calculate({ mode: 'calcGravity', mass: '0', massUnit: 'kg', weight: '686.7' });
    expect(getValue(r, 'error')).toContain('greater than 0');
  });

  it('highlighted result has positive color', () => {
    const r = config.calculate({ mode: 'calcWeight', mass: '70', massUnit: 'kg', gravitySelect: 'Earth' });
    const highlighted = r.find((x: { id: string; highlight?: boolean; color?: string }) => x.id === 'result');
    expect(highlighted?.highlight).toBe(true);
    expect(highlighted?.color).toBe('positive');
  });

  it('educational content has workedExamples', () => {
    expect(config.educational.workedExamples).toBeDefined();
    expect(config.educational.workedExamples!.length).toBeGreaterThanOrEqual(3);
  });

  it('educational content has 5+ FAQs', () => {
    expect(config.educational.faqs).toBeDefined();
    expect(config.educational.faqs!.length).toBeGreaterThanOrEqual(5);
  });

  it('educational content has proTips', () => {
    expect(config.educational.proTips).toBeDefined();
    expect(config.educational.proTips!.length).toBeGreaterThanOrEqual(3);
  });

  it('educational content has limitations', () => {
    expect(config.educational.limitations).toBeDefined();
    expect(config.educational.limitations!.length).toBeGreaterThanOrEqual(3);
  });

  it('educational content has quickReference', () => {
    expect(config.educational.quickReference).toBeDefined();
    expect(config.educational.quickReference!.length).toBeGreaterThanOrEqual(5);
  });

  it('number inputs have inputMode decimal', () => {
    const numInputs = config.inputs.filter((i: { type: string }) => i.type === 'number');
    expect(numInputs.length).toBeGreaterThan(0);
    for (const inp of numInputs) {
      expect((inp as { inputMode?: string }).inputMode).toBe('decimal');
    }
  });
});
