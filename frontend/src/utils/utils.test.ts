import { describe, expect, it } from 'vitest';
import { positionsAreEqual, quaternionsAreEqual } from './utils';
import * as THREE from 'three';

describe('Utility Functions', () => {
  describe('positionsAreEqual', () => {
    it('should return true for identical positions', () => {
      const pos1 = new THREE.Vector3(1, 2, 3);
      const pos2 = new THREE.Vector3(1, 2, 3);

      expect(positionsAreEqual(pos1, pos2)).toBe(true);
    });

    it('should return true for positions within precision tolerance (2 decimal places)', () => {
      const pos1 = new THREE.Vector3(1.001, 2.002, 3.003);
      const pos2 = new THREE.Vector3(1.002, 2.003, 3.004);

      expect(positionsAreEqual(pos1, pos2)).toBe(true);
    });

    it('should return false for different positions', () => {
      const pos1 = new THREE.Vector3(1, 2, 3);
      const pos2 = new THREE.Vector3(4, 5, 6);

      expect(positionsAreEqual(pos1, pos2)).toBe(false);
    });

    it('should return false for positions differing beyond precision tolerance', () => {
      const pos1 = new THREE.Vector3(1.00, 2.00, 3.00);
      const pos2 = new THREE.Vector3(1.05, 2.00, 3.00);

      expect(positionsAreEqual(pos1, pos2)).toBe(false);
    });

    it('should handle negative values correctly', () => {
      const pos1 = new THREE.Vector3(-1.001, -2.002, -3.003);
      const pos2 = new THREE.Vector3(-1.002, -2.003, -3.004);

      expect(positionsAreEqual(pos1, pos2)).toBe(true);
    });

    it('should handle zero values correctly', () => {
      const pos1 = new THREE.Vector3(0, 0, 0);
      const pos2 = new THREE.Vector3(0, 0, 0);

      expect(positionsAreEqual(pos1, pos2)).toBe(true);
    });

    it('should handle very small differences correctly', () => {
      const pos1 = new THREE.Vector3(0.001, 0.001, 0.001);
      const pos2 = new THREE.Vector3(0.002, 0.002, 0.002);

      expect(positionsAreEqual(pos1, pos2)).toBe(true);
    });

    it('should handle large values correctly', () => {
      const pos1 = new THREE.Vector3(1000.001, 2000.002, 3000.003);
      const pos2 = new THREE.Vector3(1000.002, 2000.003, 3000.004);

      expect(positionsAreEqual(pos1, pos2)).toBe(true);
    });
  });

  describe('quaternionsAreEqual', () => {
    it('should return true for identical quaternions', () => {
      const q1 = new THREE.Quaternion(0, 0, 0, 1);
      const q2 = new THREE.Quaternion(0, 0, 0, 1);

      expect(quaternionsAreEqual(q1, q2)).toBe(true);
    });

    it('should return false for different quaternions', () => {
      const q1 = new THREE.Quaternion(0, 0, 0, 1);
      const q2 = new THREE.Quaternion(0.5, 0.5, 0.5, 0.5);

      expect(quaternionsAreEqual(q1, q2)).toBe(false);
    });

    it('should handle rotations from Euler angles correctly', () => {
      const euler = new THREE.Euler(Math.PI / 4, Math.PI / 2, 0);
      const q1 = new THREE.Quaternion().setFromEuler(euler);
      const q2 = new THREE.Quaternion().setFromEuler(euler);

      expect(quaternionsAreEqual(q1, q2)).toBe(true);
    });

    it('should detect differences in rotation', () => {
      const euler1 = new THREE.Euler(Math.PI / 4, 0, 0);
      const euler2 = new THREE.Euler(Math.PI / 2, 0, 0);
      const q1 = new THREE.Quaternion().setFromEuler(euler1);
      const q2 = new THREE.Quaternion().setFromEuler(euler2);

      expect(quaternionsAreEqual(q1, q2)).toBe(false);
    });

    it('should handle identity quaternion correctly', () => {
      const q1 = new THREE.Quaternion();
      const q2 = new THREE.Quaternion();

      expect(quaternionsAreEqual(q1, q2)).toBe(true);
    });

    it('should handle Y-axis rotation correctly', () => {
      const q1 = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(0, Math.PI / 2, 0)
      );
      const q2 = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(0, Math.PI / 2, 0)
      );

      expect(quaternionsAreEqual(q1, q2)).toBe(true);
    });

    it('should be sensitive to very small quaternion differences', () => {
      const q1 = new THREE.Quaternion(0.1, 0.2, 0.3, 0.9);
      const q2 = new THREE.Quaternion(0.1, 0.2, 0.3, 0.9000001);

      // Due to exact string comparison, even tiny differences should be detected
      expect(quaternionsAreEqual(q1, q2)).toBe(false);
    });
  });
});
