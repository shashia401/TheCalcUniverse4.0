import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/engineering/rate-limit';
import { computeThroughput } from '../../../src/calculators/engineering/rate-limit/rateLimitMath';
import { getResult, getValue, parseNumber, near } from '../../helpers';

const run = (v: Record<string, string>) => config.calculate({ maxRpm: '', avgPayloadSize: '', peakConcurrentUsers: '', burstRpm: '', ...v });

// Bandwidth: KB/s x 1024 B x 8 bit / 1e6 = Mbps. (The old calculator divided KB/s by 1024 and called it Mbps, which is MB/s.)
describe('rate-limit audit', () => {
  it('60,000 RPM x 50 KB = 1,000 RPS, 50,000 KB/s, 409.6 Mbps (not 48.83), 132.71 TB per 30 days', () => {
    const r = run({ maxRpm: '60000', avgPayloadSize: '50', peakConcurrentUsers: '1000' });
    expect(getValue(r, 'rps')).toBe('1,000 req/s');
    expect(getValue(r, 'bandwidthKbps')).toBe('50,000 KB/s');
    expect(getValue(r, 'bandwidthMbps')).toBe('409.6 Mbps');
    expect(getValue(r, 'monthlyTransfer')).toBe('132.71 TB');
    expect(getValue(r, 'dailyCapacity')).toBe('86,400,000 req/day');
    expect(getValue(r, 'perUserRpm')).toBe('60.00 RPM/user');
  });
  it('1 Mbps sanity: 125,000 bytes/s is exactly 1 Mbps', () => {
    near(computeThroughput(60, 125000 / 1024).mbps, 1, 1e-9);
  });
  it('small service: 5,000 RPM x 2 KB = 83.3 RPS, 1.37 Mbps, 0.44 TB/month, 7.2M req/day', () => {
    const r = run({ maxRpm: '5000', avgPayloadSize: '2' });
    expect(getValue(r, 'rps')).toBe('83.3 req/s');
    expect(getValue(r, 'bandwidthMbps')).toBe('1.37 Mbps');
    expect(getValue(r, 'monthlyTransfer')).toBe('0.44 TB');
    expect(getValue(r, 'dailyCapacity')).toBe('7,200,000 req/day');
    expect(getValue(r, 'perUserRpm')).toMatch(/N\/A/);
  });
  it('no invented provider limits: no burst/concurrency rows unless the user supplies a burst limit', () => {
    const base = run({ maxRpm: '1000', avgPayloadSize: '10' });
    expect(base.some((x) => x.id === 'burstLimit' || x.id === 'maxConcurrent' || x.id === 'serverType')).toBe(false);
    expect(config.inputs.some((i) => i.id === 'serverType')).toBe(false);
  });
  it('user-supplied burst: ratio shown; burst below sustained warns', () => {
    expect(getValue(run({ maxRpm: '1000', avgPayloadSize: '10', burstRpm: '5000' }), 'burstLimit')).toBe('5,000 RPM burst (5x the sustained rate)');
    expect(getResult(run({ maxRpm: '1000', avgPayloadSize: '10', burstRpm: '500' }), 'burstLimit').warning).toMatch(/below the sustained/);
    expect(getResult(run({ maxRpm: '1000', avgPayloadSize: '10', burstRpm: '5000' }), 'burstLimit').warning).toBeUndefined();
  });
  it('invalid input returns []', () => {
    expect(run({ maxRpm: '0', avgPayloadSize: '10' })).toEqual([]);
    expect(run({ maxRpm: '10', avgPayloadSize: '' })).toEqual([]);
    expect(parseNumber('1')).toBe(1);
  });
});
