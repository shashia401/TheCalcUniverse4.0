import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/ip-subnet';
import { getValue, parseNumber, near } from '../../helpers';

describe('IP Subnet Calculator', () => {
  it('calculates /24 subnet correctly', () => {
    const r = config.calculate({
      ipAddress: '192.168.1.0',
      cidr: '24',
    });
    expect(getValue(r, 'networkAddress')).toBe('192.168.1.0');
    expect(getValue(r, 'broadcastAddress')).toBe('192.168.1.255');
    expect(getValue(r, 'subnetMask')).toBe('255.255.255.0');
    expect(getValue(r, 'totalHosts')).toBe('254');
  });

  it('calculates /16 subnet correctly', () => {
    const r = config.calculate({
      ipAddress: '10.0.0.0',
      cidr: '16',
    });
    expect(getValue(r, 'networkAddress')).toBe('10.0.0.0');
    expect(getValue(r, 'subnetMask')).toBe('255.255.0.0');
    expect(getValue(r, 'totalHosts')).toBe('65534');
  });

  it('detects private IP addresses', () => {
    const r = config.calculate({
      ipAddress: '192.168.1.10',
      cidr: '24',
    });
    expect(getValue(r, 'ipType')).toBe('Private');
  });

  it('handles /32 (single host)', () => {
    const r = config.calculate({
      ipAddress: '10.0.0.1',
      cidr: '32',
    });
    expect(getValue(r, 'totalHosts')).toBe('1');
  });

  it('returns empty array for empty IP', () => {
    const r = config.calculate({
      ipAddress: '',
      cidr: '24',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array for empty CIDR', () => {
    const r = config.calculate({
      ipAddress: '192.168.1.0',
      cidr: '',
    });
    expect(r).toEqual([]);
  });

  it('detects loopback addresses', () => {
    const r = config.calculate({
      ipAddress: '127.0.0.1',
      cidr: '8',
    });
    expect(getValue(r, 'ipType')).toBe('Loopback');
  });
});
