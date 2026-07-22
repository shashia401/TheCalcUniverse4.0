import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/everyday/bpm-tapper/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('BPM Tapper / Delay Time Calculator', () => {
  it('120 BPM quarter note = 500 ms', () => {
    const results = config.calculate({
      bpm: '120',
      mode: 'bpm-to-ms',
      noteValue: 'quarter',
    });
    const delay = parseNumber(getValue(results, 'delayMs'));
    near(delay, 500);
  });

  it('120 BPM eighth note = 250 ms', () => {
    const results = config.calculate({
      bpm: '120',
      mode: 'bpm-to-ms',
      noteValue: 'eighth',
    });
    const delay = parseNumber(getValue(results, 'delayMs'));
    near(delay, 250);
  });

  it('140 BPM quarter note = 428.57 ms', () => {
    const results = config.calculate({
      bpm: '140',
      mode: 'bpm-to-ms',
      noteValue: 'quarter',
    });
    const delay = parseNumber(getValue(results, 'delayMs'));
    near(delay, 428.57, 0.01);
  });

  it('reverse: 500 ms quarter note = 120 BPM', () => {
    const results = config.calculate({
      targetMs: '500',
      mode: 'ms-to-bpm',
      noteValue: 'quarter',
    });
    const bpm = parseNumber(getValue(results, 'calculatedBpm'));
    near(bpm, 120);
  });

  it('returns empty array when BPM is empty', () => {
    const results = config.calculate({
      bpm: '',
      mode: 'bpm-to-ms',
      noteValue: 'quarter',
    });
    expect(results).toEqual([]);
  });

  it('returns empty array when BPM is zero', () => {
    const results = config.calculate({
      bpm: '0',
      mode: 'bpm-to-ms',
      noteValue: 'quarter',
    });
    expect(results).toEqual([]);
  });

  it('returns empty array when targetMs is empty in ms-to-bpm mode', () => {
    const results = config.calculate({
      targetMs: '',
      mode: 'ms-to-bpm',
      noteValue: 'quarter',
    });
    expect(results).toEqual([]);
  });

  it('shows frequency Hz in results', () => {
    const results = config.calculate({
      bpm: '120',
      mode: 'bpm-to-ms',
      noteValue: 'quarter',
    });
    const hz = parseNumber(getValue(results, 'frequencyHz'));
    near(hz, 2); // 1000/500 = 2 Hz
  });

  it('includes note value table entries for all note divisions', () => {
    const results = config.calculate({
      bpm: '120',
      mode: 'bpm-to-ms',
      noteValue: 'quarter',
    });
    const ids = results.map((r) => r.id);
    expect(ids).toContain('note-whole');
    expect(ids).toContain('note-half');
    expect(ids).toContain('note-quarter');
    expect(ids).toContain('note-eighth');
    expect(ids).toContain('note-sixteenth');
    expect(ids).toContain('note-dotted-quarter');
    expect(ids).toContain('note-dotted-eighth');
    expect(ids).toContain('note-quarter-triplet');
  });

  it('dotted quarter note at 120 BPM is 750 ms', () => {
    const results = config.calculate({
      bpm: '120',
      mode: 'bpm-to-ms',
      noteValue: 'dotted-quarter',
    });
    const delay = parseNumber(getValue(results, 'delayMs'));
    near(delay, 750);
  });
});
