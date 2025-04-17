import { Ref } from 'react';
import * as THREE from 'three';
interface BoundsProps {
  minBoundsZRef: Ref<
    THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes>>
  >;
  maxBoundsZRef: Ref<
    THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes>>
  >;
  minBoundsXRef: Ref<
    THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes>>
  >;
  maxBoundsXRef: Ref<
    THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes>>
  >;
  minBoundsYRef: Ref<
    THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes>>
  >;
}
const CollisionBounds = ({
  minBoundsZRef,
  maxBoundsZRef,
  maxBoundsXRef,
  minBoundsXRef,
  minBoundsYRef,
}: BoundsProps) => {
  return (
    <>
      <mesh position={[0, 48, -120]} ref={minBoundsZRef}>
        <boxGeometry args={[200, 155, 105]} />
        <meshPhongMaterial color="#ff0000" opacity={0} transparent />
      </mesh>
      <mesh position={[0, 48, 125]} ref={maxBoundsZRef}>
        <boxGeometry args={[200, 155, 105]} />
        <meshPhongMaterial color="#ff0000" opacity={0} transparent />
      </mesh>
      <mesh position={[148, 48, 0]} ref={maxBoundsXRef}>
        <boxGeometry args={[100, 155, 150]} />
        <meshPhongMaterial color="#fbff00" opacity={0} transparent />
      </mesh>
      <mesh position={[-144.2, 48, 0]} ref={minBoundsXRef}>
        <boxGeometry args={[100, 155, 150]} />
        <meshPhongMaterial color="#003cff" opacity={0} transparent />
      </mesh>
      <mesh position={[0, -23.5, 0]} ref={minBoundsYRef}>
        <boxGeometry args={[200, 105, 225]} />
        <meshPhongMaterial color="#ff0000" opacity={0} transparent />
      </mesh>
    </>
  );
};

export default CollisionBounds;
