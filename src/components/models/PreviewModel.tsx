import { useFrame } from '@react-three/fiber';
import { Center } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';
interface PreviewModelProps {
  children: React.ReactNode;
  rotationSpeed?: number;
  cacheKey: string | null;
}
const PreviewModel = ({
  children,
  rotationSpeed = 1,
  cacheKey,
}: PreviewModelProps) => {
  const ref = useRef<THREE.Group<THREE.Object3DEventMap>>(null);

  useFrame((_state, delta) => {
    if (ref.current) ref.current.rotation.y += delta * rotationSpeed;
  });

  return (
    <Center cacheKey={cacheKey} ref={ref}>
      {children}
    </Center>
  );
};

export default PreviewModel;
