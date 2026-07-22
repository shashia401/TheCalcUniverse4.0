import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/engineering/gear-ratio/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Gear Ratio Calculator', () => {
  it('calculates output RPM from input RPM and gear ratio', () => {
    const results = config.calculate({
      mode: 'output',
      inputRPM: '1800',
      outputRPM: '',
      gearRatio: '3',
      inputTorque: '',
    });
    const rpm = parseNumber(getValue(results, 'outputRPM'));
    near(rpm, 600); // 1800 / 3 = 600
    expect(getValue(results, 'type')).toContain('Reduction');
  });

  it('calculates output torque when input torque is provided', () => {
    const results = config.calculate({
      mode: 'output',
      inputRPM: '1800',
      outputRPM: '',
      gearRatio: '3',
      inputTorque: '100',
    });
    const torque = parseNumber(getValue(results, 'outputTorque'));
    near(torque, 285); // 100 * 3 * 0.95 = 285
  });

  it('calculates gear ratio from input and output RPM', () => {
    const results = config.calculate({
      mode: 'ratio',
      inputRPM: '1800',
      outputRPM: '600',
      gearRatio: '',
      inputTorque: '',
    });
    const ratio = parseNumber(getValue(results, 'ratio'));
    near(ratio, 3);
  });

  it('calculates required input RPM from ratio and output RPM', () => {
    const results = config.calculate({
      mode: 'input_rpm',
      inputRPM: '',
      outputRPM: '600',
      gearRatio: '3',
      inputTorque: '',
    });
    const rpm = parseNumber(getValue(results, 'inputRPM'));
    near(rpm, 1800); // 600 * 3 = 1800
  });

  it('identifies speed increase when ratio is less than 1', () => {
    const results = config.calculate({
      mode: 'output',
      inputRPM: '1800',
      outputRPM: '',
      gearRatio: '0.5',
      inputTorque: '',
    });
    expect(getValue(results, 'type')).toContain('Speed Increase');
  });

  it('returns empty for missing required inputs', () => {
    const results = config.calculate({
      mode: 'output',
      inputRPM: '',
      outputRPM: '',
      gearRatio: '',
      inputTorque: '',
    });
    expect(results).toEqual([]);
  });

  it('returns empty for zero gear ratio', () => {
    const results = config.calculate({
      mode: 'output',
      inputRPM: '1800',
      outputRPM: '',
      gearRatio: '0',
      inputTorque: '',
    });
    expect(results).toEqual([]);
  });

  it('identifies 1:1 direct drive', () => {
    const results = config.calculate({
      mode: 'ratio',
      inputRPM: '1000',
      outputRPM: '1000',
      gearRatio: '',
      inputTorque: '',
    });
    expect(getValue(results, 'type')).toContain('Direct Drive');
  });

  it('identifies overdrive when output is faster than input', () => {
    const results = config.calculate({
      mode: 'ratio',
      inputRPM: '1000',
      outputRPM: '2000',
      gearRatio: '',
      inputTorque: '',
    });
    expect(getValue(results, 'type')).toContain('Overdrive');
  });

  it('calculates required input RPM with fractional gear ratio', () => {
    const results = config.calculate({
      mode: 'input_rpm',
      inputRPM: '',
      outputRPM: '300',
      gearRatio: '2.5',
      inputTorque: '',
    });
    const rpm = parseNumber(getValue(results, 'inputRPM'));
    near(rpm, 750); // 300 * 2.5 = 750
  });
});
