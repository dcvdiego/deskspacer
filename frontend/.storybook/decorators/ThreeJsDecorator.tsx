import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { DecoratorFunction } from '@storybook/types';

interface CanvasWrapperProps {
  children: React.ReactNode;
  cameraPosition?: [number, number, number];
  cameraFov?: number;
  controls?: boolean;
  lights?: boolean;
}

export const CanvasWrapper: React.FC<CanvasWrapperProps> = ({
  children,
  cameraPosition = [70, 35, 20],
  cameraFov = 50,
  controls = true,
  lights = true,
}) => {
  return (
    <div style={{ width: '100%', height: '600px' }}>
      <Canvas
        camera={{
          position: cameraPosition,
          fov: cameraFov,
        }}
        style={{ background: '#1a1a1a' }}
      >
        {lights && <ambientLight intensity={0.5} />}
        {lights && <directionalLight position={[10, 10, 5]} intensity={1} />}
        {children}
        {controls && <OrbitControls />}
      </Canvas>
    </div>
  );
};

export const withThreeJsCanvas = (
  options: Partial<CanvasWrapperProps> = {}
): DecoratorFunction<any> => {
  return (Story) => (
    <CanvasWrapper {...options}>
      <Story />
    </CanvasWrapper>
  );
};
