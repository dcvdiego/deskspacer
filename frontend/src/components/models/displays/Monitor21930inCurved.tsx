/*
Auto-generated by: https://github.com/pmndrs/gltfjsx
Command: npx gltfjsx@6.5.3 ../../../../public/glb/displays/21_9_curved_monitors_no_stand/21_9_monitor_1_curved_30in_no_stand.glb -t -E -T 
Files: ../../../../public/glb/displays/21_9_curved_monitors_no_stand/21_9_monitor_1_curved_30in_no_stand.glb [1.47MB] > /Users/diegochuman/Documents/GitHub/deskspacer/src/components/models/displays/21_9_monitor_1_curved_30in_no_stand-transformed.glb [30.41KB] (98%)
*/

import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { GLTF } from 'three-stdlib';

type GLTFResult = GLTF & {
  nodes: {
    Cube002: THREE.Mesh;
    Cube002_1: THREE.Mesh;
  };
  materials: {
    ['Material.082']: THREE.MeshStandardMaterial;
    ['Material.083']: THREE.MeshStandardMaterial;
  };
};

export default function Model(props: JSX.IntrinsicElements['group']) {
  const { nodes, materials } = useGLTF(
    '/glb/displays/21_9_curved_monitors_no_stand/21_9_monitor_1_curved_30in_no_stand-transformed.glb'
  ) as GLTFResult;
  return (
    <group {...props} dispose={null}>
      <group position={[0.01, 8.339, 2.202]}>
        <mesh
          geometry={nodes.Cube002.geometry}
          material={materials['Material.082']}
        />
        <mesh
          geometry={nodes.Cube002_1.geometry}
          material={materials['Material.083']}
        />
      </group>
    </group>
  );
}

useGLTF.preload(
  '/glb/displays/21_9_curved_monitors_no_stand/21_9_monitor_1_curved_30in_no_stand-transformed.glb'
);
