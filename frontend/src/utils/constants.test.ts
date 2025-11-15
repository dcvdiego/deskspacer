import { describe, expect, it } from 'vitest';
import { heightAdjustmentMap } from './constants';

describe('Constants', () => {
  describe('heightAdjustmentMap', () => {
    it('should be defined', () => {
      expect(heightAdjustmentMap).toBeDefined();
    });

    it('should be an object', () => {
      expect(typeof heightAdjustmentMap).toBe('object');
    });

    it('should have standing desk height adjustment', () => {
      expect(heightAdjustmentMap.standing).toBe(0.25);
    });

    it('should have alex desk height adjustment', () => {
      expect(heightAdjustmentMap.alex).toBe(-1.5);
    });

    it('should have l_shaped desk height adjustment', () => {
      expect(heightAdjustmentMap.l_shaped).toBe(0.87);
    });

    it('should have regular desk height adjustment', () => {
      expect(heightAdjustmentMap.regular).toBe(1.08);
    });

    it('should have linnmon desk height adjustment', () => {
      expect(heightAdjustmentMap.linnmon).toBe(0);
    });

    it('should have malm desk height adjustment', () => {
      expect(heightAdjustmentMap.malm).toBe(-1.7);
    });

    it('should have output desk height adjustment', () => {
      expect(heightAdjustmentMap.output).toBe(0.25);
    });

    it('should have numeric values for all keys', () => {
      Object.values(heightAdjustmentMap).forEach((value) => {
        expect(typeof value).toBe('number');
      });
    });

    it('should support negative height adjustments', () => {
      const negativeAdjustments = Object.values(heightAdjustmentMap).filter(
        (value) => value < 0
      );
      expect(negativeAdjustments.length).toBeGreaterThan(0);
    });

    it('should support zero height adjustment', () => {
      const zeroAdjustments = Object.values(heightAdjustmentMap).filter(
        (value) => value === 0
      );
      expect(zeroAdjustments.length).toBeGreaterThan(0);
    });

    it('should support positive height adjustments', () => {
      const positiveAdjustments = Object.values(heightAdjustmentMap).filter(
        (value) => value > 0
      );
      expect(positiveAdjustments.length).toBeGreaterThan(0);
    });

    it('should use lowercase keys', () => {
      Object.keys(heightAdjustmentMap).forEach((key) => {
        expect(key).toBe(key.toLowerCase());
      });
    });
  });
});
