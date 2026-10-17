import { describe, it, expect } from 'vitest';
import bandwidth, { formatTime } from '../../../src/calculators/math/bandwidth';
import edpi from '../../../src/calculators/math/edpi';

// Expected values recomputed independently in Python.
type R = { id: string; value: string }[];
const val = (r: R, id: string) => r.find((x) => x.id === id)?.value;

describe('bandwidth audit', () => {
  const run = (o: Record<string, string>) =>
    bandwidth.calculate({ fileSize: '25', fileSizeUnit: 'GB', connectionSpeed: '100', speedUnit: 'Mbps', tcpOverhead: 'No', ...o }) as R;

  it('25 GB at 100 Mbps is 2,000 s (33m 20s); with the 10% overhead option 2,222 s (37m 2s) - the worked example', () => {
    expect(val(run({}), 'Transfer Time')).toBe('33m 20s');
    expect(val(run({}), 'Transfer Time (seconds)')).toBe('2000.00');
    expect(val(run({ tcpOverhead: 'Yes' }), 'Transfer Time')).toBe('37m 2s');
    expect(val(run({ tcpOverhead: 'Yes' }), 'Effective Speed (Mbps)')).toBe('90.00');
  });

  it('1 GB at 1 Gbps takes 8 s; 100 Mbps is 12.5 MB/s', () => {
    expect(val(run({ fileSize: '1', connectionSpeed: '1', speedUnit: 'Gbps' }), 'Transfer Time')).toBe('8s');
    expect(val(run({}), 'Connection Speed (MB/s)')).toBe('12.50');
  });

  it('formatTime never prints 60 seconds, and handles days', () => {
    expect(formatTime(119.6)).toBe('2m 0s'); // was "1m 60s"
    expect(formatTime(59.5)).toBe('1m 0s');
    expect(formatTime(3599.6)).toBe('1h 0m 0s');
    expect(formatTime(4_000_000)).toBe('46d 7h 6m 40s');
    expect(val(run({ fileSize: '5', fileSizeUnit: 'TB', connectionSpeed: '10' }), 'Transfer Time')).toBe('46d 7h 6m 40s');
  });

  it('rejects junk and absurd values', () => {
    for (const bad of [{ fileSize: '25gb' }, { fileSize: '0' }, { fileSize: '-5' }, { fileSize: 'Infinity' }, { connectionSpeed: '1e400' }, { connectionSpeed: 'fast' }]) {
      expect(run(bad)).toEqual([]);
    }
  });
});

describe('edpi audit', () => {
  const run = (o: Record<string, string>) => edpi.calculate({ mouseDpi: '800', sensitivity: '2', currentGame: 'CS:GO', ...o }) as R;

  it('cm/360 uses each game\'s own yaw (0.022 CS, 0.07 Valorant, 0.0066 Overwatch, 0.00573 R6)', () => {
    expect(val(run({}), 'cmPer360')).toBe('26.0 cm (10.2 in)');
    expect(val(run({ currentGame: 'Valorant', sensitivity: '0.35' }), 'cmPer360')).toBe('46.7 cm (18.4 in)'); // was 148 cm
    expect(val(run({ currentGame: 'Overwatch', sensitivity: '6' }), 'cmPer360')).toBe('28.9 cm (11.4 in)');
    expect(val(run({ currentGame: 'Rainbow Six Siege', sensitivity: '1' }), 'cmPer360')).toBe('199.5 cm (78.5 in)');
  });

  it('conversions preserve cm/360: CS 1.1 = Valorant 0.3457 (worked example), CS 1.0 = Overwatch 3.3333 = R6 3.8397', () => {
    expect(val(run({ sensitivity: '1.1', targetGame: 'Valorant' }), 'targetSensitivity')).toBe('0.3457');
    expect(val(run({ sensitivity: '1', targetGame: 'Overwatch' }), 'targetSensitivity')).toBe('3.3333');
    expect(val(run({ sensitivity: '1', targetGame: 'Rainbow Six Siege' }), 'targetSensitivity')).toBe('3.8397');
    expect(val(run({ sensitivity: '1', targetGame: 'Apex Legends' }), 'targetSensitivity')).toBe('1.0000');
  });

  it('a round trip lands back on the same sensitivity, and the converted value gives the same cm/360', () => {
    const toValorant = Number(val(run({ sensitivity: '2', targetGame: 'Valorant' }), 'targetSensitivity'));
    const back = Number(val(run({ currentGame: 'Valorant', sensitivity: String(toValorant), targetGame: 'CS:GO' }), 'targetSensitivity'));
    expect(back).toBeCloseTo(2, 3);
    expect(val(run({ currentGame: 'Valorant', sensitivity: String(toValorant) }), 'cmPer360')).toBe(val(run({}), 'cmPer360'));
  });

  it('eDPI is just DPI x sensitivity', () => {
    expect(val(run({ mouseDpi: '400', sensitivity: '3' }), 'edpi')).toBe('1200');
  });

  it('rejects junk', () => {
    expect(run({ mouseDpi: '800dpi' })).toEqual([]);
    expect(run({ sensitivity: '0' })).toEqual([]);
    expect(run({ sensitivity: '-1' })).toEqual([]);
    expect(run({ mouseDpi: 'Infinity' })).toEqual([]);
  });
});
