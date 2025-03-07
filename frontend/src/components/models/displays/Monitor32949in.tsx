/*
Auto-generated by: https://github.com/pmndrs/gltfjsx
Command: npx gltfjsx@6.5.3 32_9_monitor_49in.glb -t -T 
Files: 32_9_monitor_49in.glb [1.49MB] > /Users/diegochuman/Documents/GitHub/deskspacer/public/glb/monitors/32_9_monitors_no_stand/32_9_monitor_49in-transformed.glb [37.93KB] (97%)
*/

import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { GLTF } from 'three-stdlib';

type GLTFResult = GLTF & {
  nodes: {
    Plane033: THREE.Mesh;
    Plane033_1: THREE.Mesh;
  };
  materials: {
    ['Material.123']: THREE.MeshStandardMaterial;
    ['Material.124']: THREE.MeshStandardMaterial;
  };
};

export default function Model(props: JSX.IntrinsicElements['group']) {
  const { nodes, materials } = useGLTF(
    '/glb/displays/32_9_monitors_no_stand/32_9_monitor_curved_49in_no_stand-transformed.glb'
  ) as GLTFResult;
  return (
    <group {...props} dispose={null}>
      <group position={[0.074, 10.526, 0]}>
        <mesh
          geometry={nodes.Plane033.geometry}
          material={materials['Material.123']}
        />
        <mesh
          geometry={nodes.Plane033_1.geometry}
          material={materials['Material.124']}
        />
      </group>
    </group>
  );
}

useGLTF.preload(
  '/glb/displays/32_9_monitors_no_stand/32_9_monitor_curved_49in_no_stand-transformed.glb'
);
