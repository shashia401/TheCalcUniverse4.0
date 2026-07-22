import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/ip-subnet/index';
import { getValue } from '../../helpers';

describe('IP Subnet Calculator', () => {
  describe('192.168.1.0/24', () => {
    const r = config.calculate({ ipAddress: '192.168.1.0', cidr: '24' });

    it('calculates network address', () => {
      expect(getValue(r, 'networkAddress')).toBe('192.168.1.0');
    });

    it('calculates broadcast address', () => {
      expect(getValue(r, 'broadcastAddress')).toBe('192.168.1.255');
    });

    it('calculates usable host range', () => {
      expect(getValue(r, 'usableRange')).toBe('192.168.1.1 — 192.168.1.254');
    });

    it('calculates usable hosts', () => {
      expect(getValue(r, 'totalHosts')).toBe('254');
    });

    it('calculates subnet mask', () => {
      expect(getValue(r, 'subnetMask')).toBe('255.255.255.0');
    });

    it('calculates CIDR notation', () => {
      expect(getValue(r, 'cidrNotation')).toBe('/24');
    });
  });

  describe('10.0.0.0/8', () => {
    const r = config.calculate({ ipAddress: '10.0.0.0', cidr: '8' });

    it('calculates network address', () => {
      expect(getValue(r, 'networkAddress')).toBe('10.0.0.0');
    });

    it('calculates broadcast address', () => {
      expect(getValue(r, 'broadcastAddress')).toBe('10.255.255.255');
    });

    it('calculates usable hosts', () => {
      expect(getValue(r, 'totalHosts')).toBe('16777214');
    });
  });

  describe('172.16.0.0/12', () => {
    const r = config.calculate({ ipAddress: '172.16.0.0', cidr: '12' });

    it('calculates CIDR notation', () => {
      expect(getValue(r, 'cidrNotation')).toBe('/12');
    });

    it('calculates subnet mask', () => {
      expect(getValue(r, 'subnetMask')).toBe('255.240.0.0');
    });
  });

  describe('/32 (single host)', () => {
    const r = config.calculate({ ipAddress: '192.168.1.1', cidr: '32' });

    it('has 1 usable host', () => {
      expect(getValue(r, 'totalHosts')).toBe('1');
    });

    it('network equals the IP itself', () => {
      expect(getValue(r, 'networkAddress')).toBe('192.168.1.1');
    });

    it('broadcast equals the IP itself', () => {
      expect(getValue(r, 'broadcastAddress')).toBe('192.168.1.1');
    });

    it('usable range is single IP', () => {
      expect(getValue(r, 'usableRange')).toBe('192.168.1.1 — 192.168.1.1');
    });
  });

  describe('/31 (RFC 3021 point-to-point)', () => {
    const r = config.calculate({ ipAddress: '10.0.0.0', cidr: '31' });

    it('has 2 usable hosts', () => {
      expect(getValue(r, 'totalHosts')).toBe('2');
    });

    it('both addresses are usable', () => {
      expect(getValue(r, 'usableRange')).toBe('10.0.0.0 — 10.0.0.1');
    });
  });

  describe('IP Class detection', () => {
    it('detects Class A for 10.x.x.x', () => {
      const r = config.calculate({ ipAddress: '10.0.0.1', cidr: '24' });
      expect(getValue(r, 'ipClass')).toBe('A');
    });

    it('detects Class C for 192.168.x.x', () => {
      const r = config.calculate({ ipAddress: '192.168.1.0', cidr: '24' });
      expect(getValue(r, 'ipClass')).toBe('C');
    });

    it('detects Class B for 172.16.x.x', () => {
      const r = config.calculate({ ipAddress: '172.16.0.0', cidr: '16' });
      expect(getValue(r, 'ipClass')).toBe('B');
    });
  });

  describe('IP Type detection', () => {
    it('detects Private for 10.x.x.x', () => {
      const r = config.calculate({ ipAddress: '10.0.0.1', cidr: '24' });
      expect(getValue(r, 'ipType')).toBe('Private');
    });

    it('detects Private for 192.168.x.x', () => {
      const r = config.calculate({ ipAddress: '192.168.1.0', cidr: '24' });
      expect(getValue(r, 'ipType')).toBe('Private');
    });

    it('detects Private for 172.16-31.x.x', () => {
      const r = config.calculate({ ipAddress: '172.20.0.0', cidr: '16' });
      expect(getValue(r, 'ipType')).toBe('Private');
    });

    it('detects Loopback for 127.x.x.x', () => {
      const r = config.calculate({ ipAddress: '127.0.0.1', cidr: '8' });
      expect(getValue(r, 'ipType')).toBe('Loopback');
    });

    it('detects Link-Local for 169.254.x.x', () => {
      const r = config.calculate({ ipAddress: '169.254.1.1', cidr: '16' });
      expect(getValue(r, 'ipType')).toBe('Link-Local');
    });

    it('detects Public for 8.8.8.8', () => {
      const r = config.calculate({ ipAddress: '8.8.8.8', cidr: '24' });
      expect(getValue(r, 'ipType')).toBe('Public');
    });
  });

  describe('Binary representation', () => {
    it('formats IP binary with dots', () => {
      const r = config.calculate({ ipAddress: '192.168.1.0', cidr: '24' });
      expect(getValue(r, 'ipBinary')).toBe('11000000.10101000.00000001.00000000');
    });

    it('formats mask binary with dots', () => {
      const r = config.calculate({ ipAddress: '192.168.1.0', cidr: '24' });
      expect(getValue(r, 'maskBinary')).toBe('11111111.11111111.11111111.00000000');
    });

    it('pads each octet to 8 bits', () => {
      const r = config.calculate({ ipAddress: '10.0.0.1', cidr: '8' });
      expect(getValue(r, 'ipBinary')).toBe('00001010.00000000.00000000.00000001');
    });
  });

  describe('Validation', () => {
    it('returns empty for empty IP', () => {
      const r = config.calculate({ ipAddress: '', cidr: '24' });
      expect(r).toEqual([]);
    });

    it('returns empty for invalid IP with 3 octets', () => {
      const r = config.calculate({ ipAddress: '192.168.1', cidr: '24' });
      expect(r).toEqual([]);
    });

    it('returns empty for invalid IP with 5 octets', () => {
      const r = config.calculate({ ipAddress: '192.168.1.1.5', cidr: '24' });
      expect(r).toEqual([]);
    });

    it('returns empty for IP with out-of-range octet', () => {
      const r = config.calculate({ ipAddress: '192.168.1.256', cidr: '24' });
      expect(r).toEqual([]);
    });

    it('returns empty for non-numeric IP', () => {
      const r = config.calculate({ ipAddress: 'abc.def.ghi.jkl', cidr: '24' });
      expect(r).toEqual([]);
    });

    it('returns empty for missing CIDR', () => {
      const r = config.calculate({ ipAddress: '192.168.1.0', cidr: '' });
      expect(r).toEqual([]);
    });

    it('returns empty for CIDR out of range', () => {
      const r = config.calculate({ ipAddress: '192.168.1.0', cidr: '33' });
      expect(r).toEqual([]);
    });

    it('returns empty for negative CIDR', () => {
      const r = config.calculate({ ipAddress: '192.168.1.0', cidr: '-1' });
      expect(r).toEqual([]);
    });

    it('rejects IPs with leading zeros', () => {
      const r = config.calculate({ ipAddress: '192.168.01.0', cidr: '24' });
      expect(r).toEqual([]);
    });
  });

  describe('Educational content', () => {
    it('has formula defined', () => {
      expect(config.educational.formula).toBeTruthy();
    });

    it('has 3 variables', () => {
      expect(config.educational.variables).toHaveLength(3);
    });

    it('has how-to-use instructions', () => {
      expect(config.educational.howToUse?.length).toBeGreaterThanOrEqual(1);
    });

    it('has explanation', () => {
      expect(config.educational.explanation).toBeTruthy();
    });

    it('has 3 FAQs', () => {
      expect(config.educational.faqs).toHaveLength(3);
    });
  });
});
