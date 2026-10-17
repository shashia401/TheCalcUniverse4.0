import { describe, it, expect } from 'vitest';
import subnet from '../../../src/calculators/math/ip-subnet';

// Expected values worked out by hand from the bit patterns (and checked against Python's ipaddress module).
type R = { id: string; value: string }[];
const val = (r: R, id: string) => r.find((x) => x.id === id)?.value;
const run = (ipAddress: string, cidr: string) => subnet.calculate({ ipAddress, cidr }) as R;

describe('ip-subnet audit', () => {
  it('192.168.1.10/24', () => {
    const r = run('192.168.1.10', '24');
    expect(val(r, 'networkAddress')).toBe('192.168.1.0');
    expect(val(r, 'broadcastAddress')).toBe('192.168.1.255');
    expect(val(r, 'usableRange')).toBe('192.168.1.1 — 192.168.1.254');
    expect(val(r, 'totalHosts')).toBe('254');
    expect(val(r, 'subnetMask')).toBe('255.255.255.0');
    expect(val(r, 'wildcardMask')).toBe('0.0.0.255');
    expect(val(r, 'totalAddresses')).toBe('256');
  });

  it('non-octet-aligned prefixes: 10.0.0.77/28 and 172.16.5.130/26', () => {
    const a = run('10.0.0.77', '28');
    expect(val(a, 'networkAddress')).toBe('10.0.0.64');
    expect(val(a, 'broadcastAddress')).toBe('10.0.0.79');
    expect(val(a, 'usableRange')).toBe('10.0.0.65 — 10.0.0.78');
    expect(val(a, 'totalHosts')).toBe('14');
    const b = run('172.16.5.130', '26');
    expect(val(b, 'networkAddress')).toBe('172.16.5.128');
    expect(val(b, 'broadcastAddress')).toBe('172.16.5.191');
    expect(val(b, 'totalHosts')).toBe('62');
    expect(val(b, 'subnetMask')).toBe('255.255.255.192');
  });

  it('edges: /0, /8, /31 (RFC 3021) and /32', () => {
    const z = run('0.0.0.0', '0');
    expect(val(z, 'broadcastAddress')).toBe('255.255.255.255');
    expect(val(z, 'totalHosts')).toBe('4294967294');
    expect(val(z, 'totalAddresses')).toBe('4,294,967,296');
    expect(val(run('10.1.2.3', '8'), 'totalHosts')).toBe('16777214');
    const p2p = run('192.168.1.4', '31');
    expect(val(p2p, 'usableRange')).toBe('192.168.1.4 — 192.168.1.5');
    expect(val(p2p, 'totalHosts')).toBe('2');
    const host = run('192.168.1.7', '32');
    expect(val(host, 'totalHosts')).toBe('1');
    expect(val(host, 'networkAddress')).toBe('192.168.1.7');
  });

  it('dotted subnet masks and the a.b.c.d/nn form are understood', () => {
    expect(val(run('192.168.1.10', '255.255.255.0'), 'cidrNotation')).toBe('/24');
    expect(val(run('192.168.1.10', '255.255.255.192'), 'cidrNotation')).toBe('/26');
    expect(val(run('192.168.1.10', '/24'), 'cidrNotation')).toBe('/24');
    expect(val(run('192.168.1.10/26', ''), 'cidrNotation')).toBe('/26');
    expect(val(run('192.168.1.10/26', '24'), 'cidrNotation')).toBe('/24'); // the prefix box wins
  });

  it('address types follow the special-purpose ranges', () => {
    const type = (ip: string) => val(run(ip, '24'), 'ipType');
    expect(type('100.64.1.1')).toBe('Shared (carrier-grade NAT)');
    expect(type('100.63.0.1')).toBe('Public');
    expect(type('100.128.0.1')).toBe('Public');
    expect(type('224.0.0.5')).toBe('Multicast');
    expect(type('240.0.0.1')).toBe('Reserved');
    expect(type('0.0.0.0')).toBe('Unspecified (this network)');
    expect(type('203.0.113.9')).toBe('Documentation');
    expect(type('198.18.0.1')).toBe('Benchmarking');
    expect(type('8.8.8.8')).toBe('Public');
    expect(type('172.32.0.1')).toBe('Public'); // just outside 172.16.0.0/12
  });

  it('127.x.x.x is class A (it was "Unknown")', () => {
    expect(val(run('127.0.0.1', '8'), 'ipClass')).toBe('A');
    expect(val(run('128.0.0.1', '16'), 'ipClass')).toBe('B');
  });

  it('rejects malformed addresses and prefixes', () => {
    for (const [ip, cidr] of [
      ['192.168.1.10', '24.5'],
      ['192.168.1.10', '24abc'],
      ['192.168.1.10', '33'],
      ['192.168.1.10', '-1'],
      ['192.168.1.10', '255.0.255.0'], // non-contiguous mask
      ['256.1.1.1', '24'],
      ['01.1.1.1', '24'],
      ['1.2.3', '24'],
      ['1.2.3.4.5', '24'],
    ]) {
      expect(run(ip, cidr)).toEqual([]);
    }
  });
});
