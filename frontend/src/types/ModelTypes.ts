import { ComponentType } from 'react';
import { OrbitControls } from 'three-stdlib';

import * as THREE from 'three';
interface ModelComponentProps {
  transformMode?: string;
  isHovered?: string | null;
  setIsHovered?: React.Dispatch<React.SetStateAction<string | null>>;
  isSelected?: string | null;
  setIsSelected?: React.Dispatch<React.SetStateAction<string | null>>;
  setTransformMode?: React.Dispatch<React.SetStateAction<string>>;
  key?: any;
  name?: string;
  orbit?: React.RefObject<OrbitControls | null>;
  preview?: boolean;
}

export interface ModelInCanvas {
  name: string;
  id: string;
  position: THREE.Vector3;
  rotation: THREE.Quaternion;
}
export type ModelComponentType = ComponentType<ModelComponentProps>;
