import * as THREE from 'three';
export const positionsAreEqual = (pos1: THREE.Vector3, pos2: THREE.Vector3) =>
  pos1
    .toArray()
    .map((_: number) => _.toFixed(2))
    .toString() ===
  pos2
    .toArray()
    .map((_: number) => _.toFixed(2))
    .toString();

export const quaternionsAreEqual = (
  q1: THREE.Quaternion,
  q2: THREE.Quaternion
) => q1.toArray().toString() === q2.toArray().toString();
