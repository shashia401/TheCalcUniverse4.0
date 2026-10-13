import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/basic-calc/index';
import { evaluateDisplay } from '../../../src/calculators/math/basic-calc/basicCalcMath';
import { getValue } from '../../helpers';

// Reference: Python/IEEE doubles rounded to 15 significant digits.
const ev = (e: string) => {
  const o = evaluateDisplay(e);
  return o.ok ? o.text : 'ERR';
};

describe('basic-calc: precedence, float noise, tiny values (audit)', () => {
  it('0.1 + 0.2 shows 0.3, not 0.30000000000000004', () => {
    expect(ev('0.1+0.2')).toBe('0.3');
    expect(getValue(config.calculate({ expression: '0.1+0.2' }), 'result')).toBe('0.3');
    expect(ev('0.3-0.1')).toBe('0.2');
    expect(ev('1.1*1.1')).toBe('1.21');
  });
  it('tiny results are not collapsed to 0 (toFixed(10) turned 1e-12 into 0)', () => {
    expect(ev('0.000001*0.000001')).toBe('1e-12');
    expect(ev('1/3')).toBe('0.333333333333333');
  });
  it('operator precedence and associativity', () => {
    expect(ev('2+3*4')).toBe('14');
    expect(ev('(2+3)*4')).toBe('20');
    expect(ev('10-4-3')).toBe('3'); // left-associative
    expect(ev('2*3/4')).toBe('1.5');
    expect(ev('100/10/5')).toBe('2');
    expect(ev('-3+5')).toBe('2');
    expect(ev('2*-3')).toBe('-6');
  });
  it('typographic operators from the keypad', () => {
    expect(ev('6×7')).toBe('42');
    expect(ev('15÷4')).toBe('3.75');
    expect(ev('10−4')).toBe('6');
  });
  it('percent divides by 100 (documented behaviour)', () => {
    expect(ev('15%*200')).toBe('30');
    expect(ev('50%')).toBe('0.5');
  });
  it('division by zero, garbage and overflow are errors, never Infinity/NaN', () => {
    for (const bad of ['1/0', '0/0', '2+', 'abc', '1.2.3', '(1+2', '9'.repeat(400)]) expect(ev(bad)).toBe('ERR');
    expect(config.calculate({ expression: '1/0' })[0].id).toBe('error');
  });
  it('-0 prints as 0', () => {
    expect(ev('0*-1')).toBe('0');
    expect(ev('-0')).toBe('0');
  });
  it('large results stay readable', () => {
    expect(ev('123456789*987654321')).toBe('121932631112635000'); // 15 significant digits of 121932631112635269
    expect(ev('1000000*1000000*1000000*1000000')).toBe('1e+24');
  });
});
