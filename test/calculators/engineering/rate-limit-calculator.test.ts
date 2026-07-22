import { describe, it, expect } from 'vitest';
import rateLimitConfig from '../../../src/calculators/engineering/rate-limit/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('API Rate Limit Calculator', () => {
  it('calculates RPS correctly from RPM', () => {
    const results = rateLimitConfig.calculate({
      maxRpm: '60000',
      avgPayloadSize: '50',
      peakConcurrentUsers: '',
      serverType: 'custom',
    });
    const rps = parseNumber(getValue(results, 'rps'));
    near(rps, 1000, 1); // 60000 / 60 = 1000
  });

  it('calculates bandwidth correctly', () => {
    const results = rateLimitConfig.calculate({
      maxRpm: '60000',
      avgPayloadSize: '50',
      peakConcurrentUsers: '',
      serverType: 'custom',
    });
    const bandwidthKbps = parseFloat(getValue(results, 'bandwidthKbps').replace(/,/g, ''));
    near(bandwidthKbps, 50000, 100); // 1000 RPS * 50 KB = 50000 KB/s
  });

  it('calculates daily capacity', () => {
    const results = rateLimitConfig.calculate({
      maxRpm: '1000',
      avgPayloadSize: '10',
      peakConcurrentUsers: '',
      serverType: 'custom',
    });
    const daily = parseFloat(getValue(results, 'dailyCapacity').replace(/,/g, ''));
    near(daily, 1440000, 1000); // 1000 * 60 * 24
  });

  it('returns empty for invalid inputs', () => {
    const results = rateLimitConfig.calculate({
      maxRpm: '',
      avgPayloadSize: '',
      peakConcurrentUsers: '',
      serverType: 'custom',
    });
    expect(results).toEqual([]);
  });

  it('calculates per-user RPM when concurrent users provided', () => {
    const results = rateLimitConfig.calculate({
      maxRpm: '60000',
      avgPayloadSize: '50',
      peakConcurrentUsers: '1000',
      serverType: 'custom',
    });
    const perUser = parseNumber(getValue(results, 'perUserRpm'));
    near(perUser, 60, 0.5); // 60000 / 1000 = 60
  });

  it('shows per-user RPM as N/A without concurrent users', () => {
    const results = rateLimitConfig.calculate({
      maxRpm: '60000',
      avgPayloadSize: '50',
      peakConcurrentUsers: '',
      serverType: 'custom',
    });
    const perUser = getValue(results, 'perUserRpm');
    expect(perUser).toContain('N/A');
  });

  it('has all required result IDs', () => {
    const results = rateLimitConfig.calculate({
      maxRpm: '60000',
      avgPayloadSize: '50',
      peakConcurrentUsers: '1000',
      serverType: 'aws-api-gateway',
    });
    const ids = results.map((r) => r.id);
    expect(ids).toContain('rps');
    expect(ids).toContain('bandwidthKbps');
    expect(ids).toContain('bandwidthMbps');
    expect(ids).toContain('dailyCapacity');
    expect(ids).toContain('burstLimit');
    expect(ids).toContain('maxConcurrent');
    expect(ids).toContain('serverType');
    expect(ids).toContain('rpm');
    expect(ids).toContain('perUserRpm');
  });

  it('uses correct server label per type', () => {
    const results = rateLimitConfig.calculate({
      maxRpm: '60000',
      avgPayloadSize: '50',
      peakConcurrentUsers: '',
      serverType: 'aws-api-gateway',
    });
    const server = getValue(results, 'serverType');
    expect(server).toContain('AWS API Gateway');
  });
});
