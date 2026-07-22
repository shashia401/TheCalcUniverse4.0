import { describe, it, expect } from 'vitest';
import { calculate, formatTime } from '../../../src/calculators/math/bandwidth/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Bandwidth Calculator', () => {
  describe('file size conversions', () => {
    it('converts MB file size to Mbits correctly', () => {
      const results = calculate({
        fileSize: 100,
        fileSizeUnit: 'MB',
        connectionSpeed: 50,
        speedUnit: 'Mbps',
        tcpOverhead: 'No',
      });
      const mbits = parseNumber(getValue(results, 'File Size (Mbits)'));
      near(mbits, 800, 0.01);
    });

    it('converts GB file size to Mbits correctly', () => {
      const results = calculate({
        fileSize: 5,
        fileSizeUnit: 'GB',
        connectionSpeed: 100,
        speedUnit: 'Mbps',
        tcpOverhead: 'No',
      });
      const mbits = parseNumber(getValue(results, 'File Size (Mbits)'));
      near(mbits, 40000, 0.01);
    });

    it('converts TB file size to Mbits correctly', () => {
      const results = calculate({
        fileSize: 1,
        fileSizeUnit: 'TB',
        connectionSpeed: 1000,
        speedUnit: 'Mbps',
        tcpOverhead: 'No',
      });
      const mbits = parseNumber(getValue(results, 'File Size (Mbits)'));
      near(mbits, 8000000, 0.01);
    });
  });

  describe('transfer time calculations', () => {
    it('calculates transfer time for MB file at Mbps speed', () => {
      const results = calculate({
        fileSize: 100,
        fileSizeUnit: 'MB',
        connectionSpeed: 50,
        speedUnit: 'Mbps',
        tcpOverhead: 'No',
      });
      // 100 MB = 800 Mbit; 800 / 50 = 16 seconds
      const seconds = parseNumber(getValue(results, 'Transfer Time (seconds)'));
      near(seconds, 16, 0.01);
    });

    it('calculates transfer time for GB file at Mbps speed', () => {
      const results = calculate({
        fileSize: 5,
        fileSizeUnit: 'GB',
        connectionSpeed: 100,
        speedUnit: 'Mbps',
        tcpOverhead: 'No',
      });
      // 5 GB = 40000 Mbit; 40000 / 100 = 400 seconds
      const seconds = parseNumber(getValue(results, 'Transfer Time (seconds)'));
      near(seconds, 400, 0.01);
    });

    it('converts Gbps to Mbps correctly', () => {
      const results = calculate({
        fileSize: 1000,
        fileSizeUnit: 'MB',
        connectionSpeed: 1,
        speedUnit: 'Gbps',
        tcpOverhead: 'No',
      });
      // 1000 MB = 8000 Mbit; 1 Gbps = 1000 Mbps; 8000 / 1000 = 8 seconds
      const seconds = parseNumber(getValue(results, 'Transfer Time (seconds)'));
      near(seconds, 8, 0.01);
    });
  });

  describe('TCP overhead', () => {
    it('applies 10% TCP overhead when enabled', () => {
      const results = calculate({
        fileSize: 100,
        fileSizeUnit: 'MB',
        connectionSpeed: 50,
        speedUnit: 'Mbps',
        tcpOverhead: 'Yes',
      });
      // 100 MB = 800 Mbit; 800 / (50 * 0.9) = 17.777... seconds
      const seconds = parseNumber(getValue(results, 'Transfer Time (seconds)'));
      near(seconds, 17.78, 0.1);
    });

    it('shows TCP overhead as enabled in results', () => {
      const results = calculate({
        fileSize: 100,
        fileSizeUnit: 'MB',
        connectionSpeed: 50,
        speedUnit: 'Mbps',
        tcpOverhead: 'Yes',
      });
      expect(getValue(results, 'TCP Overhead')).toBe('10% (enabled)');
    });

    it('shows TCP overhead as disabled when not toggled', () => {
      const results = calculate({
        fileSize: 100,
        fileSizeUnit: 'MB',
        connectionSpeed: 50,
        speedUnit: 'Mbps',
        tcpOverhead: 'No',
      });
      expect(getValue(results, 'TCP Overhead')).toBe('None (disabled)');
    });

    it('transfer time is longer with TCP overhead than without', () => {
      const resultsNoOverhead = calculate({
        fileSize: 100,
        fileSizeUnit: 'MB',
        connectionSpeed: 50,
        speedUnit: 'Mbps',
        tcpOverhead: 'No',
      });
      const resultsWithOverhead = calculate({
        fileSize: 100,
        fileSizeUnit: 'MB',
        connectionSpeed: 50,
        speedUnit: 'Mbps',
        tcpOverhead: 'Yes',
      });
      const timeNoOverhead = parseNumber(getValue(resultsNoOverhead, 'Transfer Time (seconds)'));
      const timeWithOverhead = parseNumber(getValue(resultsWithOverhead, 'Transfer Time (seconds)'));
      expect(timeWithOverhead).toBeGreaterThan(timeNoOverhead);
    });
  });

  describe('edge cases', () => {
    it('returns [] for zero file size', () => {
      const results = calculate({
        fileSize: 0,
        fileSizeUnit: 'MB',
        connectionSpeed: 50,
        speedUnit: 'Mbps',
        tcpOverhead: 'No',
      });
      expect(results).toEqual([]);
    });

    it('returns [] for zero connection speed', () => {
      const results = calculate({
        fileSize: 100,
        fileSizeUnit: 'MB',
        connectionSpeed: 0,
        speedUnit: 'Mbps',
        tcpOverhead: 'No',
      });
      expect(results).toEqual([]);
    });

    it('returns [] for negative file size', () => {
      const results = calculate({
        fileSize: -10,
        fileSizeUnit: 'MB',
        connectionSpeed: 50,
        speedUnit: 'Mbps',
        tcpOverhead: 'No',
      });
      expect(results).toEqual([]);
    });

    it('returns [] for negative connection speed', () => {
      const results = calculate({
        fileSize: 100,
        fileSizeUnit: 'MB',
        connectionSpeed: -5,
        speedUnit: 'Mbps',
        tcpOverhead: 'No',
      });
      expect(results).toEqual([]);
    });

    it('returns [] for missing file size', () => {
      const results = calculate({
        fileSizeUnit: 'MB',
        connectionSpeed: 50,
        speedUnit: 'Mbps',
        tcpOverhead: 'No',
      });
      expect(results).toEqual([]);
    });

    it('returns [] for missing connection speed', () => {
      const results = calculate({
        fileSize: 100,
        fileSizeUnit: 'MB',
        speedUnit: 'Mbps',
        tcpOverhead: 'No',
      });
      expect(results).toEqual([]);
    });
  });

  describe('formatTime helper', () => {
    it('formats seconds only', () => {
      expect(formatTime(45)).toBe('45s');
    });

    it('formats minutes and seconds', () => {
      expect(formatTime(125)).toBe('2m 5s');
    });

    it('formats hours, minutes, and seconds', () => {
      expect(formatTime(3661)).toBe('1h 1m 1s');
    });

    it('handles zero seconds', () => {
      expect(formatTime(0)).toBe('0s');
    });
  });

  describe('speed display', () => {
    it('shows connection speed in MB/s', () => {
      const results = calculate({
        fileSize: 100,
        fileSizeUnit: 'MB',
        connectionSpeed: 100,
        speedUnit: 'Mbps',
        tcpOverhead: 'No',
      });
      const mbps = parseNumber(getValue(results, 'Connection Speed (Mbps)'));
      near(mbps, 100, 0.01);
    });

    it('calculates MB/s from Mbps correctly', () => {
      const results = calculate({
        fileSize: 100,
        fileSizeUnit: 'MB',
        connectionSpeed: 80,
        speedUnit: 'Mbps',
        tcpOverhead: 'No',
      });
      // 80 / 8 = 10 MB/s
      const mbps = parseNumber(getValue(results, 'Connection Speed (MB/s)'));
      near(mbps, 10, 0.01);
    });
  });
});
