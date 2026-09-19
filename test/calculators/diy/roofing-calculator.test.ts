import { describe, it, expect } from 'vitest';
import roofingConfig from '../../../src/calculators/diy/roofing/index';
import { getValue } from '../../helpers';

describe('Roofing Calculator', () => {
  describe('gable roof calculations', () => {
    it('calculates roof area for a standard gable roof', () => {
      const results = roofingConfig.calculate({
        length: '40',
        width: '30',
        pitch: '6',
        overhang: '1',
        roofType: 'gable',
        wasteFactor: '10',
      });
      const area = getValue(results, 'roofArea');
      expect(area).toBeTruthy();
      expect(parseFloat(area)).toBeGreaterThan(1000);
    });

    it('calculates roofing squares needed', () => {
      const results = roofingConfig.calculate({
        length: '40',
        width: '30',
        pitch: '6',
        overhang: '1',
        roofType: 'gable',
        wasteFactor: '10',
      });
      const squares = getValue(results, 'squares');
      expect(squares).toContain('squares');
      expect(parseInt(squares)).toBeGreaterThan(0);
    });

    it('calculates shingle bundles needed', () => {
      const results = roofingConfig.calculate({
        length: '40',
        width: '30',
        pitch: '6',
        overhang: '1',
        roofType: 'gable',
        wasteFactor: '10',
      });
      const bundles = getValue(results, 'bundles');
      expect(bundles).toContain('bundles');
    });
  });

  describe('hip roof calculations', () => {
    it('calculates roof area for a hip roof with extra material', () => {
      const results = roofingConfig.calculate({
        length: '40',
        width: '30',
        pitch: '6',
        overhang: '1',
        roofType: 'hip',
        wasteFactor: '10',
      });
      const area = getValue(results, 'roofArea');
      expect(area).toBeTruthy();
      expect(parseFloat(area)).toBeGreaterThan(0);
    });
  });

  describe('input validation', () => {
    it('returns empty array for missing dimensions', () => {
      const results = roofingConfig.calculate({});
      expect(results).toEqual([]);
    });

    it('returns empty array for zero dimensions', () => {
      const results = roofingConfig.calculate({
        length: '0',
        width: '0',
        pitch: '6',
        roofType: 'gable',
      });
      expect(results).toEqual([]);
    });

    it('returns empty array for NaN dimensions', () => {
      const results = roofingConfig.calculate({
        length: 'abc',
        width: '30',
        pitch: '6',
        roofType: 'gable',
      });
      expect(results).toEqual([]);
    });
  });

  describe('footprint area', () => {
    it('calculates footprint area with overhang', () => {
      const results = roofingConfig.calculate({
        length: '40',
        width: '30',
        pitch: '6',
        overhang: '1',
        roofType: 'gable',
        wasteFactor: '10',
      });
      const footprint = getValue(results, 'footprintArea');
      expect(footprint).toBeTruthy();
      expect(parseFloat(footprint)).toBeGreaterThan(1300);
    });
  });

  describe('materials list', () => {
    it('produces a materials list JSON', () => {
      const results = roofingConfig.calculate({
        length: '40',
        width: '30',
        pitch: '6',
        overhang: '1',
        roofType: 'gable',
        wasteFactor: '10',
      });
      const materials = getValue(results, '_materialsList');
      expect(materials).toBeTruthy();
      const parsed = JSON.parse(materials);
      expect(parsed.squares).toBeGreaterThan(0);
      expect(parsed.bundles).toBeGreaterThan(0);
    });
  });
});
